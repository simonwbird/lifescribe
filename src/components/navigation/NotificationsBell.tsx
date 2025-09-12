import { useState } from 'react'
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

// Mock notification data - replace with real data
const mockNotifications = [
  {
    id: '1',
    title: 'New comment on your story',
    actor: 'Sarah Johnson',
    when: '2 minutes ago',
    read: false,
    href: '/stories/123#comment-456'
  },
  {
    id: '2',
    title: 'Family member added photos',
    actor: 'Mike Thompson',
    when: '1 hour ago',
    read: false,
    href: '/photos/album-789'
  },
  {
    id: '3',
    title: 'New family member joined',
    actor: 'Emma Davis',
    when: '3 hours ago',
    read: true,
    href: '/family/members'
  }
]

export default function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const { track } = useAnalytics()
  
  const unreadCount = mockNotifications.filter(n => !n.read).length

  const handleNotificationClick = (notification: typeof mockNotifications[0]) => {
    track('notification_clicked', { 
      notificationId: notification.id,
      type: notification.title.split(' ')[0].toLowerCase()
    })
    setOpen(false)
  }

  const handleMarkAllRead = () => {
    track('notifications_mark_all_read')
    // TODO: Implement mark all as read
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
          {mockNotifications.length > 0 ? (
            mockNotifications.map((notification, index) => (
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
                {index < mockNotifications.length - 1 && (
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