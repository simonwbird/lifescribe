import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { PetReminder } from '@/lib/petReminderTypes'

// Map database row to PetReminder type
function mapReminderRow(row: any): PetReminder {
  return {
    id: row.id,
    petId: row.pet_id,
    familyId: row.family_id,
    type: row.type,
    title: row.title,
    dueDate: row.due_date,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

export function usePetReminders(petId: string | null) {
  return useQuery({
    queryKey: ['pet-reminders', petId],
    queryFn: async (): Promise<PetReminder[]> => {
      if (!petId) return []

      const { data, error } = await supabase
        .from('pet_reminders')
        .select('*')
        .eq('pet_id', petId)
        .order('due_date', { ascending: true })

      if (error) throw error
      return (data || []).map(mapReminderRow)
    },
    enabled: !!petId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export function useUpcomingReminders(familyId: string | null, days = 7) {
  return useQuery({
    queryKey: ['upcoming-reminders', familyId, days],
    queryFn: async (): Promise<PetReminder[]> => {
      if (!familyId) return []

      const now = new Date()
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

      const { data, error } = await supabase
        .from('pet_reminders')
        .select('*')
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .gte('due_date', now.toISOString().split('T')[0])
        .lte('due_date', futureDate.toISOString().split('T')[0])
        .order('due_date', { ascending: true })

      if (error) throw error
      return (data || []).map(mapReminderRow)
    },
    enabled: !!familyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useAddReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reminder: Omit<PetReminder, 'id' | 'createdAt' | 'status'>) => {
      const { data, error } = await supabase
        .from('pet_reminders')
        .insert([{
          pet_id: reminder.petId,
          family_id: reminder.familyId,
          type: reminder.type,
          title: reminder.title,
          due_date: reminder.dueDate,
          status: 'pending',
          notes: reminder.notes,
        }])
        .select()
        .single()

      if (error) throw error
      return mapReminderRow(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pet-reminders', data.petId] })
      queryClient.invalidateQueries({ queryKey: ['upcoming-reminders'] })
    },
  })
}

export function useCompleteReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (reminderId: string) => {
      const { data, error } = await supabase
        .from('pet_reminders')
        .update({ status: 'completed' })
        .eq('id', reminderId)
        .select()
        .single()

      if (error) throw error
      return mapReminderRow(data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pet-reminders', data.petId] })
      queryClient.invalidateQueries({ queryKey: ['upcoming-reminders'] })
    },
  })
}

export function useDeleteReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, petId }: { id: string; petId: string }) => {
      const { error } = await supabase
        .from('pet_reminders')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, petId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pet-reminders', data.petId] })
      queryClient.invalidateQueries({ queryKey: ['upcoming-reminders'] })
    },
  })
}
