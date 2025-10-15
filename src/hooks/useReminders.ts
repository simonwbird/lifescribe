import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { PropertyReminder } from '@/lib/propertyTypes'
import { useToast } from '@/hooks/use-toast'

export function useReminders(propertyId: string | null) {
  return useQuery({
    queryKey: ['reminders', propertyId],
    queryFn: async () => {
      if (!propertyId) return []
      
      const { data, error } = await supabase
        .from('property_reminders' as any)
        .select('*')
        .eq('property_id', propertyId)
        .order('due_at', { ascending: true })

      if (error) {
        console.error('Error fetching reminders:', error)
        return []
      }
      
      return (data || []) as unknown as PropertyReminder[]
    },
    enabled: !!propertyId
  })
}

export function useCreateReminder() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (reminder: Omit<PropertyReminder, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('property_reminders' as any)
        .insert({
          ...reminder,
          created_by: user?.id
        })
        .select()
        .single()

      if (error) throw error
      return data as any
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['reminders', data.property_id] })
      queryClient.invalidateQueries({ queryKey: ['property-reminders'] })
      toast({
        title: 'Reminder created',
        description: 'Maintenance reminder has been added.'
      })
    },
    onError: (error) => {
      console.error('Error creating reminder:', error)
      toast({
        title: 'Error',
        description: 'Failed to create reminder.',
        variant: 'destructive'
      })
    }
  })
}

export function useUpdateReminder() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, updates }: { 
      id: string
      updates: Partial<PropertyReminder> 
    }) => {
      const { data, error } = await supabase
        .from('property_reminders' as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as any
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['reminders', data.property_id] })
      queryClient.invalidateQueries({ queryKey: ['property-reminders'] })
      toast({
        title: 'Reminder updated',
        description: 'Changes have been saved.'
      })
    },
    onError: (error) => {
      console.error('Error updating reminder:', error)
      toast({
        title: 'Error',
        description: 'Failed to update reminder.',
        variant: 'destructive'
      })
    }
  })
}

export function useCompleteReminder() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('property_reminders' as any)
        .update({ completed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as any
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['reminders', data.property_id] })
      queryClient.invalidateQueries({ queryKey: ['property-reminders'] })
      toast({
        title: 'Reminder completed',
        description: 'Task marked as complete.'
      })
    },
    onError: (error) => {
      console.error('Error completing reminder:', error)
      toast({
        title: 'Error',
        description: 'Failed to complete reminder.',
        variant: 'destructive'
      })
    }
  })
}

export function useDeleteReminder() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: string; propertyId: string }) => {
      const { error } = await supabase
        .from('property_reminders' as any)
        .delete()
        .eq('id', id)

      if (error) throw error
      return propertyId
    },
    onSuccess: (propertyId) => {
      queryClient.invalidateQueries({ queryKey: ['reminders', propertyId] })
      queryClient.invalidateQueries({ queryKey: ['property-reminders'] })
      toast({
        title: 'Reminder deleted',
        description: 'Reminder has been removed.'
      })
    },
    onError: (error) => {
      console.error('Error deleting reminder:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete reminder.',
        variant: 'destructive'
      })
    }
  })
}
