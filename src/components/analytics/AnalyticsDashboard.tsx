import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard'
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts'
import { Calendar, TrendingUp, Users, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AnalyticsDashboardProps {
  familyId: string
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))']

export function AnalyticsDashboard({ familyId }: AnalyticsDashboardProps) {
  const [dateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  })

  const { data, loading, error } = useAnalyticsDashboard(familyId, dateRange)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error || 'Failed to load analytics data'}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Privacy-respecting insights for your family archive
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Last 30 days</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              All tracked activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stories Published</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.publishRateByPreset.reduce((sum, p) => sum + p.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all pages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.indexabilityImpact.reduce((sum, i) => sum + i.views, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Person page visits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.contributionsByRole.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active role types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Publish Rate by Preset */}
        <Card>
          <CardHeader>
            <CardTitle>Publish Rate by Preset</CardTitle>
            <CardDescription>
              Stories published in Life vs Tribute pages
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.publishRateByPreset.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.publishRateByPreset as any}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.preset}: ${Number(entry.percentage).toFixed(1)}%`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="count"
                    nameKey="preset"
                  >
                    {data.publishRateByPreset.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No publish data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contributions by Role */}
        <Card>
          <CardHeader>
            <CardTitle>Contributions by Role</CardTitle>
            <CardDescription>
              Activity from different family member roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.contributionsByRole.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.contributionsByRole}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="role" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Contributions" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No contribution data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Indexability Impact */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Impact of Indexability on Page Views</CardTitle>
            <CardDescription>
              How page visibility settings affect visits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.indexabilityImpact.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.indexabilityImpact}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="indexability" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="hsl(var(--primary))" name="Total Views" />
                  <Bar dataKey="avgViewsPerPerson" fill="hsl(var(--secondary))" name="Avg Views/Person" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No view data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Privacy Notice */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Privacy Notice</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc space-y-1 pl-4">
            <li>No personally identifiable information (PII) is tracked</li>
            <li>Data is aggregated and anonymized</li>
            <li>Events are sampled: 100% for first 30 days, 20% afterward</li>
            <li>Analytics help improve the family archive experience</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
