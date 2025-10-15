import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { PropertyReminder } from '@/lib/propertyTypes'

export function usePropertyReminders(familyId: string | null, daysAhead = 30) {
  return useQuery({
    queryKey: ['property-reminders', familyId, daysAhead],
    queryFn: async () => {
      if (!familyId) return []
      
      const now = new Date()
      const futureDate = new Date()
      futureDate.setDate(now.getDate() + daysAhead)

      const { data: reminders, error } = await supabase
        .from('property_reminders' as any)
        .select('*')
        .eq('family_id', familyId)
        .is('completed_at', null)
        .gte('due_at', now.toISOString())
        .lte('due_at', futureDate.toISOString())
        .order('due_at', { ascending: true })

      if (error) {
        console.error('Error fetching reminders:', error)
        return []
      }
      
      return (reminders || []).map((r: any) => ({
        ...r,
        property: { id: '', title: 'Property' }
      })) as (PropertyReminder & { property: { id: string; title: string } })[]
    },
    enabled: !!familyId
  })
}
