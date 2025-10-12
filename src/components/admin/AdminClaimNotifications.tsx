import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Clock, CheckCircle, AlertTriangle, Users, Mail } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface AdminClaimNotification {
  id: string
  claim_id: string
  notification_type: string
  title: string
  message: string
  read_at?: string
  created_at: string
  claim?: {
    id: string
    claimant_id: string
    claim_type: string
    status: string
    family_id: string
  }
}

export function AdminClaimNotifications() {
  const [notifications, setNotifications] = useState<AdminClaimNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingRead, setMarkingRead] = useState<string | null>(null)

  useEffect(() => {
    loadNotifications()
    
    // Set up real-time subscription for new notifications
    const subscription = supabase
      .channel('admin-claim-notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'admin_claim_notifications' },
        (payload) => {
          const newNotification = payload.new as AdminClaimNotification
          // Check if it's for the current user
          loadNotifications() // Refresh to get proper data with joins
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadNotifications = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data, error } = await supabase
        .from('admin_claim_notifications')
        .select(`
          *,
          admin_claims!inner (
            id,
            claimant_id,
            claim_type,
            status,
            family_id
          )
        `)
        .eq('recipient_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    setMarkingRead(notificationId)

    try {
      const { error } = await supabase
        .from('admin_claim_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)

      if (error) throw error

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read_at: new Date().toISOString() }
            : notif
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      })
    } finally {
      setMarkingRead(null)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id)
      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('admin_claim_notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds)

      if (error) throw error

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          read_at: notif.read_at || new Date().toISOString() 
        }))
      )

      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      })
    }
  }

  const getNotificationIcon = (type: string, claimType?: string) => {
    switch (type) {
      case 'admin_claim_started':
        return claimType === 'endorsement' ? (
          <Users className="h-4 w-4 text-amber-600" />
        ) : (
          <Mail className="h-4 w-4 text-blue-600" />
        )
      case 'admin_claim_approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'admin_claim_denied':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const unreadCount = notifications.filter(n => !n.read_at).length

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Admin Claim Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </h3>
          <p className="text-muted-foreground">Stay updated on admin claim activities</p>
        </div>
        
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <BellOff className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No admin claim notifications</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <Card 
              key={notification.id} 
              className={`${
                notification.read_at 
                  ? 'opacity-60' 
                  : 'border-l-4 border-l-blue-500 bg-blue-50/30'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(
                      notification.notification_type, 
                      notification.claim?.claim_type
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {notification.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {notification.message}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    
                    {!notification.read_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        disabled={markingRead === notification.id}
                      >
                        {markingRead === notification.id ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {notification.claim && (
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {notification.claim.claim_type.replace('_', ' ')}
                    </Badge>
                    <Badge 
                      variant={notification.claim.status === 'approved' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {notification.claim.status}
                    </Badge>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}