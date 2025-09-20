import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Clock, Target, Mail, Download, RefreshCw } from 'lucide-react'
import { useActivationData } from '@/hooks/useActivationData'
import { useAnalytics } from '@/hooks/useAnalytics'
import ActivationKPICard from '@/components/admin/ActivationKPICard'
import ActivationFunnelChart from '@/components/admin/ActivationFunnelChart'
import ActivationCohortChart from '@/components/admin/ActivationCohortChart'
import type { ActivationFilters } from '@/lib/activationTypes'

export default function ActivationDashboard() {
  const [filters, setFilters] = useState<ActivationFilters>({
    timeRange: '30d',
    cohortBy: 'week'
  })

  const { kpis, funnel, cohortData, loading, error } = useActivationData(filters)
  const { track } = useAnalytics()

  const handleFilterChange = (key: keyof ActivationFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    track('ADMIN_COHORT_FILTER_APPLIED' as any, {
      filter: key,
      value,
      timeRange: newFilters.timeRange,
      cohortBy: newFilters.cohortBy
    })
  }

  const handleExport = () => {
    track('ADMIN_ACTIVATION_EXPORT_STARTED' as any, filters)
    // TODO: Implement export functionality
    console.log('Exporting activation data...')
  }

  const handleRefresh = () => {
    // Force refresh by updating filters
    setFilters({ ...filters })
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading activation data: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Time Range:</label>
              <Select
                value={filters.timeRange}
                onValueChange={(value) => handleFilterChange('timeRange', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Cohort by:</label>
              <Select
                value={filters.cohortBy}
                onValueChange={(value) => handleFilterChange('cohortBy', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="referrer">Referrer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          {kpis && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ActivationKPICard
                title="Median Time to Value"
                value={`${kpis.medianTTV.hours}h`}
                subtitle="Median hours from signup to first memory"
                change={kpis.medianTTV.change}
                icon={Clock}
              />
              <ActivationKPICard
                title="Day 3 Activation Bundle"
                value={`${kpis.day3Activation.percentage}%`}
                subtitle={`${kpis.day3Activation.completed} of ${kpis.day3Activation.total} new families`}
                change={kpis.day3Activation.change}
                icon={Target}
              />
              <ActivationKPICard
                title="Day 7 Weekly Digest"
                value={`${kpis.day7DigestEnabled.percentage}%`}
                subtitle={`${kpis.day7DigestEnabled.enabled} of ${kpis.day7DigestEnabled.total} eligible families`}
                change={kpis.day7DigestEnabled.change}
                icon={Mail}
              />
            </div>
          )}

          {/* Funnel Chart */}
          {funnel && (
            <ActivationFunnelChart funnel={funnel} />
          )}

          {/* Cohort Chart */}
          <ActivationCohortChart cohortData={cohortData} filters={filters} />
        </>
      )}
    </div>
  )
}