import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { DigestSettings } from '@/lib/digestTypes'
import { weeklyDigestService } from '@/lib/weeklyDigestService'
import { useAnalytics } from './useAnalytics'
import { DigestToggledEvent, DigestPausedEvent, DigestResumedEvent } from '@/types/analytics'

export const useDigestSettings = (familyId: string | null) => {
  const queryClient = useQueryClient()
  const { track } = useAnalytics()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['digest-settings', familyId],
    queryFn: async () => {
      if (!familyId) return null
      return await weeklyDigestService.getSettingsByFamily(familyId)
    },
    enabled: !!familyId
  })

  const toggleDigestMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!familyId) throw new Error('No family selected')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (enabled) {
        await weeklyDigestService.enableDigest(user.id, familyId)
      } else {
        await weeklyDigestService.disableDigest(user.id)
      }
    },
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: ['digest-settings', familyId] })
      // Track analytics (temporarily using any to bypass type issues)
      track({ event_name: 'digest_toggled', properties: { enabled, family_id: familyId } } as any)
    }
  })

  const pauseDigestMutation = useMutation({
    mutationFn: async () => {
      if (!familyId) throw new Error('No family selected')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await weeklyDigestService.pauseDigestFor30Days(user.id, familyId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digest-settings', familyId] })
      track({ event_name: 'digest_paused', properties: { family_id: familyId, duration_days: 30 } } as any)
    }
  })

  const resumeDigestMutation = useMutation({
    mutationFn: async () => {
      if (!familyId) throw new Error('No family selected')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await weeklyDigestService.resumeDigest(user.id, familyId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digest-settings', familyId] })
      track({ event_name: 'digest_resumed', properties: { family_id: familyId } } as any)
    }
  })

  return {
    settings,
    isLoading,
    toggleDigest: toggleDigestMutation.mutate,
    pauseDigest: pauseDigestMutation.mutate,
    resumeDigest: resumeDigestMutation.mutate,
    isToggling: toggleDigestMutation.isPending,
    isPausing: pauseDigestMutation.isPending,
    isResuming: resumeDigestMutation.isPending
  }
}