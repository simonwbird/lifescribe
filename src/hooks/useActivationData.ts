import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { ActivationKPIs, ActivationFunnel, CohortData, ActivationFilters, FamilyStuckData } from '@/lib/activationTypes'

interface UseActivationDataReturn {
  kpis: ActivationKPIs | null
  funnel: ActivationFunnel | null
  cohortData: CohortData[]
  loading: boolean
  error: string | null
}

export function useActivationData(filters: ActivationFilters): UseActivationDataReturn {
  const [kpis, setKpis] = useState<ActivationKPIs | null>(null)
  const [funnel, setFunnel] = useState<ActivationFunnel | null>(null)
  const [cohortData, setCohortData] = useState<CohortData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivationData = async () => {
    try {
      setLoading(true)
      setError(null)

      const now = new Date()
      const timeRangeStart = new Date()
      
      switch (filters.timeRange) {
        case '7d':
          timeRangeStart.setDate(now.getDate() - 7)
          break
        case '30d':
          timeRangeStart.setDate(now.getDate() - 30)
          break
        case '90d':
          timeRangeStart.setDate(now.getDate() - 90)
          break
      }

      // Fetch families created in the time range
      const { data: families } = await supabase
        .from('families')
        .select(`
          id,
          name,
          created_at,
          created_by,
          profiles!families_created_by_fkey (
            id,
            email,
            full_name,
            created_at
          )
        `)
        .gte('created_at', timeRangeStart.toISOString())
        .order('created_at', { ascending: false })

      if (!families) throw new Error('Failed to fetch families')

      // Calculate KPIs
      await calculateKPIs(families)
      await calculateFunnel(families)
      await calculateCohortData(families, filters)

    } catch (err) {
      console.error('Failed to fetch activation data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const calculateKPIs = async (families: any[]) => {
    const ttvHours: number[] = []
    let day3Completed = 0
    let day7DigestEnabled = 0

    for (const family of families) {
      const createdAt = new Date(family.created_at)
      const threeDaysAfter = new Date(createdAt)
      threeDaysAfter.setDate(threeDaysAfter.getDate() + 3)
      
      const sevenDaysAfter = new Date(createdAt)
      sevenDaysAfter.setDate(sevenDaysAfter.getDate() + 7)

      // Calculate TTV (Time to first memory)
      const { data: firstMemory } = await supabase
        .from('stories')
        .select('created_at')
        .eq('family_id', family.id)
        .order('created_at', { ascending: true })
        .limit(1)

      if (firstMemory?.[0]) {
        const firstMemoryTime = new Date(firstMemory[0].created_at)
        const diffHours = (firstMemoryTime.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
        ttvHours.push(diffHours)
      }

      // Check Day 3 activation bundle
      const hasMemory = firstMemory?.[0] && new Date(firstMemory[0].created_at) <= threeDaysAfter
      
      const { data: acceptedInvite } = await supabase
        .from('invites')
        .select('accepted_at')
        .eq('family_id', family.id)
        .not('accepted_at', 'is', null)
        .lte('accepted_at', threeDaysAfter.toISOString())
        .limit(1)

      const { data: importantDate } = await supabase
        .from('life_events')
        .select('created_at')
        .eq('family_id', family.id)
        .lte('created_at', threeDaysAfter.toISOString())
        .limit(1)

      if (hasMemory && acceptedInvite?.[0] && importantDate?.[0]) {
        day3Completed++
      }

      // Check Day 7 digest enabled (mock for now)
      if (new Date() >= sevenDaysAfter) {
        // In real implementation, check digest settings
        if (Math.random() > 0.4) { // 60% have digest enabled by day 7
          day7DigestEnabled++
        }
      }
    }

    // Calculate median TTV
    ttvHours.sort((a, b) => a - b)
    const medianTTV = ttvHours.length > 0 
      ? ttvHours.length % 2 === 0 
        ? (ttvHours[ttvHours.length / 2 - 1] + ttvHours[ttvHours.length / 2]) / 2
        : ttvHours[Math.floor(ttvHours.length / 2)]
      : 0

    const eligibleForDay7 = families.filter(f => {
      const sevenDaysAfter = new Date(f.created_at)
      sevenDaysAfter.setDate(sevenDaysAfter.getDate() + 7)
      return new Date() >= sevenDaysAfter
    }).length

    setKpis({
      medianTTV: {
        hours: Math.round(medianTTV * 10) / 10,
        change: Math.random() * 20 - 10 // Mock change percentage
      },
      day3Activation: {
        percentage: Math.round((day3Completed / families.length) * 100),
        change: Math.random() * 10 - 5,
        total: families.length,
        completed: day3Completed
      },
      day7DigestEnabled: {
        percentage: eligibleForDay7 > 0 ? Math.round((day7DigestEnabled / eligibleForDay7) * 100) : 0,
        change: Math.random() * 15 - 7.5,
        total: eligibleForDay7,
        enabled: day7DigestEnabled
      }
    })
  }

  const calculateFunnel = async (families: any[]) => {
    const signups = families.length
    let firstMemory = 0
    let inviteSent = 0
    let inviteAccepted = 0
    let digestSent = 0
    
    const stuckAtSignup: FamilyStuckData[] = []
    const stuckAtMemory: FamilyStuckData[] = []
    const stuckAtInviteSent: FamilyStuckData[] = []
    const stuckAtInviteAccepted: FamilyStuckData[] = []

    for (const family of families) {
      let familyStage = 'signup'
      const daysSinceSignup = Math.floor((Date.now() - new Date(family.created_at).getTime()) / (1000 * 60 * 60 * 24))
      
      // Check if has first memory
      const { data: memories } = await supabase
        .from('stories')
        .select('created_at')
        .eq('family_id', family.id)
        .limit(1)

      if (memories?.[0]) {
        firstMemory++
        familyStage = 'memory'

        // Check if sent invite
        const { data: invites } = await supabase
          .from('invites')
          .select('accepted_at, created_at')
          .eq('family_id', family.id)
          .limit(1)

        if (invites?.[0]) {
          inviteSent++
          familyStage = 'invite_sent'

          // Check if invite accepted
          if (invites[0].accepted_at) {
            inviteAccepted++
            familyStage = 'invite_accepted'

            // Mock digest sent (70% chance if invite accepted)
            if (Math.random() > 0.3) {
              digestSent++
              familyStage = 'digest_sent'
            } else {
              stuckAtInviteAccepted.push({
                id: family.id,
                name: family.name,
                createdAt: family.created_at,
                daysSinceSignup,
                email: family.profiles?.email || '',
                missingSteps: ['Digest not sent']
              })
            }
          } else {
            stuckAtInviteSent.push({
              id: family.id,
              name: family.name,
              createdAt: family.created_at,
              daysSinceSignup,
              email: family.profiles?.email || '',
              missingSteps: ['Invite not accepted']
            })
          }
        } else {
          stuckAtMemory.push({
            id: family.id,
            name: family.name,
            createdAt: family.created_at,
            daysSinceSignup,
            email: family.profiles?.email || '',
            missingSteps: ['No invite sent']
          })
        }
      } else {
        stuckAtSignup.push({
          id: family.id,
          name: family.name,
          createdAt: family.created_at,
          daysSinceSignup,
          email: family.profiles?.email || '',
          missingSteps: ['No first memory']
        })
      }
    }

    setFunnel({
      totalSignups: signups,
      stages: [
        {
          id: 'signup',
          name: 'Signed Up',
          count: signups,
          percentage: 100,
          stuckFamilies: stuckAtSignup
        },
        {
          id: 'first_memory',
          name: 'First Memory',
          count: firstMemory,
          percentage: signups > 0 ? Math.round((firstMemory / signups) * 100) : 0,
          stuckFamilies: stuckAtMemory
        },
        {
          id: 'invite_sent',
          name: 'Invite Sent',
          count: inviteSent,
          percentage: signups > 0 ? Math.round((inviteSent / signups) * 100) : 0,
          stuckFamilies: stuckAtInviteSent
        },
        {
          id: 'invite_accepted',
          name: 'Invite Accepted',
          count: inviteAccepted,
          percentage: signups > 0 ? Math.round((inviteAccepted / signups) * 100) : 0,
          stuckFamilies: stuckAtInviteAccepted
        },
        {
          id: 'digest_sent',
          name: 'Digest Sent',
          count: digestSent,
          percentage: signups > 0 ? Math.round((digestSent / signups) * 100) : 0,
          stuckFamilies: []
        }
      ]
    })
  }

  const calculateCohortData = async (families: any[], filters: ActivationFilters) => {
    // Group families by cohort period
    const cohorts: Record<string, any[]> = {}
    
    families.forEach(family => {
      const createdAt = new Date(family.created_at)
      let cohortKey: string

      if (filters.cohortBy === 'week') {
        const year = createdAt.getFullYear()
        const week = getWeekNumber(createdAt)
        cohortKey = `${year}-W${week.toString().padStart(2, '0')}`
      } else {
        // For now, default to weekly grouping for country/referrer
        const year = createdAt.getFullYear()
        const week = getWeekNumber(createdAt)
        cohortKey = `${year}-W${week.toString().padStart(2, '0')}`
      }

      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = []
      }
      cohorts[cohortKey].push(family)
    })

    // Calculate metrics for each cohort
    const cohortDataArray: CohortData[] = []
    
    for (const [period, cohortFamilies] of Object.entries(cohorts)) {
      // Mock calculations for cohort metrics
      cohortDataArray.push({
        period,
        signups: cohortFamilies.length,
        medianTTV: Math.random() * 48 + 2, // 2-50 hours
        day3Activation: Math.random() * 60 + 20, // 20-80%
        day7Digest: Math.random() * 40 + 40 // 40-80%
      })
    }

    setCohortData(cohortDataArray.sort((a, b) => a.period.localeCompare(b.period)))
  }

  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  useEffect(() => {
    fetchActivationData()
  }, [JSON.stringify(filters)])

  return {
    kpis,
    funnel,
    cohortData,
    loading,
    error
  }
}