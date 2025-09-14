import { supabase } from '@/integrations/supabase/client'
import { MediaItem, MediaRail, Person, Album, Place } from '@/lib/mediaTypes'

// Media service for handling media operations
export class MediaService {
  // Fetch media items with filters
  static async fetchMediaItems(filters: {
    tab?: 'all' | 'photos' | 'videos' | 'voice'
    familyId: string
    limit?: number
    offset?: number
    searchQuery?: string
  }) {
    let query = supabase
      .from('media')
      .select(`
        id,
        file_name,
        file_path,
        mime_type,
        file_size,
        created_at,
        story_id,
        answer_id,
        recipe_id,
        thing_id,
        property_id,
        property_media_role,
        profile_id,
        family_id
      `)
      .eq('family_id', filters.familyId)
      .order('created_at', { ascending: false })

    // Filter by media type
    if (filters.tab && filters.tab !== 'all') {
      if (filters.tab === 'photos') {
        query = query.like('mime_type', 'image%')
      } else if (filters.tab === 'videos') {
        query = query.like('mime_type', 'video%')
      } else if (filters.tab === 'voice') {
        query = query.like('mime_type', 'audio%')
      }
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1)
    }

    const { data, error } = await query

    if (error) throw error

    // Transform to MediaItem format
    return data?.map(item => this.transformToMediaItem(item)) || []
  }

  // Get media counts by type
  static async getMediaCounts(familyId: string) {
    const { data: allMedia, error: allError } = await supabase
      .from('media')
      .select('mime_type', { count: 'exact' })
      .eq('family_id', familyId)

    if (allError) throw allError

    const counts = {
      all: allMedia?.length || 0,
      photos: 0,
      videos: 0,
      voice: 0
    }

    allMedia?.forEach(item => {
      if (item.mime_type?.startsWith('image/')) {
        counts.photos++
      } else if (item.mime_type?.startsWith('video/')) {
        counts.videos++
      } else if (item.mime_type?.startsWith('audio/')) {
        counts.voice++
      }
    })

    return counts
  }

  // Fetch recent captures rail
  static async fetchRecentCapturesRail(familyId: string): Promise<MediaRail> {
    const items = await this.fetchMediaItems({ 
      familyId, 
      limit: 12 
    })

    return {
      id: 'recent',
      title: "This Week's Captures",
      type: 'recent',
      items,
      hasMore: items.length === 12
    }
  }

  // Fetch people rail
  static async fetchPeopleRail(familyId: string): Promise<MediaRail> {
    const { data: people, error } = await supabase
      .from('people')
      .select(`
        id,
        full_name,
        avatar_url,
        given_name,
        surname
      `)
      .eq('family_id', familyId)
      .limit(8)

    if (error) throw error

    // Transform to Person format with media counts
    const peopleWithMedia: Person[] = await Promise.all(
      (people || []).map(async (person) => {
        // Get media count for this person (simplified - would need proper person-media linking)
        const mediaCount = Math.floor(Math.random() * 50) // Mock for now
        const recentMediaIds = [`item-${person.id}-1`, `item-${person.id}-2`, `item-${person.id}-3`]

        return {
          id: person.id,
          name: person.full_name,
          avatarUrl: person.avatar_url || undefined,
          mediaCount,
          recentMediaIds
        }
      })
    )

    return {
      id: 'people',
      title: 'People',
      type: 'people',
      items: peopleWithMedia,
      hasMore: false
    }
  }

  // Fetch albums rail
  static async fetchAlbumsRail(familyId: string): Promise<MediaRail> {
    // Mock albums for now - would need proper albums table
    const mockAlbums: Album[] = Array.from({ length: 6 }, (_, i) => ({
      id: `album-${i}`,
      name: `Family Album ${i + 1}`,
      description: `Collection of family memories ${i + 1}`,
      coverMediaId: undefined,
      mediaIds: [],
      createdAt: new Date().toISOString(),
      familyId,
      createdBy: 'user-1'
    }))

    return {
      id: 'albums',
      title: 'Events & Albums',
      type: 'events',
      items: mockAlbums,
      hasMore: false
    }
  }

  // Fetch places rail
  static async fetchPlacesRail(familyId: string): Promise<MediaRail> {
    // Mock places for now - would need proper places/location extraction
    const mockPlaces: Place[] = Array.from({ length: 5 }, (_, i) => ({
      id: `place-${i}`,
      name: `Location ${i + 1}`,
      coordinates: {
        latitude: 40.7128 + Math.random() * 10,
        longitude: -74.0060 + Math.random() * 10
      },
      mediaCount: Math.floor(Math.random() * 30),
      coverMediaId: undefined
    }))

    return {
      id: 'places',
      title: 'Places',
      type: 'places',
      items: mockPlaces,
      hasMore: false
    }
  }

  // Get signed URL for media file
  static getMediaUrl(filePath: string): string {
    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  // Alias for compatibility
  static getSignedMediaUrl = this.getMediaUrl

  // Transform database media to MediaItem
  private static transformToMediaItem(dbItem: any): MediaItem {
    const baseUrl = this.getMediaUrl(dbItem.file_path)
    
    return {
      id: dbItem.id,
      type: this.getMediaType(dbItem.mime_type),
      takenAt: dbItem.created_at,
      uploadedAt: dbItem.created_at,
      caption: undefined, // Would need to get from related story/answer
      duration: undefined, // Would need to extract from metadata
      transcriptText: undefined, // Would need voice transcription
      thumbUrl: baseUrl, // Would need thumbnail generation
      srcUrl: baseUrl,
      posterUrl: this.getMediaType(dbItem.mime_type) === 'video' ? baseUrl : undefined,
      peopleIds: [], // Would need person-media linking
      placeIds: [], // Would need location extraction
      albumIds: [], // Would need album-media linking
      favoriteCount: 0, // Would need favorites system
      familyId: dbItem.family_id,
      profileId: dbItem.profile_id
    }
  }

  private static getMediaType(mimeType: string): 'photo' | 'video' | 'voice' {
    if (mimeType?.startsWith('image/')) return 'photo'
    if (mimeType?.startsWith('video/')) return 'video'
    if (mimeType?.startsWith('audio/')) return 'voice'
    return 'photo' // default
  }
}