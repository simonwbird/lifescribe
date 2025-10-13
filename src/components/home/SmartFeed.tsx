import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { FeedFilterChips, FeedFilterType } from './FeedFilterChips'
import { SmartFeedCard } from './SmartFeedCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

interface SmartFeedProps {
  familyId: string
  userId: string
}

export function SmartFeed({ familyId, userId }: SmartFeedProps) {
  const [activeFilter, setActiveFilter] = useState<FeedFilterType>('all')
  const [feedItems, setFeedItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAdminStatus()
  }, [familyId, userId])

  useEffect(() => {
    loadFeed()
  }, [familyId, activeFilter])

  const checkAdminStatus = async () => {
    const { data } = await supabase
      .from('members')
      .select('role')
      .eq('family_id', familyId)
      .eq('profile_id', userId)
      .single()
    
    setIsAdmin(data?.role === 'admin')
  }

  const loadFeed = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('stories')
        .select(`
          id,
          title,
          content,
          created_at,
          profile_id,
          family_id,
          profiles(full_name, avatar_url)
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(20)

      // Apply filters
      if (activeFilter === 'photos') {
        // Filter stories with images
        query = query.contains('content', '"image"')
      } else if (activeFilter === 'voice') {
        // Filter stories with audio
        query = query.contains('content', '"audio"')
      } else if (activeFilter === 'video') {
        // Filter stories with video
        query = query.contains('content', '"video"')
      }

      const { data: stories, error } = await query

      if (error) throw error

      // Enhance with media, reactions, comments
      const enhanced = await Promise.all(
        (stories || []).map(async (story) => {
          // Get media
          const { data: assets } = await supabase
            .from('story_assets')
            .select('type, url')
            .eq('story_id', story.id)
            .order('position')
            .limit(3)

           // Get reactions count
           const reactionsResult: any = await supabase
             .from('reactions')
             .select('id', { count: 'exact', head: true })
             .eq('target_type', 'story')
             .eq('target_id', story.id)
           
           const reactionsCount = reactionsResult.count || 0

           // Get comments count
           const commentsResult: any = await supabase
             .from('comments')
             .select('id', { count: 'exact', head: true })
             .eq('story_id', story.id)
           
           const commentsCount = commentsResult.count || 0

          // Check if user liked
          const userReactionResult: any = await supabase
            .from('reactions')
            .select('id')
            .eq('target_type', 'story')
            .eq('target_id', story.id)
            .eq('profile_id', userId)
            .maybeSingle()
          
          const userReaction = userReactionResult.data

          // Get tagged people
          const { data: peopleLinks } = await supabase
            .from('person_story_links')
            .select('people!inner(id, given_name, surname)')
            .eq('story_id', story.id)

          const people = (peopleLinks || []).map((pl: any) => ({
            id: pl.people?.id || '',
            name: `${pl.people?.given_name || ''} ${pl.people?.surname || ''}`.trim()
          }))

          return {
            ...story,
            media_urls: assets?.map(a => ({ url: a.url, type: a.type })) || [],
            reactions_count: reactionsCount || 0,
            comments_count: commentsCount || 0,
            user_has_liked: !!userReaction,
            people
          }
        })
      )

      setFeedItems(enhanced)
    } catch (error) {
      console.error('Error loading feed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter Chips */}
      <div className="flex items-center justify-between gap-4">
        <FeedFilterChips
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          showAdmin={isAdmin}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={loadFeed}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Feed Items */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[400px] w-full" />
          ))}
        </div>
      ) : feedItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No stories yet. Start sharing!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedItems.map((item) => (
            <SmartFeedCard key={item.id} item={item} onUpdate={loadFeed} />
          ))}
        </div>
      )}
    </div>
  )
}
