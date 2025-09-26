import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BarChart3, MessageSquare, Image, MessageCircle, TrendingUp, Calendar } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { formatForUser, getCurrentUserRegion } from '@/utils/date'

interface DigestMetrics {
  lastDigestDate?: string
  lastDigestStats: {
    stories: number
    photos: number
    comments: number
    reactions: number
  }
  currentWeekStats: {
    stories: number
    photos: number
    comments: number
    reactions: number
  }
  trend: 'up' | 'down' | 'same'
}

interface DigestMetricsSummaryProps {
  familyId: string
  className?: string
}

export default function DigestMetricsSummary({ familyId, className }: DigestMetricsSummaryProps) {
  const [metrics, setMetrics] = useState<DigestMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [familyId])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      
      // Get last digest send info
      const { data: lastDigest } = await supabase
        .from('digest_send_log')
        .select('*')
        .eq('family_id', familyId)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single()

      // Calculate date ranges
      const now = new Date()
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay()) // Start of current week
      startOfWeek.setHours(0, 0, 0, 0)

      const lastWeekStart = new Date(startOfWeek)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)
      
      const lastWeekEnd = new Date(startOfWeek)
      lastWeekEnd.setSeconds(lastWeekEnd.getSeconds() - 1)

      // Get current week stats
      const [currentStories, currentPhotos, currentComments, currentReactions] = await Promise.all([
        supabase
          .from('stories')
          .select('id', { count: 'exact' })
          .eq('family_id', familyId)
          .gte('created_at', startOfWeek.toISOString()),
        
        supabase
          .from('media')
          .select('id', { count: 'exact' })
          .eq('family_id', familyId)
          .like('mime_type', 'image/%')
          .gte('created_at', startOfWeek.toISOString()),
        
        supabase
          .from('comments')
          .select('id', { count: 'exact' })
          .eq('family_id', familyId)
          .gte('created_at', startOfWeek.toISOString()),
        
        supabase
          .from('reactions')
          .select('id', { count: 'exact' })
          .eq('family_id', familyId)
          .gte('created_at', startOfWeek.toISOString())
      ])

      // Get last week stats
      const [lastStories, lastPhotos, lastComments, lastReactions] = await Promise.all([
        supabase
          .from('stories')
          .select('id', { count: 'exact' })
          .eq('family_id', familyId)
          .gte('created_at', lastWeekStart.toISOString())
          .lt('created_at', lastWeekEnd.toISOString()),
        
        supabase
          .from('media')
          .select('id', { count: 'exact' })
          .eq('family_id', familyId)
          .like('mime_type', 'image/%')
          .gte('created_at', lastWeekStart.toISOString())
          .lt('created_at', lastWeekEnd.toISOString()),
        
        supabase
          .from('comments')
          .select('id', { count: 'exact' })
          .eq('family_id', familyId)
          .gte('created_at', lastWeekStart.toISOString())
          .lt('created_at', lastWeekEnd.toISOString()),
        
        supabase
          .from('reactions')
          .select('id', { count: 'exact' })
          .eq('family_id', familyId)
          .gte('created_at', lastWeekStart.toISOString())
          .lt('created_at', lastWeekEnd.toISOString())
      ])

      const currentWeekStats = {
        stories: currentStories.count || 0,
        photos: currentPhotos.count || 0,
        comments: currentComments.count || 0,
        reactions: currentReactions.count || 0
      }

      const lastDigestStats = {
        stories: lastStories.count || 0,
        photos: lastPhotos.count || 0,
        comments: lastComments.count || 0,
        reactions: lastReactions.count || 0
      }

      // Calculate trend
      const currentTotal = Object.values(currentWeekStats).reduce((a, b) => a + b, 0)
      const lastTotal = Object.values(lastDigestStats).reduce((a, b) => a + b, 0)
      
      let trend: 'up' | 'down' | 'same' = 'same'
      if (currentTotal > lastTotal) trend = 'up'
      else if (currentTotal < lastTotal) trend = 'down'

      setMetrics({
        lastDigestDate: lastDigest?.sent_at,
        lastDigestStats,
        currentWeekStats,
        trend
      })
    } catch (error) {
      console.error('Error loading digest metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No digest history yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getMetricItems = () => [
    {
      icon: <MessageSquare className="h-4 w-4" />,
      label: 'Stories',
      current: metrics.currentWeekStats.stories,
      last: metrics.lastDigestStats.stories,
      color: 'text-blue-600'
    },
    {
      icon: <Image className="h-4 w-4" />,
      label: 'Photos',
      current: metrics.currentWeekStats.photos,
      last: metrics.lastDigestStats.photos,
      color: 'text-green-600'
    },
    {
      icon: <MessageCircle className="h-4 w-4" />,
      label: 'Comments',
      current: metrics.currentWeekStats.comments,
      last: metrics.lastDigestStats.comments,
      color: 'text-purple-600'
    }
  ]

  const getTrendIcon = () => {
    switch (metrics.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
      default:
        return <TrendingUp className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTrendText = () => {
    switch (metrics.trend) {
      case 'up':
        return 'More active than last week'
      case 'down':
        return 'Less active than last week'
      default:
        return 'Similar to last week'
    }
  }

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-4">
        {/* Enhanced Header with Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span className="font-medium text-sm">Content for Next Digest</span>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <Badge variant="secondary" className="text-xs">
              Ready
            </Badge>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          {getMetricItems().map((item, index) => (
            <div key={index} className="text-center space-y-1">
              <div className={`flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
              <div className="space-y-0.5">
                <div className="font-semibold text-sm">{item.current}</div>
                <div className="text-xs text-muted-foreground">{item.label}</div>
                {item.last > 0 && (
                  <div className="text-xs text-muted-foreground">
                    vs {item.last} last week
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">This week's trend</span>
            <Badge variant="secondary" className="text-xs">
              {getTrendText()}
            </Badge>
          </div>
          
          {metrics.lastDigestDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                Last sent: {formatForUser(metrics.lastDigestDate, 'relative', getCurrentUserRegion())}
              </span>
            </div>
          )}
        </div>

        {/* Quick Action */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadMetrics}
          className="w-full h-8 text-xs"
        >
          Refresh Stats
        </Button>
      </CardContent>
    </Card>
  )
}