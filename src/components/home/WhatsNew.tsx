import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageCircle, Image, UserPlus, User, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ActivityItem, ActivityFilter } from '@/lib/homeTypes';

export default function WhatsNew() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getActivities = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's family
        const { data: member } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .single();

        if (!member) return;

        // Mock activities for now - in real app would fetch from database
        const mockActivities: ActivityItem[] = [
          {
            type: 'story_published',
            id: '1',
            title: 'Childhood memories from the farm',
            author: 'Sarah Johnson',
            when: '2 hours ago',
            unread: true
          },
          {
            type: 'comment_added',
            id: '2',
            storyTitle: 'Our wedding day',
            author: 'Michael Chen',
            when: '4 hours ago',
            unread: true
          },
          {
            type: 'photo_uploaded',
            id: '3',
            count: 5,
            by: 'Emma Davis',
            when: '1 day ago',
            unread: false
          },
          {
            type: 'invite_accepted',
            id: '4',
            name: 'David Wilson',
            when: '2 days ago',
            unread: false
          }
        ];

        setActivities(mockActivities);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    getActivities();
  }, []);

  const handleMarkAllSeen = () => {
    setActivities(prev => prev.map(activity => ({ ...activity, unread: false })));
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'story_published': return <MessageCircle className="w-4 h-4" />;
      case 'comment_added': return <MessageCircle className="w-4 h-4" />;
      case 'photo_uploaded': return <Image className="w-4 h-4" />;
      case 'invite_accepted': return <UserPlus className="w-4 h-4" />;
      case 'profile_updated': return <User className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'story_published':
        return `${activity.author} shared "${activity.title}"`;
      case 'comment_added':
        return `${activity.author} commented on "${activity.storyTitle}"`;
      case 'photo_uploaded':
        return `${activity.by} uploaded ${activity.count} new photos`;
      case 'invite_accepted':
        return `${activity.name} joined your family`;
      case 'profile_updated':
        return `${activity.name} updated their profile`;
      default:
        return 'New activity';
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    // Add filter logic based on activity type/content
    return true;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-h3 font-serif text-charcoal">What's New</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-warm-beige/50 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-h3 font-serif text-charcoal">What's New</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleMarkAllSeen}
            className="text-sage hover:text-sage/80"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Mark all seen
          </Button>
        </div>
        
        <div className="flex space-x-2 mt-4">
          {(['all', 'my-family', 'about-me'] as ActivityFilter[]).map(filterOption => (
            <Button
              key={filterOption}
              variant={filter === filterOption ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterOption)}
              className={filter === filterOption ? 'bg-sage text-cream' : 'text-sage border-sage/30'}
            >
              {filterOption === 'all' ? 'All' : 
               filterOption === 'my-family' ? 'My Family' : 'About Me'}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredActivities.length === 0 ? (
          <p className="text-warm-gray text-center py-8">
            No recent activity. Check back later!
          </p>
        ) : (
          <div className="space-y-3">
            {filteredActivities.slice(0, 8).map((activity) => (
              <div 
                key={activity.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-warm-beige/30 transition-colors cursor-pointer"
              >
                <div className={`p-2 rounded-full ${activity.unread ? 'bg-sage/20' : 'bg-warm-gray/10'}`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-body text-charcoal truncate">
                    {getActivityText(activity)}
                  </p>
                  <p className="text-fine text-warm-gray">
                    {activity.when}
                  </p>
                </div>
                
                {activity.unread && (
                  <Badge variant="secondary" className="bg-sage/20 text-sage">
                    New
                  </Badge>
                )}
              </div>
            ))}
            
            {filteredActivities.length > 8 && (
              <Button variant="ghost" className="w-full text-sage hover:text-sage/80">
                View all activity
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}