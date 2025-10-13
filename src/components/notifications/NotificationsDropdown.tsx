import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, Trash2, MessageSquare, Tag, AtSign, UserPlus, Calendar, Heart, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useNotifications, type Notification } from '@/hooks/useNotifications'
import { supabase } from '@/integrations/supabase/client'
import { useAnalytics } from '@/hooks/useAnalytics'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

export function NotificationsDropdown() {
  const [userId, setUserId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { track } = useAnalytics()

  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications(userId)

  // Load user ID
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    loadUser()
  }, [])

  // Track when opened
  useEffect(() => {
    if (open) {
      track('notification_clicked' as any)
    }
  }, [open, track])

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="h-4 w-4" />
      case 'tag':
        return <Tag className="h-4 w-4" />
      case 'mention':
        return <AtSign className="h-4 w-4" />
      case 'invite':
        return <UserPlus className="h-4 w-4" />
      case 'rsvp':
        return <Calendar className="h-4 w-4" />
      case 'reaction':
        return <Heart className="h-4 w-4" />
      case 'story':
        return <BookOpen className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read_at) {
      markAsRead(notification.id)
    }

    // Navigate to the link
    if (notification.link_url) {
      setOpen(false)
      navigate(notification.link_url)
    }
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
    track('notifications_mark_all_read' as any)
  }

  const handleViewAll = () => {
    setOpen(false)
    navigate('/inbox')
    track('notifications_view_all_clicked' as any)
  }

  const recentNotifications = notifications.slice(0, 5)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
              aria-hidden="true"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 bg-background" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-base">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="h-8 text-xs gap-1"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll let you know when something happens
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-accent cursor-pointer transition-colors group",
                    !notification.read_at && "bg-accent/50"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleNotificationClick(notification)
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      notification.read_at ? "bg-muted" : "bg-primary/10"
                    )}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={cn(
                          "text-sm font-medium line-clamp-1",
                          !notification.read_at && "font-semibold"
                        )}>
                          {notification.title}
                        </h4>
                        {!notification.read_at && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                          {notification.message}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read_at && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(notification.id)
                              }}
                              aria-label="Mark as read"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            aria-label="Delete notification"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleViewAll}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
