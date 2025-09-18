import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { FamilyOverviewData, FamilyOverviewFilters } from '@/lib/adminFamilyTypes'

interface UseAdminFamilyDataOptions {
  page: number
  pageSize: number
  filters: FamilyOverviewFilters
}

interface UseAdminFamilyDataReturn {
  data: FamilyOverviewData[]
  loading: boolean
  error: string | null
  totalCount: number
  hasMore: boolean
}

export function useAdminFamilyData({ 
  page, 
  pageSize, 
  filters 
}: UseAdminFamilyDataOptions): UseAdminFamilyDataReturn {
  const [data, setData] = useState<FamilyOverviewData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const fetchFamilyData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Base query for families with creator info
      let query = supabase
        .from('families')
        .select(`
          id,
          name,
          created_at,
          profiles!families_created_by_fkey (
            id,
            full_name,
            email
          )
        `)

      // Apply search filter
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      // Get families data
      const { data: families, error: familiesError, count } = await query
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false })

      if (familiesError) throw familiesError

      setTotalCount(count || 0)

      // Enrich family data with metrics
      const enrichedFamilies: FamilyOverviewData[] = []

      for (const family of families || []) {
        // Get member counts
        const { data: members } = await supabase
          .from('people')
          .select('is_living')
          .eq('family_id', family.id)

        const totalMembers = members?.length || 0
        const livingMembers = members?.filter(m => m.is_living).length || 0
        const deceasedMembers = totalMembers - livingMembers

        // Get recent contributors (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: recentStories } = await supabase
          .from('stories')
          .select('profile_id')
          .eq('family_id', family.id)
          .gte('created_at', thirtyDaysAgo.toISOString())

        const contributors30d = new Set(recentStories?.map(s => s.profile_id)).size

        // Get memories count (stories + answers)
        const [{ count: storiesCount }, { count: answersCount }] = await Promise.all([
          supabase
            .from('stories')
            .select('*', { count: 'exact', head: true })
            .eq('family_id', family.id),
          supabase
            .from('answers')
            .select('*', { count: 'exact', head: true })
            .eq('family_id', family.id)
        ])

        const memoriesCount = (storiesCount || 0) + (answersCount || 0)

        // Get last activity
        const { data: lastActivity } = await supabase
          .from('stories')
          .select('created_at')
          .eq('family_id', family.id)
          .order('created_at', { ascending: false })
          .limit(1)

        // Get invite metrics
        const [
          { count: invitesSent },
          { count: invitesAccepted }
        ] = await Promise.all([
          supabase
            .from('invites')
            .select('*', { count: 'exact', head: true })
            .eq('family_id', family.id),
          supabase
            .from('invites')
            .select('*', { count: 'exact', head: true })
            .eq('family_id', family.id)
            .not('accepted_at', 'is', null)
        ])

        // Calculate storage usage (mock for now)
        const { data: mediaFiles } = await supabase
          .from('media')
          .select('file_size')
          .eq('family_id', family.id)

        const storageUsedMb = Math.round(
          (mediaFiles?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0) / (1024 * 1024)
        )

        // Mock digest settings and flags for now
        const digestEnabled = Math.random() > 0.3 // 70% have digest enabled
        const flagsCount = Math.floor(Math.random() * 3) // 0-2 flags

        // Determine health status
        const hasRecentActivity = lastActivity?.[0]?.created_at && 
          new Date(lastActivity[0].created_at) > thirtyDaysAgo
        const hasMemories = memoriesCount > 0
        const hasInvites = (invitesSent || 0) > 0
        const storageOver80 = storageUsedMb > 800 // Assuming 1GB limit

        let healthStatus: 'healthy' | 'attention' | 'problem' = 'healthy'
        
        if (!hasMemories || !hasInvites || flagsCount > 1 || storageOver80) {
          healthStatus = 'problem'
        } else if (!hasRecentActivity || flagsCount > 0 || !digestEnabled) {
          healthStatus = 'attention'
        }

        enrichedFamilies.push({
          id: family.id,
          name: family.name,
          created_at: family.created_at,
          total_members: totalMembers,
          living_members: livingMembers,
          deceased_members: deceasedMembers,
          contributors_30d: contributors30d,
          memories_count: memoriesCount,
          last_activity: lastActivity?.[0]?.created_at || null,
          digest_enabled: digestEnabled,
          digest_frequency: digestEnabled ? 'weekly' : null,
          invites_sent: invitesSent || 0,
          invites_accepted: invitesAccepted || 0,
          storage_used_mb: storageUsedMb,
          storage_limit_mb: 1024, // 1GB default
          flags_count: flagsCount,
          health_status: healthStatus,
          creator: {
            id: family.profiles?.id || '',
            name: family.profiles?.full_name || family.profiles?.email || 'Unknown',
            email: family.profiles?.email || ''
          }
        })
      }

      // Apply client-side filters
      const filtered = enrichedFamilies.filter(family => {
        if (filters.health_status !== 'all' && family.health_status !== filters.health_status) {
          return false
        }

        if (filters.no_first_memory_24h) {
          const created24hAgo = new Date()
          created24hAgo.setHours(created24hAgo.getHours() - 24)
          if (family.memories_count > 0 || new Date(family.created_at) < created24hAgo) {
            return false
          }
        }

        if (filters.no_invites_sent && family.invites_sent > 0) {
          return false
        }

        if (filters.digest_disabled && family.digest_enabled) {
          return false
        }

        if (filters.storage_over_80) {
          const storagePercent = (family.storage_used_mb / family.storage_limit_mb) * 100
          if (storagePercent <= 80) {
            return false
          }
        }

        if (filters.has_flags && family.flags_count === 0) {
          return false
        }

        return true
      })

      setData(filtered)
    } catch (err) {
      console.error('Failed to fetch family data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFamilyData()
  }, [page, pageSize, JSON.stringify(filters)])

  const hasMore = useMemo(() => {
    return (page + 1) * pageSize < totalCount
  }, [page, pageSize, totalCount])

  return {
    data,
    loading,
    error,
    totalCount,
    hasMore
  }
}