import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { getSignedMediaUrl } from '@/lib/media'

interface MediaItem {
  id: string
  url: string
  type: 'image' | 'video' | 'audio' | 'other'
  mime_type: string
  order: number
  signedUrl?: string
}

export interface FeedStory {
  id: string
  author_id: string
  family_id: string
  created_at: string
  visibility: string
  content_type: string
  text: string
  title: string
  media: MediaItem[]
}

interface UseFamilyFeedOptions {
  limit?: number
  enabled?: boolean
}

export function useFamilyFeed(familyId: string, options: UseFamilyFeedOptions = {}) {
  const { limit = 10, enabled = true } = options
  
  const [items, setItems] = useState<FeedStory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)

  // Sign media URLs for a story
  const signMediaUrls = async (story: FeedStory): Promise<FeedStory> => {
    if (!story.media || story.media.length === 0) {
      return story
    }

    const signedMedia = await Promise.all(
      story.media.map(async (media) => {
        try {
          const signedUrl = await getSignedMediaUrl(media.url, story.family_id)
          return {
            ...media,
            signedUrl: signedUrl || media.url
          }
        } catch (error) {
          console.error('Error signing media URL:', error)
          return {
            ...media,
            signedUrl: media.url // Fallback to original URL
          }
        }
      })
    )

    return {
      ...story,
      media: signedMedia
    }
  }

  // Load feed page
  const loadPage = useCallback(async (isLoadMore: boolean = false) => {
    try {
      setIsLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setItems([])
        setHasMore(false)
        return
      }

      const { data, error } = await supabase.rpc('feed_for_user', {
        p_user: user.id,
        p_limit: limit,
        p_cursor: isLoadMore && cursor ? cursor : new Date().toISOString()
      })

      if (error) {
        console.error('Error loading feed:', error)
        throw error
      }

      // Cast and sign all media URLs
      const stories = (data || []).map(item => ({
        ...item,
        media: (item.media as unknown as MediaItem[]) || []
      })) as FeedStory[]

      const storiesWithSignedUrls = await Promise.all(
        stories.map(signMediaUrls)
      )

      if (isLoadMore) {
        // Append to existing items, avoiding duplicates
        setItems(prev => {
          const existingIds = new Set(prev.map(item => item.id))
          const newItems = storiesWithSignedUrls.filter(item => !existingIds.has(item.id))
          return [...prev, ...newItems]
        })
      } else {
        // Replace items (initial load or refresh)
        setItems(storiesWithSignedUrls)
      }

      // Update hasMore based on returned count
      setHasMore((data || []).length >= limit)

      // Update cursor to last item's created_at
      if (data && data.length > 0) {
        setCursor(data[data.length - 1].created_at)
      }
    } catch (error) {
      console.error('Error loading feed:', error)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [familyId, limit, cursor])

  // Load more function
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return
    await loadPage(true)
  }, [hasMore, isLoading, loadPage])

  // Reset and reload when familyId changes
  useEffect(() => {
    if (!enabled) return
    
    setItems([])
    setCursor(null)
    setHasMore(true)
    loadPage(false)
  }, [familyId, enabled])

  return {
    items,
    loadMore,
    hasMore,
    isLoading
  }
}
