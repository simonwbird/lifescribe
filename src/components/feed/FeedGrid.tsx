import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalytics } from '@/hooks/useAnalytics'
import { EnhancedStoryCard } from './EnhancedStoryCard'
import { FilterChips } from './FilterChips'
import { PrivacyBadge } from '@/components/ui/privacy-badge'
import { TrustMicrocopy } from '@/components/microcopy/TrustMicrocopy'

interface Story {
  id: string
  title: string
  content: string
  created_at: string
  profile_id: string
  family_id: string
  media?: Array<{
    id: string
    file_path: string
    mime_type: string
  }>
  profile: {
    id: string
    full_name: string
    avatar_url?: string
  }
  reactions_count: number
  comments_count: number
  user_has_liked: boolean
}

interface FeedGridProps {
  familyId: string
  currentUserId: string
}

type FilterType = 'all' | 'recent' | 'unread' | 'yours' | 'photos' | 'audio'

export function FeedGrid({ familyId, currentUserId }: FeedGridProps) {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const { track } = useAnalytics()

  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    loadStories(true)
  }, [familyId, activeFilter])

  const loadStories = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setPage(0)
      } else {
        setLoadingMore(true)
      }

      const currentPage = reset ? 0 : page
      const offset = currentPage * ITEMS_PER_PAGE

      // Build query based on filter
      let query = supabase
        .from('stories')
        .select(`
          id,
          title,
          content,
          created_at,
          profile_id,
          family_id,
          media!inner (
            id,
            file_path,
            mime_type
          ),
          profiles:profile_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('family_id', familyId)

      // Apply filters
      switch (activeFilter) {
        case 'recent':
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          query = query.gte('created_at', oneDayAgo)
          break
        case 'yours':
          query = query.eq('profile_id', currentUserId)
          break
        case 'photos':
          query = query.like('media.mime_type', 'image/%')
          break
        case 'audio':
          query = query.like('media.mime_type', 'audio/%')
          break
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1)

      if (error) throw error

      // Get reaction and comment counts
      const storyIds = data?.map(s => s.id) || []
      const [reactionsData, commentsData, userReactionsData] = await Promise.all([
        supabase
          .from('reactions')
          .select('story_id')
          .in('story_id', storyIds),
        supabase
          .from('comments')
          .select('story_id')
          .in('story_id', storyIds),
        supabase
          .from('reactions')
          .select('story_id')
          .in('story_id', storyIds)
          .eq('profile_id', currentUserId)
      ])

      // Count reactions and comments per story
      const reactionCounts: Record<string, number> = {}
      const commentCounts: Record<string, number> = {}
      const userLikes = new Set(userReactionsData.data?.map(r => r.story_id) || [])

      reactionsData.data?.forEach(r => {
        reactionCounts[r.story_id] = (reactionCounts[r.story_id] || 0) + 1
      })

      commentsData.data?.forEach(c => {
        commentCounts[c.story_id] = (commentCounts[c.story_id] || 0) + 1
      })

      const enhancedStories = data?.map(story => ({
        ...story,
        profile: story.profiles,
        reactions_count: reactionCounts[story.id] || 0,
        comments_count: commentCounts[story.id] || 0,
        user_has_liked: userLikes.has(story.id)
      })) || []

      if (reset) {
        setStories(enhancedStories)
      } else {
        setStories(prev => [...prev, ...enhancedStories])
      }

      setHasMore(enhancedStories.length === ITEMS_PER_PAGE)
      setPage(currentPage + 1)

    } catch (error) {
      console.error('Error loading stories:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = () => {
    loadStories(false)
  }

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter)
  }

  const handleStoryInteraction = (storyId: string, action: 'like' | 'comment' | 'share') => {
    
    if (action === 'like') {
      // Optimistically update UI
      setStories(prev => prev.map(story => 
        story.id === storyId 
          ? { 
              ...story, 
              user_has_liked: !story.user_has_liked,
              reactions_count: story.user_has_liked 
                ? story.reactions_count - 1 
                : story.reactions_count + 1
            }
          : story
      ))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <FilterChips 
          activeFilter={activeFilter} 
          onFilterChange={handleFilterChange} 
        />
        <div className="grid gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <FilterChips 
        activeFilter={activeFilter} 
        onFilterChange={handleFilterChange} 
      />
      
      <div className="grid gap-6">
        {stories.map((story) => (
          <EnhancedStoryCard 
            key={story.id}
            story={story}
            onInteraction={handleStoryInteraction}
          />
        ))}
      </div>

      {stories.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-heritage-gray">
              <h3 className="font-semibold mb-2 text-heritage-gray-dark">{TrustMicrocopy.empty_states.stories.title}</h3>
              <p className="mb-4">{TrustMicrocopy.empty_states.stories.description}</p>
              <div className="flex items-center justify-center gap-2">
                <Button>{TrustMicrocopy.empty_states.stories.cta}</Button>
                <PrivacyBadge size="sm" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasMore && stories.length > 0 && (
        <div className="text-center">
          <Button 
            onClick={handleLoadMore} 
            disabled={loadingMore}
            variant="outline"
            size="lg"
            className="min-w-32"
          >
            {loadingMore ? 'Loading...' : 'Load 10 More Memories'}
          </Button>
        </div>
      )}

      {!hasMore && stories.length > 0 && (
        <div className="text-center py-4">
          <p className="text-heritage-gray text-sm">You've seen all your family's memories</p>
        </div>
      )}
    </div>
  )
}