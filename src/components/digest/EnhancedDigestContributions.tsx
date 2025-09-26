import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  MessageSquare, 
  Image, 
  Video, 
  Music, 
  Heart,
  Calendar,
  Users,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { formatForUser, getCurrentUserRegion } from '@/utils/date'

interface DigestContribution {
  id: string
  type: 'story' | 'comment' | 'photo' | 'video' | 'audio'
  title: string
  content?: string
  author_name: string
  created_at: string
  event_context?: {
    event_type: 'birthday' | 'anniversary' | 'memorial' | 'general'
    person_name?: string
    event_date?: string
  }
  media_url?: string
  media_type?: string
  story_id?: string
  comment_id?: string
  reaction_count?: number
}

interface EnhancedDigestContributionsProps {
  familyId: string
  startDate: string
  endDate: string
  onContributionsLoaded?: (count: number) => void
  showPreview?: boolean
  maxItems?: number
}

export default function EnhancedDigestContributions({ 
  familyId, 
  startDate, 
  endDate, 
  onContributionsLoaded,
  showPreview = false,
  maxItems = 10
}: EnhancedDigestContributionsProps) {
  const [contributions, setContributions] = useState<DigestContribution[]>([])
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(!showPreview)

  useEffect(() => {
    loadContributions()
  }, [familyId, startDate, endDate])

  const loadContributions = async () => {
    try {
      setLoading(true)
      const contributions: DigestContribution[] = []

      // Load stories from the week
      const { data: stories } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          content,
          created_at,
          family_member_profiles:profile_id (
            full_name
          )
        `)
        .eq('family_id', familyId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })

      if (stories) {
        stories.forEach(story => {
          // Check if story is event-related
          let eventContext = undefined
          if (story.title && (
            story.title.toLowerCase().includes('birthday') ||
            story.title.toLowerCase().includes('anniversary') ||
            story.title.toLowerCase().includes('memorial')
          )) {
            const eventType = story.title.toLowerCase().includes('birthday') ? 'birthday' :
                            story.title.toLowerCase().includes('anniversary') ? 'anniversary' :
                            story.title.toLowerCase().includes('memorial') ? 'memorial' : 'general'
            
            eventContext = {
              event_type: eventType,
              person_name: extractPersonName(story.title),
              event_date: story.created_at
            }
          }

          contributions.push({
            id: story.id,
            type: 'story',
            title: story.title,
            content: story.content,
            author_name: story.family_member_profiles?.full_name || 'Family Member',
            created_at: story.created_at,
            event_context: eventContext,
            story_id: story.id
          })
        })
      }

      // Load comments from the week
      const { data: comments } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          story_id,
          family_member_profiles:profile_id (
            full_name
          ),
          stories:story_id (
            title
          )
        `)
        .eq('family_id', familyId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false })

      if (comments) {
        comments.forEach(comment => {
          contributions.push({
            id: comment.id,
            type: 'comment',
            title: `Comment on "${comment.stories?.title}"`,
            content: comment.content,
            author_name: comment.family_member_profiles?.full_name || 'Family Member',
            created_at: comment.created_at,
            comment_id: comment.id,
            story_id: comment.story_id
          })
        })
      }

      // Load media contributions from story attachments/media
      // This would need to be expanded based on your media storage structure

      // Sort all contributions by date
      contributions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Limit items if specified
      const limitedContributions = maxItems ? contributions.slice(0, maxItems) : contributions
      
      setContributions(limitedContributions)
      onContributionsLoaded?.(contributions.length)

    } catch (error) {
      console.error('Error loading digest contributions:', error)
      setContributions([])
      onContributionsLoaded?.(0)
    } finally {
      setLoading(false)
    }
  }

  const extractPersonName = (title: string): string | undefined => {
    // Simple extraction - would need more sophisticated logic
    const match = title.match(/^(.+?)'s (birthday|anniversary|memorial)/i)
    return match ? match[1] : undefined
  }

  const getContributionIcon = (type: string) => {
    switch (type) {
      case 'story': return MessageSquare
      case 'comment': return MessageSquare
      case 'photo': return Image
      case 'video': return Video
      case 'audio': return Music
      default: return MessageSquare
    }
  }

  const getContributionTypeLabel = (contribution: DigestContribution) => {
    if (contribution.event_context) {
      return `${contribution.event_context.event_type} ${contribution.type}`
    }
    return contribution.type
  }

  const formatContributionDate = (dateString: string) => {
    return formatForUser(dateString, 'relative', getCurrentUserRegion())
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (contributions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Weekly Contributions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No contributions found for this week
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Stories, comments, and media shared by family members will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Weekly Contributions ({contributions.length})
          </CardTitle>
          {showPreview && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2"
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {contributions.filter(c => c.type === 'story').length}
            </div>
            <div className="text-xs text-muted-foreground">Stories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {contributions.filter(c => c.type === 'comment').length}
            </div>
            <div className="text-xs text-muted-foreground">Comments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {contributions.filter(c => c.event_context).length}
            </div>
            <div className="text-xs text-muted-foreground">Events</div>
          </div>
        </div>

        {/* Contributions List */}
        {showDetails && (
          <div className="space-y-2">
            {contributions.map((contribution) => {
              const Icon = getContributionIcon(contribution.type)
              return (
                <div
                  key={contribution.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        {contribution.title}
                      </p>
                      {contribution.event_context && (
                        <Badge variant="secondary" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {contribution.event_context.event_type}
                        </Badge>
                      )}
                    </div>
                    
                    {contribution.content && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                        {contribution.content}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{contribution.author_name}</span>
                      <span>•</span>
                      <span>{formatContributionDate(contribution.created_at)}</span>
                      <Badge variant="outline" className="text-xs">
                        {getContributionTypeLabel(contribution)}
                      </Badge>
                    </div>
                  </div>
                  
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )
            })}
          </div>
        )}

        {/* View All Button */}
        {showPreview && contributions.length >= maxItems && (
          <div className="pt-2 border-t">
            <Button variant="outline" size="sm" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              View All {contributions.length} Contributions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}