import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/design-system/EmptyState'
import { 
  Grid3x3, 
  List, 
  LayoutGrid, 
  Plus, 
  Shield,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContributionDialog } from './story-collage/ContributionDialog'
import { ReviewQueueDialog } from './story-collage/ReviewQueueDialog'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface StoryCollageBlockProps {
  personId: string
  familyId: string
  blockContent?: any
  canEdit: boolean
  onUpdate?: () => void
}

type ViewMode = 'grid' | 'list' | 'mixed'

export default function StoryCollageBlock({ 
  personId, 
  familyId, 
  blockContent,
  canEdit,
  onUpdate
}: StoryCollageBlockProps) {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>(blockContent?.view_mode || 'grid')
  const [showContribution, setShowContribution] = useState(false)
  const [showReviewQueue, setShowReviewQueue] = useState(false)

  // Fetch approved stories
  const { data: stories, isLoading } = useQuery({
    queryKey: ['person-stories-collage', personId],
    queryFn: async () => {
      // 1) Get story IDs linked to this person
      const { data: links, error: linksError } = await supabase
        .from('person_story_links')
        .select('story_id')
        .eq('person_id', personId)

      if (linksError) throw linksError

      const storyIds = (links || []).map((l: any) => l.story_id).filter(Boolean)
      if (storyIds.length === 0) return []

      // 2) Fetch stories with details
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:profile_id(id, full_name, avatar_url),
          media!media_story_id_fkey(id, file_path, mime_type)
        `)
        .eq('family_id', familyId)
        .in('id', storyIds)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    }
  })

  // Fetch pending review count for stewards
  const { data: pendingCount } = useQuery({
    queryKey: ['pending-stories-count', familyId],
    queryFn: async () => {
      if (!canEdit) return 0
      
      const { count, error } = await supabase
        .from('moderation_queue_items')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('item_type', 'story')
        .eq('status', 'pending')

      if (error) throw error
      return count || 0
    },
    enabled: canEdit
  })

  // Fetch relationships for contributor badges
  const { data: relationships } = useQuery({
    queryKey: ['contributor-relationships', personId, familyId],
    queryFn: async () => {
      // Get all people in this family who have claimed profiles
      const { data: people, error: peopleError } = await supabase
        .from('people')
        .select('id, claimed_by_profile_id')
        .eq('family_id', familyId)
        .not('claimed_by_profile_id', 'is', null)

      if (peopleError) throw peopleError

      // Get relationships TO the person we're viewing
      const { data: rels, error: relsError } = await supabase
        .from('relationships')
        .select('from_person_id, relationship_type')
        .eq('to_person_id', personId)

      if (relsError) throw relsError

      // Build a map of claimed_by_profile_id -> relationship_type
      const relationshipMap: Record<string, string> = {}
      ;(people as any[] || []).forEach((person: any) => {
        const rel = (rels as any[] || []).find((r: any) => r.from_person_id === person.id)
        if (rel && person.claimed_by_profile_id) {
          relationshipMap[person.claimed_by_profile_id] = rel.relationship_type
        }
      })

      return relationshipMap
    }
  })

  // Get contributor relationship badge
  const getRelationshipBadge = (contributorProfileId: string) => {
    const type = relationships?.[contributorProfileId]
    
    if (!type) return 'Family Member'
    
    // Return friendly relationship label
    if (type === 'child') return 'Daughter'
    if (type === 'son') return 'Son'
    if (type === 'daughter') return 'Daughter'
    if (type === 'parent') return 'Parent'
    if (type === 'spouse') return 'Spouse'
    if (type === 'sibling') return 'Sibling'
    if (type === 'grandchild') return 'Grandchild'
    if (type === 'grandson') return 'Grandson'
    if (type === 'granddaughter') return 'Granddaughter'
    if (type === 'grandparent') return 'Grandparent'
    return type || 'Family Member'
  }

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stories?.map((story: any) => {
        const primaryMedia = story.media?.[0]
        const hasPhoto = primaryMedia && primaryMedia.mime_type?.startsWith('image/')
        
        return (
          <Card 
            key={story.id} 
            className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
            onClick={() => navigate(`/stories/${story.id}`)}
          >
            {hasPhoto && (
              <div className="aspect-video relative overflow-hidden bg-muted">
                <img 
                  src={primaryMedia.file_path}
                  alt={story.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <CardContent className="p-4 space-y-2">
              <h3 className="font-serif font-semibold text-lg line-clamp-2">
                {story.title}
              </h3>
              {story.content && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {story.content}
                </p>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={story.profiles?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {story.profiles?.full_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {story.profiles?.full_name}
                  </p>
                  {story.profile_id && (
                    <Badge variant="outline" className="text-xs h-5 mt-1">
                      {getRelationshipBadge(story.profile_id)}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(story.created_at), 'MMM d, yyyy')}
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-3">
      {stories?.map((story: any) => (
        <Card 
          key={story.id}
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate(`/stories/${story.id}`)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={story.profiles?.avatar_url} />
                <AvatarFallback>
                  {story.profiles?.full_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif font-semibold text-lg">
                    {story.title}
                  </h3>
                  {story.profile_id && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {getRelationshipBadge(story.profile_id)}
                    </Badge>
                  )}
                </div>
                {story.content && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {story.content}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{story.profiles?.full_name}</span>
                  <span>•</span>
                  <span>{format(new Date(story.created_at), 'MMM d, yyyy')}</span>
                  {story.media && story.media.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        {story.media.length}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderMixedView = () => {
    const photosStories = stories?.filter(s => 
      s.media?.some(m => m.mime_type?.startsWith('image/'))
    ) || []
    const textStories = stories?.filter(s => 
      !s.media?.some(m => m.mime_type?.startsWith('image/'))
    ) || []

    return (
      <div className="space-y-8">
        {photosStories.length > 0 && (
          <div>
            <h3 className="font-serif font-semibold text-xl mb-4 flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Photo Stories
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photosStories.map((story) => {
                const primaryMedia = story.media?.[0]
                return (
                  <Card 
                    key={story.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
                    onClick={() => navigate(`/stories/${story.id}`)}
                  >
                    <div className="aspect-video relative overflow-hidden bg-muted">
                      <img 
                        src={primaryMedia.file_path}
                        alt={story.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-serif font-semibold line-clamp-2 text-sm">
                        {story.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={story.profiles?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {story.profiles?.full_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate">
                          {story.profiles?.full_name}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {textStories.length > 0 && (
          <div>
            <h3 className="font-serif font-semibold text-xl mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Written Stories
            </h3>
            <div className="space-y-3">
              {textStories.map((story) => (
                <Card 
                  key={story.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate(`/stories/${story.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={story.profiles?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {story.profiles?.full_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif font-semibold">
                          {story.title}
                        </h4>
                        {story.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {story.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading stories...</div>
      </div>
    )
  }

  if (!stories || stories.length === 0) {
    return (
      <>
        <EmptyState
          icon={<MessageSquare className="h-6 w-6" />}
          title="No stories yet"
          description="No stories yet—add the first memory."
          action={{
            label: "Add a Story",
            onClick: () => setShowContribution(true),
            variant: "default"
          }}
        />
        <ContributionDialog
          open={showContribution}
          onOpenChange={setShowContribution}
          personId={personId}
          familyId={familyId}
          onSuccess={onUpdate}
        />
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="grid" className="gap-2">
              <Grid3x3 className="h-4 w-4" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="mixed" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Mixed
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {canEdit && pendingCount && pendingCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReviewQueue(true)}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              Review Queue
              <Badge variant="destructive" className="ml-1">
                {pendingCount}
              </Badge>
            </Button>
          )}
          <Button
            onClick={() => setShowContribution(true)}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Story
          </Button>
        </div>
      </div>

      {/* Story Collage */}
      {viewMode === 'grid' && renderGridView()}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'mixed' && renderMixedView()}

      {/* Dialogs */}
      <ContributionDialog
        open={showContribution}
        onOpenChange={setShowContribution}
        personId={personId}
        familyId={familyId}
        onSuccess={onUpdate}
      />

      {canEdit && (
        <ReviewQueueDialog
          open={showReviewQueue}
          onOpenChange={setShowReviewQueue}
          familyId={familyId}
          onApprove={onUpdate}
        />
      )}
    </div>
  )
}
