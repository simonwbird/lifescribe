import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { PropertyDocument } from '@/lib/propertyTypes'

export function useExpiringDocuments(familyId: string) {
  return useQuery({
    queryKey: ['expiring-documents', familyId],
    queryFn: async () => {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const { data, error } = await supabase
        .from('property_documents' as any)
        .select(`
          *,
          property:properties(id, title)
        `)
        .eq('family_id', familyId)
        .not('expires_at', 'is', null)
        .lte('expires_at', thirtyDaysFromNow.toISOString().split('T')[0])
        .order('expires_at', { ascending: true })

      if (error) {
        console.error('Error fetching expiring documents:', error)
        return []
      }

      return (data || []) as unknown as (PropertyDocument & {
        property: { id: string; title: string }
      })[]
    },
    enabled: !!familyId,
  })
}
