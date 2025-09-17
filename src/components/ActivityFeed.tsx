import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, MessageCircle, UserPlus, BookOpen, ChefHat, TreePine, Package, Clock, Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'

interface ActivityItem {
  id: string
  type: 'story' | 'recipe' | 'person' | 'thing' | 'reaction' | 'comment' | 'member_joined'
  title: string
  description: string
  author_name: string
  author_avatar?: string
  created_at: string
  family_id: string
  item_id?: string
  reaction_type?: string
}

interface ActivityFeedProps {
  familyId: string
  showNotifications?: boolean
}

export default function ActivityFeed({ familyId, showNotifications = false }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    fetchActivities()
    
    // Set up real-time subscriptions for activity updates
    const subscriptions = [
      supabase
        .channel('stories_activity')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'stories',
          filter: `family_id=eq.${familyId}`
        }, () => fetchActivities()),
      
      supabase
        .channel('recipes_activity')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'recipes',
          filter: `family_id=eq.${familyId}`
        }, () => fetchActivities()),
      
      supabase
        .channel('reactions_activity')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'reactions',
          filter: `family_id=eq.${familyId}`
        }, () => fetchActivities()),
      
      supabase
        .channel('comments_activity')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'comments',
          filter: `family_id=eq.${familyId}`
        }, () => fetchActivities())
    ]

    subscriptions.forEach(sub => sub.subscribe())

    return () => {
      subscriptions.forEach(sub => supabase.removeChannel(sub))
    }
  }, [familyId])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      
      // Fetch stories
      const { data: stories } = await supabase
        .from('stories')
        .select(`
          id, title, created_at, profile_id,
          profiles:profile_id (full_name, avatar_url)
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch recipes  
      const { data: recipes } = await supabase
        .from('recipes')
        .select(`
          id, title, created_at, created_by
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch people
      const { data: people } = await supabase
        .from('people')
        .select(`
          id, full_name, created_at, created_by
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch reactions
      const { data: reactions } = await supabase
        .from('reactions')
        .select(`
          id, reaction_type, created_at, profile_id, story_id,
          profiles:profile_id (full_name, avatar_url),
          stories:story_id (title)
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Fetch new members
      const { data: members } = await supabase
        .from('members')
        .select(`
          id, joined_at, profile_id,
          profiles:profile_id (full_name, avatar_url)
        `)
        .eq('family_id', familyId)
        .order('joined_at', { ascending: false })
        .limit(10)

      // Combine and sort all activities
      const allActivities: ActivityItem[] = []

      // Add stories
      stories?.forEach(story => {
        allActivities.push({
          id: `story-${story.id}`,
          type: 'story',
          title: story.title,
          description: 'shared a new story',
          author_name: story.profiles?.full_name || 'Someone',
          author_avatar: story.profiles?.avatar_url,
          created_at: story.created_at,
          family_id: familyId,
          item_id: story.id
        })
      })

      // Add recipes
      recipes?.forEach(recipe => {
        allActivities.push({
          id: `recipe-${recipe.id}`,
          type: 'recipe',
          title: recipe.title,
          description: 'added a new recipe',
          author_name: 'Someone', // We'll fetch profile separately if needed
          author_avatar: undefined,
          created_at: recipe.created_at,
          family_id: familyId,
          item_id: recipe.id
        })
      })

      // Add people
      people?.forEach(person => {
        allActivities.push({
          id: `person-${person.id}`,
          type: 'person',
          title: person.full_name,
          description: 'added to the family tree',
          author_name: 'Someone', // We'll fetch profile separately if needed
          author_avatar: undefined,
          created_at: person.created_at,
          family_id: familyId,
          item_id: person.id
        })
      })

      // Add reactions
      reactions?.forEach(reaction => {
        if (reaction.stories?.title) {
          allActivities.push({
            id: `reaction-${reaction.id}`,
            type: 'reaction',
            title: reaction.stories.title,
            description: `reacted with ${reaction.reaction_type}`,
            author_name: reaction.profiles?.full_name || 'Someone',
            author_avatar: reaction.profiles?.avatar_url,
            created_at: reaction.created_at,
            family_id: familyId,
            item_id: reaction.story_id,
            reaction_type: reaction.reaction_type
          })
        }
      })

      // Add new members
      members?.forEach(member => {
        allActivities.push({
          id: `member-${member.id}`,
          type: 'member_joined',
          title: 'New family member',
          description: 'joined the family',
          author_name: member.profiles?.full_name || 'Someone',
          author_avatar: member.profiles?.avatar_url,
          created_at: member.joined_at,
          family_id: familyId
        })
      })

      // Sort by created_at and take the most recent
      allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setActivities(allActivities.slice(0, 20))
      
      // Calculate unread count (activities from last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const recentActivities = allActivities.filter(
        activity => new Date(activity.created_at) > oneDayAgo
      )
      setUnreadCount(recentActivities.length)

    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'story': return <BookOpen className="w-4 h-4 text-blue-500" />
      case 'recipe': return <ChefHat className="w-4 h-4 text-orange-500" />
      case 'person': return <TreePine className="w-4 h-4 text-green-500" />
      case 'thing': return <Package className="w-4 h-4 text-purple-500" />
      case 'reaction': return <Heart className="w-4 h-4 text-red-500" />
      case 'comment': return <MessageCircle className="w-4 h-4 text-blue-400" />
      case 'member_joined': return <UserPlus className="w-4 h-4 text-green-600" />
      default: return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.type === 'story' && activity.item_id) {
      navigate(`/stories/${activity.item_id}`)
    } else if (activity.type === 'recipe' && activity.item_id) {
      navigate(`/recipe/${activity.item_id}`)
    } else if (activity.type === 'person' && activity.item_id) {
      navigate(`/people/${activity.item_id}`)
    }
  }

  if (showNotifications) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Recent Activity</span>
          </h3>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} new</Badge>
          )}
        </div>
        
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recent activity</p>
        ) : (
          <div className="space-y-2">
            {activities.slice(0, 5).map(activity => (
              <div 
                key={activity.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => handleActivityClick(activity)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activity.author_avatar} />
                  <AvatarFallback>
                    {activity.author_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.author_name}</span>
                    {' '}{activity.description}
                    {activity.type !== 'member_joined' && (
                      <span className="font-medium"> "{activity.title}"</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
                
                {getActivityIcon(activity.type)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Family Activity</span>
        </CardTitle>
        <CardDescription>
          See what's happening in your family
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground">
              Start by sharing a story or adding family members
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map(activity => (
              <div 
                key={activity.id}
                className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleActivityClick(activity)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activity.author_avatar} />
                  <AvatarFallback>
                    {activity.author_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {getActivityIcon(activity.type)}
                    <span className="font-medium text-sm">{activity.author_name}</span>
                    <span className="text-sm text-muted-foreground">{activity.description}</span>
                  </div>
                  
                  {activity.type !== 'member_joined' && (
                    <p className="text-sm font-medium mb-1">"{activity.title}"</p>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
            
            {activities.length >= 20 && (
              <Button variant="outline" className="w-full">
                Load More Activities
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}