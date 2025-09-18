import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { Users, Calendar, Clock, MessageCircle, Mic } from 'lucide-react'

interface MetricCard {
  title: string
  value: string | number
  description: string
  change?: string
  icon?: React.ReactNode
}

interface ChartData {
  name: string
  value: number
  date?: string
  [key: string]: any
}

export default function MVPMetricsDashboard() {
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [chartData, setChartData] = useState<{
    daily: ChartData[]
    voiceShare: ChartData[]
    timeToFirst: ChartData[]
  }>({
    daily: [],
    voiceShare: [],
    timeToFirst: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      setLoading(true)

      // Get date ranges
      const now = new Date()
      const d1 = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Parallel queries for metrics
      const [
        invitesSent,
        invitesAccepted,
        d1Activations,
        d7Activations,
        storiesLast30d,
        voiceStories,
        timeToFirstMemory
      ] = await Promise.all([
        // Invites sent (last 30 days)
        supabase
          .from('analytics_events')
          .select('*')
          .eq('event_name', 'invite_sent')
          .gte('created_at', d30.toISOString()),

        // Invites accepted (last 30 days)
        supabase
          .from('analytics_events')
          .select('*')
          .eq('event_name', 'invite_accepted')
          .gte('created_at', d30.toISOString()),

        // D1 Activations (users who published in first day)
        supabase
          .from('analytics_events')
          .select('user_id, created_at')
          .eq('event_name', 'publish_success')
          .gte('created_at', d1.toISOString()),

        // D7 Activations (users who published in first week)
        supabase
          .from('analytics_events')
          .select('user_id, created_at')
          .eq('event_name', 'publish_success')
          .gte('created_at', d7.toISOString()),

        // Stories published (last 30 days)
        supabase
          .from('analytics_events')
          .select('*')
          .eq('event_name', 'publish_success')
          .gte('created_at', d30.toISOString()),

        // Voice stories (first 10 stories per user)
        supabase
          .from('analytics_events')
          .select('*')
          .eq('event_name', 'voice_story_published')
          .gte('created_at', d30.toISOString()),

        // Time to first memory (median time between signup and first story)
        supabase
          .from('analytics_events')
          .select('user_id, created_at, event_name')
          .in('event_name', ['invite_accepted', 'publish_success'])
          .gte('created_at', d30.toISOString())
          .order('created_at', { ascending: true })
      ])

      // Calculate metrics
      const calculateActivationRate = (activations: any, total: number) => {
        if (total === 0) return 0
        const activationData = activations.data || []
        const uniqueUsers = new Set(activationData.map((a: any) => a.user_id) || [])
        return ((uniqueUsers.size / total) * 100).toFixed(1)
      }

      const totalAccepted = invitesAccepted.data?.length || 0
      const d1Rate = calculateActivationRate(d1Activations, totalAccepted)
      const d7Rate = calculateActivationRate(d7Activations, totalAccepted)

      // Time to first memory calculation
      const timeToFirstData = timeToFirstMemory.data || []
      const userFirstStory: Record<string, { accepted: string; published?: string }> = {}
      
      timeToFirstData.forEach(event => {
        if (!userFirstStory[event.user_id]) {
          userFirstStory[event.user_id] = { accepted: '', published: '' }
        }
        
        if (event.event_name === 'invite_accepted') {
          userFirstStory[event.user_id].accepted = event.created_at
        } else if (event.event_name === 'publish_success' && !userFirstStory[event.user_id].published) {
          userFirstStory[event.user_id].published = event.created_at
        }
      })

      const timeToFirstTimes = Object.values(userFirstStory)
        .filter(u => u.accepted && u.published)
        .map(u => {
          const accepted = new Date(u.accepted).getTime()
          const published = new Date(u.published!).getTime()
          return (published - accepted) / (1000 * 60 * 60) // hours
        })
        .sort((a, b) => a - b)

      const medianTimeToFirst = timeToFirstTimes.length > 0 
        ? timeToFirstTimes[Math.floor(timeToFirstTimes.length / 2)]
        : 0

      // Stories per family calculation
      const familyStoryCount: Record<string, number> = {}
      storiesLast30d.data?.forEach((story: any) => {
        const props = story.properties as any
        if (props?.familyId) {
          familyStoryCount[props.familyId] = (familyStoryCount[props.familyId] || 0) + 1
        }
      })
      
      const avgStoriesPerFamily = Object.values(familyStoryCount).length > 0
        ? (Object.values(familyStoryCount).reduce((a, b) => a + b, 0) / Object.values(familyStoryCount).length).toFixed(1)
        : '0'

      // Voice percentage among first 10 stories
      const voicePercentage = storiesLast30d.data && voiceStories.data
        ? ((voiceStories.data.length / Math.max(storiesLast30d.data.length, 1)) * 100).toFixed(1)
        : '0'

      setMetrics([
        {
          title: 'D1 Activation',
          value: `${d1Rate}%`,
          description: 'Users who publish within 24h',
          icon: <Calendar className="h-4 w-4" />
        },
        {
          title: 'D7 Activation',
          value: `${d7Rate}%`,
          description: 'Users who publish within 7 days',
          icon: <Users className="h-4 w-4" />
        },
        {
          title: 'Time to First Memory',
          value: `${Math.round(medianTimeToFirst)}h`,
          description: 'Median hours to first story',
          icon: <Clock className="h-4 w-4" />
        },
        {
          title: 'Stories/Family (30d)',
          value: avgStoriesPerFamily,
          description: 'Average stories per family',
          icon: <MessageCircle className="h-4 w-4" />
        },
        {
          title: 'Voice Stories',
          value: `${voicePercentage}%`,
          description: 'Voice among first 10 stories',
          icon: <Mic className="h-4 w-4" />
        }
      ])

      // Generate chart data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
        return date.toISOString().split('T')[0]
      })

      const dailyData = last7Days.map(date => {
        const dayEvents = storiesLast30d.data?.filter((s: any) => 
          s.created_at.split('T')[0] === date
        ) || []
        return {
          name: date.split('-')[2] + '/' + date.split('-')[1],
          value: dayEvents.length,
          date
        }
      })

      setChartData({
        daily: dailyData,
        voiceShare: [
          { name: 'Voice', value: Number(voicePercentage) },
          { name: 'Other', value: 100 - Number(voicePercentage) }
        ],
        timeToFirst: timeToFirstTimes.slice(0, 10).map((time, i) => ({
          name: `User ${i + 1}`,
          value: Math.round(time)
        }))
      })

    } catch (error) {
      console.error('Error loading metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">MVP Metrics</h1>
          <p className="text-muted-foreground">
            Key performance indicators for family engagement
          </p>
        </div>
        <Badge variant="secondary">Live Data</Badge>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
              {metric.change && (
                <Badge variant="outline" className="mt-2">
                  {metric.change}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Daily Stories (7d)</CardTitle>
            <CardDescription>Stories published per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voice Share</CardTitle>
            <CardDescription>Voice vs other story types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData.voiceShare}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--muted))" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time to First (Hours)</CardTitle>
            <CardDescription>Recent user onboarding times</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData.timeToFirst}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}