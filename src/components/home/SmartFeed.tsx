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

interface StoryRecord {
  id: string
  title: string
  content?: string
  created_at: string
  profile_id: string
  family_id: string
  profiles?: {
    full_name?: string
    avatar_url?: string
  } | null
}

interface EnhancedStory extends StoryRecord {
  media_urls: Array<{ url: string; type: string }>
  reactions_count: number
  comments_count: number
  user_has_liked: boolean
  people: Array<{ id: string; name: string }>
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
      .maybeSingle()
    
    setIsAdmin(data?.role === 'admin')
  }

  const loadFeed = async () => {
    setLoading(true)
    try {
      const { data: storiesData, error } = await supabase
        .from('stories')
        .select('id, title, content, created_at, profile_id, family_id, profiles(full_name, avatar_url)')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      const enhanced = await Promise.all(
        (storiesData || []).map(async (story: any) => ({
          ...story,
          media_urls: [],
          reactions_count: 0,
          comments_count: 0,
          user_has_liked: false,
          people: []
        }))
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
