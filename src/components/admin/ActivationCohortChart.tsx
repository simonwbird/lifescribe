import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { CohortData, ActivationFilters } from '@/lib/activationTypes'

interface ActivationCohortChartProps {
  cohortData: CohortData[]
  filters: ActivationFilters
}

// Custom tooltip component to avoid chart.tsx conflicts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{label}</p>
        <div className="space-y-1 mt-2">
          <p className="text-sm">
            <span className="text-muted-foreground">Signups:</span> {data.signups}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Median TTV:</span> {data['Median TTV (hours)'].toFixed(1)} hours
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Day 3 Activation:</span> {data['Day 3 Activation (%)'].toFixed(1)}%
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Day 7 Digest:</span> {data['Day 7 Digest (%)'].toFixed(1)}%
          </p>
        </div>
      </div>
    )
  }
  return null
}

export default function ActivationCohortChart({ cohortData, filters }: ActivationCohortChartProps) {
  const chartData = useMemo(() => {
    return cohortData.map(cohort => ({
      period: cohort.period,
      'Median TTV (hours)': cohort.medianTTV,
      'Day 3 Activation (%)': cohort.day3Activation,
      'Day 7 Digest (%)': cohort.day7Digest,
      signups: cohort.signups
    }))
  }, [cohortData])

  const getCohortLabel = () => {
    switch (filters.cohortBy) {
      case 'week': return 'Weekly Cohorts'
      case 'country': return 'Country Cohorts'
      case 'referrer': return 'Referrer Cohorts'
      default: return 'Cohorts'
    }
  }

  if (!cohortData.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No cohort data available for the selected time range
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{getCohortLabel()}</CardTitle>
          <Badge variant="secondary">
            {cohortData.length} cohorts
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Track activation metrics across different time periods
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="period" 
                className="text-muted-foreground text-xs"
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis className="text-muted-foreground text-xs" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="Median TTV (hours)"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Day 3 Activation (%)"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="Day 7 Digest (%)"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold">
              {(cohortData.reduce((sum, c) => sum + c.medianTTV, 0) / cohortData.length).toFixed(1)}h
            </div>
            <div className="text-xs text-muted-foreground">Avg Median TTV</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {Math.round(cohortData.reduce((sum, c) => sum + c.day3Activation, 0) / cohortData.length)}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Day 3 Activation</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {Math.round(cohortData.reduce((sum, c) => sum + c.day7Digest, 0) / cohortData.length)}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Day 7 Digest</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}