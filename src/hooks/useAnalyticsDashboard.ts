import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

interface PublishRateByPreset {
  preset: 'life' | 'tribute' | 'unknown'
  count: number
  percentage: number
}

interface ContributionsByRole {
  role: string
  count: number
  percentage: number
}

interface IndexabilityImpact {
  indexability: string
  views: number
  avgViewsPerPerson: number
}

interface AnalyticsSummary {
  publishRateByPreset: PublishRateByPreset[]
  contributionsByRole: ContributionsByRole[]
  indexabilityImpact: IndexabilityImpact[]
  totalEvents: number
  dateRange: {
    start: Date
    end: Date
  }
}

export function useAnalyticsDashboard(familyId: string, dateRange?: { start: Date; end: Date }) {
  const [data, setData] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!familyId) return

      setLoading(true)
      setError(null)

      try {
        const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const endDate = dateRange?.end || new Date()

        // Fetch all analytics events for the family
        const { data: events, error: eventsError } = await supabase
          .from('analytics_events')
          .select('event_name, properties, created_at')
          .eq('family_id', familyId)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())

        if (eventsError) throw eventsError

        // Process publish rate by preset
        const storyPublishes = events?.filter(e => e.event_name === 'story_publish') || []
        const presetCounts: Record<string, number> = {}
        storyPublishes.forEach(event => {
          const preset = (event.properties as any)?.preset || 'unknown'
          presetCounts[preset] = (presetCounts[preset] || 0) + 1
        })

        const totalPublishes = Object.values(presetCounts).reduce((sum, count) => sum + count, 0)
        const publishRateByPreset: PublishRateByPreset[] = Object.entries(presetCounts).map(([preset, count]) => ({
          preset: preset as 'life' | 'tribute' | 'unknown',
          count,
          percentage: totalPublishes > 0 ? (count / totalPublishes) * 100 : 0
        }))

        // Process contributions by role
        const contributions = events?.filter(e => 
          ['story_publish', 'block_add', 'guestbook_submit'].includes(e.event_name)
        ) || []
        
        const roleCounts: Record<string, number> = {}
        contributions.forEach(event => {
          const role = (event.properties as any)?.viewer_role || 'unknown'
          roleCounts[role] = (roleCounts[role] || 0) + 1
        })

        const totalContributions = Object.values(roleCounts).reduce((sum, count) => sum + count, 0)
        const contributionsByRole: ContributionsByRole[] = Object.entries(roleCounts).map(([role, count]) => ({
          role,
          count,
          percentage: totalContributions > 0 ? (count / totalContributions) * 100 : 0
        }))

        // Process indexability impact
        const pageViews = events?.filter(e => e.event_name === 'page_view') || []
        const indexabilityViews: Record<string, { count: number; personIds: Set<string> }> = {}
        
        pageViews.forEach(event => {
          const props = event.properties as any
          const indexability = props?.indexability || 'private'
          const personId = props?.person_id
          
          if (!indexabilityViews[indexability]) {
            indexabilityViews[indexability] = { count: 0, personIds: new Set() }
          }
          
          indexabilityViews[indexability].count++
          if (personId) {
            indexabilityViews[indexability].personIds.add(personId)
          }
        })

        const indexabilityImpact: IndexabilityImpact[] = Object.entries(indexabilityViews).map(([indexability, data]) => ({
          indexability,
          views: data.count,
          avgViewsPerPerson: data.personIds.size > 0 ? data.count / data.personIds.size : 0
        }))

        setData({
          publishRateByPreset,
          contributionsByRole,
          indexabilityImpact,
          totalEvents: events?.length || 0,
          dateRange: {
            start: startDate,
            end: endDate
          }
        })
      } catch (err: any) {
        console.error('Analytics fetch error:', err)
        setError(err.message || 'Failed to fetch analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [familyId, dateRange])

  return { data, loading, error }
}
