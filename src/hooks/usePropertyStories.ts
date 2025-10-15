import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function usePropertyStories(familyId: string | null, limit = 5) {
  return useQuery({
    queryKey: ['property-stories', familyId, limit],
    queryFn: async () => {
      if (!familyId) return []
      
      const { data: links, error } = await supabase
        .from('story_property_links' as any)
        .select('story_id, property_id, created_at')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching property stories:', error)
        return []
      }
      
      return []
    },
    enabled: !!familyId
  })
}
