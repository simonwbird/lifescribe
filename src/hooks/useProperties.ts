import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { PropertyWithStats } from '@/lib/propertyTypes'

export function useProperties(familyId: string | null) {
  return useQuery({
    queryKey: ['properties', familyId],
    queryFn: async () => {
      if (!familyId) return []
      
      const { data: properties, error } = await supabase
        .from('properties' as any)
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching properties:', error)
        return []
      }
      
      return (properties || []).map((p: any) => ({
        ...p,
        story_count: 0,
        has_upcoming_reminders: false,
        has_documents: false
      })) as PropertyWithStats[]
    },
    enabled: !!familyId
  })
}
