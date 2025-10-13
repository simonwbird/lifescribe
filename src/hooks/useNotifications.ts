import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from './use-toast'

export interface Notification {
  id: string
  user_id: string
  family_id: string | null
  type: 'comment' | 'tag' | 'mention' | 'invite' | 'rsvp' | 'reaction' | 'story'
  title: string
  message: string | null
  link_url: string | null
  link_label: string | null
  related_entity_id: string | null
  related_entity_type: string | null
  mentioned_person_id: string | null
  metadata: Record<string, any>
  read_at: string | null
  created_at: string
  created_by: string | null
}

export function useNotifications(userId: string | null) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data as Notification[]
    },
    enabled: !!userId,
  })

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read_at).length

  // Mark notification as read
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark notification as read",
        variant: "destructive",
      })
    },
  })

  // Mark all as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('No user ID')

      const { data, error } = await supabase.rpc('mark_all_notifications_read', {
        p_user_id: userId
      })

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to mark all as read",
        variant: "destructive",
      })
    },
  })

  // Delete notification
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete notification",
        variant: "destructive",
      })
    },
  })

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
    isMarkingRead: markAsRead.isPending,
    isMarkingAllRead: markAllAsRead.isPending,
  }
}
