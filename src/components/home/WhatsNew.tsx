import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Image, 
  MessageCircle, 
  UserPlus, 
  Pin, 
  VolumeX, 
  Check,
  MoreHorizontal,
  Activity
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ActivityItem, ActivityFilter } from '@/lib/homeTypes';
import { useAnalytics } from '@/hooks/useAnalytics';

// Mock data
const mockActivities: ActivityItem[] = [
  {
    id: '0',
    kind: 'story',
    title: 'What was your first full-time work experience?',
    actor: 'Simon Bird',
    when: '2025-09-14T22:08:15Z',
    read: false,
    targetUrl: '/collections?tab=story'
  },
  {
    id: '1',
    kind: 'story',
    title: 'My First Day of School',
    actor: 'Sarah Johnson',
    when: '2025-01-10T14:30:00Z',
    read: false,
    targetUrl: '/story/1'
  },
  {
    id: '2', 
    kind: 'photo',
    title: 'Added 5 photos to Christmas 2024',
    actor: 'Mike Chen',
    when: '2025-01-09T09:15:00Z',
    read: false,
    targetUrl: '/photos/christmas-2024'
  },
  {
    id: '3',
    kind: 'comment',
    title: 'Commented on "Wedding Day Memories"',
    actor: 'Emma Davis',
    when: '2025-01-08T16:45:00Z',
    read: true,
    targetUrl: '/story/wedding-memories#comment-3'
  },
  {
    id: '4',
    kind: 'invite',
    title: 'Joined the family',
    actor: 'David Wilson',
    when: '2025-01-07T11:20:00Z',
    read: false,
    targetUrl: '/people/david-wilson'
  }
];

const getActivityIcon = (kind: ActivityItem['kind']) => {
  const iconProps = { className: "h-4 w-4" };
  switch (kind) {
    case 'story': return <FileText {...iconProps} />;
    case 'photo': return <Image {...iconProps} />;
    case 'comment': return <MessageCircle {...iconProps} />;
    case 'invite': return <UserPlus {...iconProps} />;
  }
};

const formatRelativeTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else {
    return 'Just now';
  }
};

export default function WhatsNew() {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const { track } = useAnalytics();

  const filteredActivities = useMemo(() => {
    let filtered = mockActivities;

    if (showUnreadOnly) {
      filtered = filtered.filter(item => !item.read);
    }

    if (filter !== 'all') {
      filtered = filtered.filter(item => {
        switch (filter) {
          case 'stories': return item.kind === 'story';
          case 'photos': return item.kind === 'photo';
          case 'comments': return item.kind === 'comment';
          case 'invites': return item.kind === 'invite';
          default: return true;
        }
      });
    }

    return filtered;
  }, [filter, showUnreadOnly]);

  const unreadCount = mockActivities.filter(item => !item.read).length;

  const handleFilterChange = (newFilter: ActivityFilter) => {
    setFilter(newFilter);
    track('home_filter_changed', { filter: newFilter });
  };

  const handleMarkAllRead = () => {
    track('home_mark_all_read');
    // In real app, would update backend
    console.log('Marking all as read');
  };

  const handleActivityClick = (item: ActivityItem) => {
    track('home_activity_open', { activityId: item.id, kind: item.kind });
    // In real app, would navigate to target URL
    console.log('Opening activity:', item.targetUrl);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-h3 font-serif">What's New</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                Since last visit: {unreadCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className="text-sm"
          >
            {showUnreadOnly ? 'Show all' : 'Show unread only'}
          </Button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'stories', 'photos', 'comments', 'invites'] as ActivityFilter[]).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange(filterType)}
              className="text-xs h-8 capitalize"
            >
              {filterType}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-serif text-lg mb-2">All caught up!</h3>
            <p className="text-muted-foreground mb-4">No new activity since your last visit.</p>
            <Button>Share a story</Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {filteredActivities.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                    !item.read ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800' : ''
                  }`}
                  onClick={() => handleActivityClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleActivityClick(item);
                    }
                  }}
                >
                  <div className="flex-shrink-0">
                    {getActivityIcon(item.kind)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      by {item.actor} • {formatRelativeTime(item.when)}
                    </p>
                  </div>
                  {!item.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                  )}
                  
                  {/* Overflow menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Pin className="h-4 w-4 mr-2" />
                        Pin
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <VolumeX className="h-4 w-4 mr-2" />
                        Mute updates for this
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Check className="h-4 w-4 mr-2" />
                        Mark as read
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                Mark all as read
              </Button>
              <Button variant="ghost" size="sm">
                View activity
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}