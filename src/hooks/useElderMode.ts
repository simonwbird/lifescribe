import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'

export function useElderMode(userId: string | null) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: elderModeData, isLoading } = useQuery({
    queryKey: ['elder-mode', userId],
    queryFn: async () => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('elder_mode, elder_phone_code')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!userId,
  })

  const enableElderMode = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('No user ID')

      const { data, error } = await supabase.rpc('enable_elder_mode', {
        p_user_id: userId
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elder-mode', userId] })
      toast({
        title: "Elder Mode Enabled!",
        description: "Large button interface is now active",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to enable Elder Mode",
        variant: "destructive",
      })
    },
  })

  const disableElderMode = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('No user ID')

      const { error } = await supabase
        .from('profiles')
        .update({ elder_mode: false })
        .eq('id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['elder-mode', userId] })
      toast({
        title: "Elder Mode Disabled",
        description: "Standard interface restored",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to disable Elder Mode",
        variant: "destructive",
      })
    },
  })

  return {
    isElderMode: elderModeData?.elder_mode || false,
    phoneCode: elderModeData?.elder_phone_code,
    isLoading,
    enableElderMode: enableElderMode.mutate,
    disableElderMode: disableElderMode.mutate,
    isEnabling: enableElderMode.isPending,
    isDisabling: disableElderMode.isPending,
  }
}