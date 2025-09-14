export interface MediaItem {
  id: string
  type: 'photo' | 'video' | 'voice'
  takenAt: string
  uploadedAt: string
  caption?: string
  duration?: number // in seconds
  transcriptText?: string
  posterUrl?: string
  thumbUrl: string
  srcUrl: string
  peopleIds: string[]
  placeIds: string[]
  albumIds: string[]
  promptId?: string
  favoriteCount: number
  exifData?: ExifData
  familyId: string
  profileId: string
}

export interface ExifData {
  camera?: string
  lens?: string
  settings?: string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
}

export interface Album {
  id: string
  name: string
  description?: string
  coverMediaId?: string
  mediaIds: string[]
  createdAt: string
  familyId: string
  createdBy: string
}

export interface Person {
  id: string
  name: string
  avatarUrl?: string
  mediaCount: number
  recentMediaIds: string[]
}

export interface Place {
  id: string
  name: string
  coordinates?: {
    latitude: number
    longitude: number
  }
  mediaCount: number
  coverMediaId?: string
}

export type GroupByOption = 'day' | 'month' | 'event' | 'people' | 'places' | 'albums' | 'favorites'
export type SortOption = 'newest' | 'oldest' | 'most-liked'
export type ViewOption = 'grid' | 'strip' | 'timeline'
export type MediaTabOption = 'all' | 'photos' | 'videos' | 'voice'

export interface MediaFilters {
  tab: MediaTabOption
  groupBy: GroupByOption
  sort: SortOption
  view: ViewOption
  searchQuery?: string
  dateRange?: {
    start: string
    end: string
  }
  peopleIds?: string[]
  placeIds?: string[]
  albumIds?: string[]
}

export interface MediaRail {
  id: string
  title: string
  type: 'recent' | 'people' | 'events' | 'places'
  items: MediaItem[] | Person[] | Album[] | Place[]
  hasMore: boolean
}

export interface LightboxItem extends MediaItem {
  index: number
  total: number
}