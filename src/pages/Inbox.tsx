import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Filter,
  MessageSquare,
  Tag,
  AtSign,
  UserPlus,
  Calendar,
  Heart,
  BookOpen,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotifications, type Notification } from '@/hooks/useNotifications'
import { supabase } from '@/integrations/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import Header from '@/components/Header'

export default function Inbox() {
  const [userId, setUserId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string | null>(null)
  const navigate = useNavigate()

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

  const getNotificationIcon = (type: Notification['type']) => {
    const icons = {
      comment: MessageSquare,
      tag: Tag,
      mention: AtSign,
      invite: UserPlus,
      rsvp: Calendar,
      reaction: Heart,
      story: BookOpen,
    }
    const Icon = icons[type] || Bell
    return <Icon className="h-5 w-5" />
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead(notification.id)
    }

    if (notification.link_url) {
      navigate(notification.link_url)
    }
  }

  const filteredNotifications = filterType
    ? notifications.filter(n => n.type === filterType)
    : notifications

  const unreadNotifications = filteredNotifications.filter(n => !n.read_at)
  const readNotifications = filteredNotifications.filter(n => n.read_at)

  const notificationTypes = [
    { value: 'comment', label: 'Comments', icon: MessageSquare },
    { value: 'tag', label: 'Tags', icon: Tag },
    { value: 'mention', label: 'Mentions', icon: AtSign },
    { value: 'invite', label: 'Invites', icon: UserPlus },
    { value: 'rsvp', label: 'RSVPs', icon: Calendar },
    { value: 'reaction', label: 'Reactions', icon: Heart },
    { value: 'story', label: 'Stories', icon: BookOpen },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <button onClick={() => navigate(-1)} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Bell className="h-8 w-8" />
                Inbox
              </h1>
              <p className="text-muted-foreground mt-2">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up!'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    {filterType ? notificationTypes.find(t => t.value === filterType)?.label : 'All'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background">
                  <DropdownMenuItem onClick={() => setFilterType(null)}>
                    All notifications
                  </DropdownMenuItem>
                  {notificationTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <DropdownMenuItem
                        key={type.value}
                        onClick={() => setFilterType(type.value)}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {type.label}
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsRead()}
                  className="gap-2"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications yet</h3>
              <p className="text-muted-foreground">
                We'll let you know when something happens
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">
                All ({filteredNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread ({unreadNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="read">
                Read ({readNotifications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2 mt-6">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onMarkRead={() => markAsRead(notification.id)}
                  onDelete={() => deleteNotification(notification.id)}
                  getIcon={getNotificationIcon}
                />
              ))}
            </TabsContent>

            <TabsContent value="unread" className="space-y-2 mt-6">
              {unreadNotifications.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">All caught up!</p>
                  </CardContent>
                </Card>
              ) : (
                unreadNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkRead={() => markAsRead(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                    getIcon={getNotificationIcon}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="read" className="space-y-2 mt-6">
              {readNotifications.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No read notifications</p>
                  </CardContent>
                </Card>
              ) : (
                readNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkRead={() => markAsRead(notification.id)}
                    onDelete={() => deleteNotification(notification.id)}
                    getIcon={getNotificationIcon}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}

interface NotificationCardProps {
  notification: Notification
  onClick: () => void
  onMarkRead: () => void
  onDelete: () => void
  getIcon: (type: Notification['type']) => JSX.Element
}

function NotificationCard({
  notification,
  onClick,
  onMarkRead,
  onDelete,
  getIcon,
}: NotificationCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer hover:bg-accent transition-colors group",
        !notification.read_at && "border-primary/50 bg-accent/30"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "p-3 rounded-full flex-shrink-0",
            notification.read_at ? "bg-muted" : "bg-primary/10"
          )}>
            {getIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "text-base font-medium",
                  !notification.read_at && "font-semibold"
                )}>
                  {notification.title}
                </h3>
                {!notification.read_at && (
                  <Badge variant="default" className="h-5">New</Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
            </div>
            {notification.message && (
              <p className="text-sm text-muted-foreground mb-3">
                {notification.message}
              </p>
            )}
            <div className="flex items-center gap-2">
              {notification.link_label && (
                <Badge variant="outline" className="text-xs">
                  {notification.link_label}
                </Badge>
              )}
              <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.read_at && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMarkRead()
                    }}
                    className="h-8 gap-1"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Mark read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                  }}
                  className="h-8 gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
