import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  title: string
  actor: string
  when: string
  read: boolean
  href: string
  type: 'story' | 'comment' | 'recipe' | 'member' | 'pet' | 'property'
}

export default function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { track } = useAnalytics()
  
  const unreadCount = notifications.filter(n => !n.read).length

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} days ago`
    return date.toLocaleDateString()
  }

  const isRecent = (dateString: string): boolean => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    return diffInHours <= 24
  }

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (!member) return

      const notificationList: Notification[] = []

      // Get recent comments on user's stories
      const { data: comments } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          story_id,
          family_member_profiles:profile_id (full_name),
          stories:story_id (title, profile_id)
        `)
        .eq('family_id', member.family_id)
        .neq('profile_id', user.id) // Don't show own comments
        .order('created_at', { ascending: false })
        .limit(10)

      if (comments) {
        comments.forEach(comment => {
          if (comment.stories?.profile_id === user.id) {
            notificationList.push({
              id: `comment-${comment.id}`,
              title: 'New comment on your story',
              actor: comment.family_member_profiles?.full_name || 'Someone',
              when: getRelativeTime(comment.created_at),
              read: !isRecent(comment.created_at),
              href: `/stories/${comment.story_id}#comment-${comment.id}`,
              type: 'comment'
            })
          }
        })
      }

      // Get recent stories from family members
      const { data: stories } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          created_at,
          family_member_profiles:profile_id (full_name)
        `)
        .eq('family_id', member.family_id)
        .neq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (stories) {
        stories.forEach(story => {
          notificationList.push({
            id: `story-${story.id}`,
            title: 'New family story shared',
            actor: story.family_member_profiles?.full_name || 'Someone',
            when: getRelativeTime(story.created_at),
            read: !isRecent(story.created_at),
            href: `/stories/${story.id}`,
            type: 'story'
          })
        })
      }

      // Sort by most recent first
      notificationList.sort((a, b) => {
        const timeA = new Date(a.when.includes('ago') ? Date.now() : a.when).getTime()
        const timeB = new Date(b.when.includes('ago') ? Date.now() : b.when).getTime()
        return timeB - timeA
      })

      setNotifications(notificationList.slice(0, 10))
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleNotificationClick = (notification: Notification) => {
    track('notification_clicked', { 
      notificationId: notification.id,
      type: notification.type
    })
    setOpen(false)
  }

  const handleMarkAllRead = () => {
    track('notifications_mark_all_read')
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative hover:bg-accent hover:text-accent-foreground"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0 bg-popover border border-border shadow-lg"
        role="menu"
      >
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs h-auto p-1"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <div className="animate-pulse">Loading notifications...</div>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <div key={notification.id}>
                <DropdownMenuItem className="p-0" role="none">
                  <Link
                    to={notification.href}
                    className={`flex items-start gap-3 px-4 py-3 w-full hover:bg-accent hover:text-accent-foreground ${
                      !notification.read ? 'bg-accent/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    role="menuitem"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      !notification.read ? 'bg-primary' : 'bg-transparent'
                    }`} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.actor} · {notification.when}
                      </p>
                    </div>
                  </Link>
                </DropdownMenuItem>
                {index < notifications.length - 1 && (
                  <DropdownMenuSeparator className="mx-4" />
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />
        <div className="p-2">
          <Link
            to="/inbox"
            className="block w-full text-center py-2 text-sm font-medium text-primary hover:bg-accent hover:text-accent-foreground rounded-md"
            onClick={() => {
              track('notifications_view_all_clicked')
              setOpen(false)
            }}
          >
            View all notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}