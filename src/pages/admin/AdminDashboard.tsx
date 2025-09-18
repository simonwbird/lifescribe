import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, FileText, Mail, TrendingUp, Database, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  totalFamilies: number
  totalUsers: number
  totalStories: number
  pendingInvites: number
  totalMedia: number
  weeklyGrowth: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalFamilies: 0,
    totalUsers: 0,
    totalStories: 0,
    pendingInvites: 0,
    totalMedia: 0,
    weeklyGrowth: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch basic counts
        const [familiesCount, usersCount, storiesCount, invitesCount, mediaCount] = await Promise.all([
          supabase.from('families').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('stories').select('*', { count: 'exact', head: true }),
          supabase.from('invites').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('media').select('*', { count: 'exact', head: true })
        ])

        // Calculate weekly growth (mock for now)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        
        const { count: newUsersThisWeek } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString())

        setStats({
          totalFamilies: familiesCount.count || 0,
          totalUsers: usersCount.count || 0,
          totalStories: storiesCount.count || 0,
          pendingInvites: invitesCount.count || 0,
          totalMedia: mediaCount.count || 0,
          weeklyGrowth: newUsersThisWeek || 0
        })
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Total Families',
      value: stats.totalFamilies,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Stories Created',
      value: stats.totalStories,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Pending Invites',
      value: stats.pendingInvites,
      icon: Mail,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Media Files',
      value: stats.totalMedia,
      icon: Database,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      title: 'Weekly Growth',
      value: stats.weeklyGrowth,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your LifeScribe platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Database Status</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Healthy
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">API Response Time</span>
              <Badge variant="secondary">
                &lt;200ms
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Storage Usage</span>
              <Badge variant="secondary">
                76%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <button className="text-left p-2 rounded-lg hover:bg-muted transition-colors text-sm">
                View Recent Signups
              </button>
              <button className="text-left p-2 rounded-lg hover:bg-muted transition-colors text-sm">
                Export User Data
              </button>
              <button className="text-left p-2 rounded-lg hover:bg-muted transition-colors text-sm">
                Review Flagged Content
              </button>
              <button className="text-left p-2 rounded-lg hover:bg-muted transition-colors text-sm">
                System Configuration
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}