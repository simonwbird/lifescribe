import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { PersonaType } from '@/config/personaConfig'

interface UserProfile {
  id: string
  first_name?: string
  persona?: PersonaType
}

export function useUserPersona(profileId?: string) {
  return useQuery({
    queryKey: ['userPersona', profileId],
    queryFn: async () => {
      if (!profileId) {
        return null
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .single()

      if (error) {
        console.error('Error fetching user persona:', error)
        return null
      }

      // Return basic profile - first_name and persona might not exist yet
      return {
        id: data.id,
        first_name: undefined,
        persona: undefined
      } as UserProfile
    },
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}
