import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from '@/components/Header'
import { MediaTabs } from '@/components/media/MediaTabs'
import { MediaFilters } from '@/components/media/MediaFilters'
import { MediaRail } from '@/components/media/MediaRail'
import { MediaGrid } from '@/components/media/MediaGrid'
import { MediaLightbox } from '@/components/media/MediaLightbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search } from 'lucide-react'
import { MediaService } from '@/lib/mediaService'
import { supabase } from '@/integrations/supabase/client'
import { 
  MediaItem, 
  MediaFilters as MediaFiltersType, 
  MediaRail as MediaRailType,
  LightboxItem,
  Person,
  Album,
  Place,
  MediaTabOption
} from '@/lib/mediaTypes'
import { cn } from '@/lib/utils'

export default function Media() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<MediaFiltersType>({
    tab: (searchParams.get('tab') as MediaTabOption) || 'all',
    groupBy: 'day',
    sort: 'newest',
    view: 'grid',
    searchQuery: ''
  })
  
  // State for media data
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [mediaRails, setMediaRails] = useState<MediaRailType[]>([])
  const [counts, setCounts] = useState({
    all: 0,
    photos: 0,
    videos: 0,
    voice: 0
  })
  
  // Lightbox state
  const [lightboxItem, setLightboxItem] = useState<LightboxItem | null>(null)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  
  // Loading states
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [stickyFilters, setStickyFilters] = useState(false)

  // Mock data - replace with real API calls
  useEffect(() => {
    loadMediaData()
    loadMediaRails()
  }, [filters])

  // Handle scroll for sticky filters
  useEffect(() => {
    const handleScroll = () => {
      setStickyFilters(window.scrollY > 200)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  const getUserFamilyId = async () => {
    const user = await getCurrentUser()
    if (!user) return null

    const { data: memberData } = await supabase
      .from('members')
      .select('family_id')
      .eq('profile_id', user.id)
      .single()

    return memberData?.family_id || null
  }

  const loadMediaData = async () => {
    setLoading(true)
    
    try {
      const familyId = await getUserFamilyId()
      if (!familyId) {
        setLoading(false)
        return
      }

      // Fetch media items using the service
      const items = await MediaService.fetchMediaItems({
        tab: filters.tab,
        familyId,
        limit: 50,
        searchQuery: filters.searchQuery
      })

      // Get counts
      const mediaCounts = await MediaService.getMediaCounts(familyId)

      setMediaItems(items)
      setCounts(mediaCounts)
    } catch (error) {
      console.error('Error loading media:', error)
      // Use mock data as fallback
      const mockItems: MediaItem[] = Array.from({ length: 20 }, (_, i) => ({
        id: `item-${i}`,
        type: ['photo', 'video', 'voice'][i % 3] as 'photo' | 'video' | 'voice',
        takenAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedAt: new Date().toISOString(),
        caption: i % 4 === 0 ? `Caption for item ${i}` : undefined,
        duration: ['video', 'voice'].includes(['photo', 'video', 'voice'][i % 3]) ? Math.floor(Math.random() * 300) : undefined,
        transcriptText: ['photo', 'video', 'voice'][i % 3] === 'voice' ? `Transcript for voice recording ${i}` : undefined,
        thumbUrl: `https://picsum.photos/400/400?random=${i}`,
        srcUrl: `https://picsum.photos/1200/800?random=${i}`,
        posterUrl: ['photo', 'video', 'voice'][i % 3] === 'video' ? `https://picsum.photos/800/450?random=${i}` : undefined,
        peopleIds: [],
        placeIds: [],
        albumIds: [],
        favoriteCount: Math.floor(Math.random() * 10),
        familyId: 'family-1',
        profileId: 'user-1'
      }))

      const filteredItems = filters.tab === 'all' 
        ? mockItems 
        : mockItems.filter(item => {
            if (filters.tab === 'photos') return item.type === 'photo'
            if (filters.tab === 'videos') return item.type === 'video'
            if (filters.tab === 'voice') return item.type === 'voice'
            return true
          })

      setMediaItems(filteredItems)
      setCounts({
        all: mockItems.length,
        photos: mockItems.filter(i => i.type === 'photo').length,
        videos: mockItems.filter(i => i.type === 'video').length,
        voice: mockItems.filter(i => i.type === 'voice').length
      })
    }
    
    setLoading(false)
  }

  const loadMediaRails = async () => {
    try {
      const familyId = await getUserFamilyId()
      if (!familyId) return

      // Load rails using the service
      const [recentRail, peopleRail, albumsRail, placesRail] = await Promise.all([
        MediaService.fetchRecentCapturesRail(familyId),
        MediaService.fetchPeopleRail(familyId),
        MediaService.fetchAlbumsRail(familyId),
        MediaService.fetchPlacesRail(familyId)
      ])

      setMediaRails([recentRail, peopleRail, albumsRail, placesRail])
    } catch (error) {
      console.error('Error loading rails:', error)
      // Use mock rails as fallback
      const mockRails: MediaRailType[] = [
        {
          id: 'recent',
          title: "This Week's Captures",
          type: 'recent',
          items: mediaItems.slice(0, 8),
          hasMore: true
        },
        {
          id: 'people',
          title: 'People',
          type: 'people',
          items: Array.from({ length: 6 }, (_, i) => ({
            id: `person-${i}`,
            name: `Person ${i + 1}`,
            avatarUrl: `https://i.pravatar.cc/150?u=${i}`,
            mediaCount: Math.floor(Math.random() * 50),
            recentMediaIds: [`item-${i}`, `item-${i + 1}`, `item-${i + 2}`]
          } as Person)),
          hasMore: false
        },
        {
          id: 'events',
          title: 'Events & Albums',
          type: 'events',
          items: Array.from({ length: 5 }, (_, i) => ({
            id: `album-${i}`,
            name: `Album ${i + 1}`,
            description: `Description for album ${i + 1}`,
            coverMediaId: `item-${i}`,
            mediaIds: Array.from({ length: Math.floor(Math.random() * 20) }, (_, j) => `item-${i}-${j}`),
            createdAt: new Date().toISOString(),
            familyId: 'family-1',
            createdBy: 'user-1'
          } as Album)),
          hasMore: false
        },
        {
          id: 'places',
          title: 'Places',
          type: 'places',
          items: Array.from({ length: 4 }, (_, i) => ({
            id: `place-${i}`,
            name: `Place ${i + 1}`,
            coordinates: {
              latitude: 40.7128 + Math.random() * 10,
              longitude: -74.0060 + Math.random() * 10
            },
            mediaCount: Math.floor(Math.random() * 30),
            coverMediaId: `item-${i}`
          } as Place)),
          hasMore: false
        }
      ]

      setMediaRails(mockRails)
    }
  }

  const handleTabChange = (tab: MediaTabOption) => {
    setFilters(prev => ({ ...prev, tab }))
    setSearchParams(prev => {
      if (tab === 'all') {
        prev.delete('tab')
      } else {
        prev.set('tab', tab)
      }
      return prev
    })
  }

  const handleFilterChange = (key: keyof MediaFiltersType, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleQuickAction = (action: 'upload-photo' | 'record-video' | 'record-voice') => {
    // Handle quick actions
    console.log('Quick action:', action)
  }

  const handleMediaClick = (item: MediaItem, index: number) => {
    const lightboxData: LightboxItem = {
      ...item,
      index,
      total: mediaItems.length
    }
    setLightboxItem(lightboxData)
    setIsLightboxOpen(true)
  }

  const handleRailItemClick = (item: MediaItem | Person | Album | Place) => {
    if ('type' in item) {
      // It's a MediaItem
      const index = mediaItems.findIndex(mediaItem => mediaItem.id === item.id)
      if (index !== -1) {
        handleMediaClick(item as MediaItem, index)
      }
    } else {
      // Handle other item types (Person, Album, Place)
      console.log('Rail item clicked:', item)
    }
  }

  const handleLightboxNavigation = (direction: 'prev' | 'next') => {
    if (!lightboxItem) return

    const newIndex = direction === 'prev' 
      ? Math.max(0, lightboxItem.index - 1)
      : Math.min(mediaItems.length - 1, lightboxItem.index + 1)

    const newItem = mediaItems[newIndex]
    if (newItem) {
      setLightboxItem({
        ...newItem,
        index: newIndex,
        total: mediaItems.length
      })
    }
  }

  const handleLightboxActions = {
    onFavorite: (id: string) => {
      console.log('Favorite:', id)
    },
    onAddToAlbum: (id: string) => {
      console.log('Add to album:', id)
    },
    onTagPeople: (id: string, peopleIds: string[]) => {
      console.log('Tag people:', id, peopleIds)
    },
    onEditCaption: (id: string, caption: string) => {
      console.log('Edit caption:', id, caption)
    }
  }

  return (
    <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-6">
          {/* Hero Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Media</h1>
                <p className="text-muted-foreground mt-1">
                  Your family's photos, videos, and voice recordings
                </p>
              </div>
              
              {/* Search */}
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search media, captions, transcripts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tabs */}
            <MediaTabs
              activeTab={filters.tab}
              onTabChange={handleTabChange}
              counts={counts}
            />
          </div>

          {/* Filters */}
          <div className={cn(
            "transition-all duration-300",
            stickyFilters && "sticky top-14 z-40 bg-background/95 backdrop-blur border-y"
          )}>
            <MediaFilters
              groupBy={filters.groupBy}
              sort={filters.sort}
              view={filters.view}
              activeTab={filters.tab}
              onGroupByChange={(groupBy) => handleFilterChange('groupBy', groupBy)}
              onSortChange={(sort) => handleFilterChange('sort', sort)}
              onViewChange={(view) => handleFilterChange('view', view)}
              onQuickAction={handleQuickAction}
            />
          </div>

          {/* Rails */}
          <div className="space-y-8 mb-12">
            {mediaRails.map((rail) => (
              <MediaRail
                key={rail.id}
                rail={rail}
                onItemClick={handleRailItemClick}
                onLoadMore={() => console.log('Load more for rail:', rail.id)}
              />
            ))}
          </div>

          {/* Grid View */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {filters.tab === 'all' ? 'All Media' : 
                 filters.tab === 'photos' ? 'Photos' :
                 filters.tab === 'videos' ? 'Videos' : 'Voice Recordings'}
              </h2>
              <div className="text-sm text-muted-foreground">
                {mediaItems.length} items
              </div>
            </div>

            <MediaGrid
              items={mediaItems}
              view={filters.view}
              onItemClick={handleMediaClick}
              onLoadMore={() => console.log('Load more items')}
              hasMore={hasMore}
              loading={loading}
            />
          </div>
        </main>

        {/* Lightbox */}
        <MediaLightbox
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          item={lightboxItem}
          onPrevious={() => handleLightboxNavigation('prev')}
          onNext={() => handleLightboxNavigation('next')}
          {...handleLightboxActions}
         />
       </div>
     )
   }