import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { FunnelMetrics } from '@/types/analytics'
import { TrendingUp, Users, Zap, Target } from 'lucide-react'

interface FunnelDashboardProps {
  familyId?: string
  timeframe?: '7d' | '30d' | '90d'
}

export function FunnelDashboard({ familyId, timeframe = '30d' }: FunnelDashboardProps) {
  const [metrics, setMetrics] = useState<FunnelMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [familyId, timeframe])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      
      const timeframeDays = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - timeframeDays)

      // Build base query
      let query = supabase
        .from('analytics_events')
        .select('event_name, properties, created_at, user_id')
        .gte('created_at', startDate.toISOString())

      if (familyId) {
        query = query.eq('family_id', familyId)
      }

      const { data: events, error } = await query

      if (error) throw error

      // Calculate funnel metrics
      const promptViews = events?.filter(e => e.event_name === 'prompt_view').length || 0
      const storyStarts = events?.filter(e => e.event_name === 'story_start').length || 0
      const storySaves = events?.filter(e => e.event_name === 'story_save').length || 0

      // Get unique users who created stories this week
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const weeklyStoryEvents = events?.filter(e => 
        e.event_name === 'story_save' && 
        new Date(e.created_at) >= weekAgo
      ) || []
      
      const weeklyActiveUsers = new Set(weeklyStoryEvents.map(e => e.user_id)).size
      const totalWeeklyStories = weeklyStoryEvents.length

      // Calculate streaks (simplified)
      const streakEvents = events?.filter(e => e.event_name === 'streak_continue') || []
      const activeStreaks = new Set(streakEvents.map(e => e.user_id)).size
      const streakCounts = streakEvents.map(e => {
        const props = e.properties as any
        return props?.streak_count || 0
      })
      const avgStreak = streakCounts.length > 0 ? 
        streakCounts.reduce((a, b) => a + b, 0) / streakCounts.length : 0
      const maxStreak = streakCounts.length > 0 ? Math.max(...streakCounts) : 0

      const calculatedMetrics: FunnelMetrics = {
        first_story_funnel: {
          prompt_views: promptViews,
          story_starts: storyStarts,
          story_saves: storySaves,
          conversion_rate: promptViews > 0 ? (storySaves / promptViews) * 100 : 0
        },
        weekly_active_storytellers: {
          total_users: new Set(events?.map(e => e.user_id) || []).size,
          active_users: weeklyActiveUsers,
          stories_created: totalWeeklyStories,
          avg_stories_per_user: weeklyActiveUsers > 0 ? totalWeeklyStories / weeklyActiveUsers : 0
        },
        streaks: {
          active_streaks: activeStreaks,
          avg_streak_length: Math.round(avgStreak),
          longest_streak: maxStreak,
          streak_milestones: {}
        }
      }

      setMetrics(calculatedMetrics)
    } catch (error) {
      console.error('Failed to load metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-serif font-semibold text-foreground">
          Analytics Dashboard
        </h2>
        <Badge variant="secondary">{timeframe.toUpperCase()} View</Badge>
      </div>

      <Tabs defaultValue="funnels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="funnels">Funnels</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="funnels">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                First Story Funnel
              </CardTitle>
              <CardDescription>
                Track user journey from prompt view to story completion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-h3 font-bold text-primary">
                    {metrics.first_story_funnel.prompt_views.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Prompt Views</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-h3 font-bold text-secondary">
                    {metrics.first_story_funnel.story_starts.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Story Starts</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-h3 font-bold text-accent">
                    {metrics.first_story_funnel.story_saves.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Story Saves</div>
                </div>
                <div className="text-center p-4 bg-heritage-primary/10 rounded-lg">
                  <div className="text-h3 font-bold text-heritage-primary">
                    {metrics.first_story_funnel.conversion_rate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Conversion Rate</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>View → Start</span>
                  <span>{metrics.first_story_funnel.prompt_views > 0 ? 
                    ((metrics.first_story_funnel.story_starts / metrics.first_story_funnel.prompt_views) * 100).toFixed(1) 
                    : 0}%</span>
                </div>
                <Progress value={metrics.first_story_funnel.prompt_views > 0 ? 
                  (metrics.first_story_funnel.story_starts / metrics.first_story_funnel.prompt_views) * 100 
                  : 0} />
                
                <div className="flex items-center justify-between text-sm">
                  <span>Start → Save</span>
                  <span>{metrics.first_story_funnel.story_starts > 0 ? 
                    ((metrics.first_story_funnel.story_saves / metrics.first_story_funnel.story_starts) * 100).toFixed(1) 
                    : 0}%</span>
                </div>
                <Progress value={metrics.first_story_funnel.story_starts > 0 ? 
                  (metrics.first_story_funnel.story_saves / metrics.first_story_funnel.story_starts) * 100 
                  : 0} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Weekly Active Storytellers
              </CardTitle>
              <CardDescription>
                Users actively creating stories in the past 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-h3 font-bold text-primary">
                    {metrics.weekly_active_storytellers.active_users}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-h3 font-bold text-secondary">
                    {metrics.weekly_active_storytellers.stories_created}
                  </div>
                  <div className="text-sm text-muted-foreground">Stories Created</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-h3 font-bold text-accent">
                    {metrics.weekly_active_storytellers.avg_stories_per_user.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg per User</div>
                </div>
                <div className="text-center p-4 bg-heritage-primary/10 rounded-lg">
                  <div className="text-h3 font-bold text-heritage-primary">
                    {metrics.weekly_active_storytellers.total_users > 0 ? 
                      ((metrics.weekly_active_storytellers.active_users / metrics.weekly_active_storytellers.total_users) * 100).toFixed(1) 
                      : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Activation Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Streaks & Engagement
              </CardTitle>
              <CardDescription>
                User consistency and engagement patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-h3 font-bold text-primary">
                    {metrics.streaks.active_streaks}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Streaks</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-h3 font-bold text-secondary">
                    {metrics.streaks.avg_streak_length}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Length</div>
                </div>
                <div className="text-center p-4 bg-heritage-primary/10 rounded-lg">
                  <div className="text-h3 font-bold text-heritage-primary">
                    {metrics.streaks.longest_streak}
                  </div>
                  <div className="text-sm text-muted-foreground">Longest Streak</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}