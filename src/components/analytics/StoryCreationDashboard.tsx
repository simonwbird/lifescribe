import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/integrations/supabase/client'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Loader2 } from 'lucide-react'

interface StoryCreationDashboardProps {
  familyId: string
}

interface AnalyticsData {
  period: {
    start: string
    end: string
  }
  modality_breakdown: Array<{
    mode: string
    count: number
    percentage: number
  }>
  prompt_completions: Array<{
    prompt_id: string
    prompt_title: string
    completions: number
    avg_time_seconds: number
  }>
  total_stories: number
  total_uploads: number
  total_tags: number
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))']

export function StoryCreationDashboard({ familyId }: StoryCreationDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)
        const { data: result, error } = await supabase.rpc('get_story_creation_analytics', {
          p_family_id: familyId
        })

        if (error) throw error
        setData(result as unknown as AnalyticsData)
      } catch (err) {
        console.error('Error fetching analytics:', err)
        setError(err instanceof Error ? err.message : 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    if (familyId) {
      fetchAnalytics()
    }
  }, [familyId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_stories}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assets Uploaded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_uploads}</div>
            <p className="text-xs text-muted-foreground">Photos, videos, audio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">People Tagged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_tags}</div>
            <p className="text-xs text-muted-foreground">Across all stories</p>
          </CardContent>
        </Card>
      </div>

      {/* Modality Breakdown */}
      {data.modality_breakdown && data.modality_breakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Story Creation by Mode</CardTitle>
            <CardDescription>How users are creating stories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.modality_breakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ mode, percentage }) => `${mode}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.modality_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Prompt Completions */}
      {data.prompt_completions && data.prompt_completions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Story Completions by Prompt</CardTitle>
            <CardDescription>Which prompts drive the most stories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.prompt_completions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="prompt_title" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completions" fill="hsl(var(--primary))" name="Completions" />
              </BarChart>
            </ResponsiveContainer>

            {/* Average Time Table */}
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Average Time to Publish</h4>
              <div className="space-y-2">
                {data.prompt_completions.map((prompt, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{prompt.prompt_title}</span>
                    <span className="font-medium">
                      {Math.round(prompt.avg_time_seconds / 60)} min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
