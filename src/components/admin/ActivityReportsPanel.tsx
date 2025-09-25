import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  MessageSquare, 
  Calendar,
  Users,
  Activity,
  Download,
  RefreshCw
} from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'

interface ActivityMetric {
  label: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  icon: React.ElementType
}

interface ActivityEvent {
  id: string
  type: 'story' | 'comment' | 'member_join' | 'invite_sent'
  description: string
  user: string
  family: string
  timestamp: string
}

export default function ActivityReportsPanel() {
  const [selectedPeriod, setSelectedPeriod] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  
  const { track } = useAnalytics()

  // Mock data - in real app, this would come from analytics API
  const metrics: ActivityMetric[] = [
    {
      label: 'Stories Created',
      value: 156,
      change: 12.5,
      trend: 'up',
      icon: FileText
    },
    {
      label: 'Comments Posted',
      value: 342,
      change: 8.3,
      trend: 'up',
      icon: MessageSquare
    },
    {
      label: 'New Members',
      value: 23,
      change: -4.2,
      trend: 'down',
      icon: Users
    },
    {
      label: 'Active Families',
      value: 89,
      change: 15.7,
      trend: 'up',
      icon: Users
    }
  ]

  const recentActivity: ActivityEvent[] = [
    {
      id: '1',
      type: 'story',
      description: 'Created story "Summer Vacation 2024"',
      user: 'Sarah Johnson',
      family: 'Johnson Family',
      timestamp: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      type: 'comment',
      description: 'Commented on "Grandma\'s Recipe"',
      user: 'Mike Davis',
      family: 'Davis Family',
      timestamp: '2024-01-20T13:15:00Z'
    },
    {
      id: '3',
      type: 'member_join',
      description: 'Joined family',
      user: 'Emma Wilson',
      family: 'Wilson Family',
      timestamp: '2024-01-20T12:00:00Z'
    },
    {
      id: '4',
      type: 'invite_sent',
      description: 'Invited new member',
      user: 'John Smith',
      family: 'Smith Family',
      timestamp: '2024-01-20T11:45:00Z'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'story': return <FileText className="h-4 w-4 text-blue-600" />
      case 'comment': return <MessageSquare className="h-4 w-4 text-green-600" />
      case 'member_join': return <Users className="h-4 w-4 text-purple-600" />
      case 'invite_sent': return <Users className="h-4 w-4 text-orange-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityBadge = (type: string) => {
    const variants = {
      story: 'default',
      comment: 'secondary',
      member_join: 'outline',
      invite_sent: 'outline'
    } as const
    
    return <Badge variant={variants[type as keyof typeof variants] || 'outline'}>{type.replace('_', ' ')}</Badge>
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <BarChart3 className="h-4 w-4 text-gray-600" />
    }
  }

  const handleRefreshData = async () => {
    setIsLoading(true)
    track('admin_dashboard_refresh' as any)
    
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsLoading(false)
  }

  const handleExportData = () => {
    track('admin_dashboard_export' as any)
    
    // Mock export functionality
    const data = {
      period: selectedPeriod,
      metrics,
      activity: recentActivity,
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `activity-report-${selectedPeriod}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity Reports</h1>
          <p className="text-muted-foreground">Monitor platform usage and engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshData}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportData}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="stories">Stories Only</SelectItem>
            <SelectItem value="comments">Comments Only</SelectItem>
            <SelectItem value="members">Members Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  {getTrendIcon(metric.trend)}
                  <span className={metric.trend === 'up' ? 'text-green-600' : metric.trend === 'down' ? 'text-red-600' : ''}>
                    {metric.change > 0 ? '+' : ''}{metric.change}% from last period
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Activity Tabs */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      {getActivityIcon(activity.type)}
                      <div>
                        <div className="font-medium text-sm">{activity.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {activity.user} • {activity.family}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getActivityBadge(activity.type)}
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Trends</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Chart visualization would go here</p>
                <p className="text-sm">Integration with charting library like Chart.js or Recharts</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Story Creation Up</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Story creation has increased by 12.5% this week, indicating strong engagement.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Comment Engagement</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Comment activity is healthy with an 8.3% increase in discussions.
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-800">Member Growth</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    New member signups are slightly down. Consider reviewing onboarding flow.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}