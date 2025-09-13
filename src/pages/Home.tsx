import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import QuickCaptureComposer from '@/components/capture/QuickCaptureComposer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { useAnalytics } from '@/hooks/useAnalytics'

// Import capture background images
import writingPaperBg from '@/assets/capture-backgrounds/writing-paper.jpg'
import cameraLensBg from '@/assets/capture-backgrounds/camera-lens.jpg'
import microphoneBg from '@/assets/capture-backgrounds/microphone.jpg'
import videoCameraBg from '@/assets/capture-backgrounds/video-camera.jpg'
import { 
  FileText, 
  Camera, 
  Mic, 
  Video,
  Users,
  Gift,
  MessageCircle,
  Heart,
  Calendar,
  TreePine,
  TrendingUp,
  ChevronRight,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  ChefHat,
  Package,
  Home as HomeIcon,
  Heart as PetIcon,
  Settings,
  MoreHorizontal,
  Bell,
  Plus,
  Star,
  Clock
} from 'lucide-react'

// Types
interface FamilySpace {
  id: string
  type: 'stories' | 'photos' | 'recipes' | 'objects' | 'properties' | 'pets' | 'private'
  title: string
  count: number
  lastUpdated: string | null
  icon: React.ComponentType<any>
  href: string
  addHref: string
}

interface ActivityItem {
  id: string
  type: 'story' | 'comment' | 'invite' | 'photo'
  actor: string
  action: string
  target: string
  snippet?: string
  time: string
  unread: boolean
}

interface ResumeItem {
  id: string
  type: 'story' | 'voice' | 'video' | 'photo' | 'property' | 'object'
  title: string
  progress: number
  lastEdited: string
}

interface Suggestion {
  id: string
  title: string
  description: string
  type: 'story' | 'photo' | 'voice' | 'recipe'
  action: string
}

interface UpcomingEvent {
  id: string
  title: string
  date: string
  type: 'birthday' | 'anniversary'
  person?: string
}

export default function HomeV2() {
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false)
  const [familySpaces, setFamilySpaces] = useState<FamilySpace[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [resumeItems, setResumeItems] = useState<ResumeItem[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [streak, setStreak] = useState({ current: 4, target: 7 })
  const [simpleMode, setSimpleMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activitiesPage, setActivitiesPage] = useState(1)
  const activitiesPerPage = 5
  const [selectedCaptureMode, setSelectedCaptureMode] = useState<'write' | 'photo' | 'voice' | 'video'>('write')
  
  const navigate = useNavigate()
  const { track } = useAnalytics()

  // Helper functions for time formatting
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`
    
    return date.toLocaleDateString()
  }

  const isRecent = (dateString: string): boolean => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    return diffInHours <= 24 // Consider anything within 24 hours as recent/unread
  }

  const parseTimeAgo = (timeStr: string): number => {
    // Simple parser for "X hours ago" format - returns milliseconds
    if (timeStr.includes('hours ago')) {
      const hours = parseInt(timeStr)
      return hours * 60 * 60 * 1000
    }
    if (timeStr.includes('days ago')) {
      const days = parseInt(timeStr)
      return days * 24 * 60 * 60 * 1000
    }
    return 0
  }

  // Load user preferences and data
  useEffect(() => {
    loadHomeData()
    track('home_v2_load')
  }, []) // Remove track dependency to prevent re-renders

  const loadHomeData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's family
      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (!member) return

      await Promise.all([
        loadFamilySpaces(member.family_id),
        loadActivities(member.family_id, user.id),
        loadResumeItems(user.id),
        loadSuggestions(),
        loadUpcomingEvents(member.family_id),
        loadStreak(user.id)
      ])
    } catch (error) {
      console.error('Error loading home data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFamilySpaces = async (familyId: string) => {
    // Get counts for each collection type
    const [storiesRes, recipesRes, petsRes, propertiesRes] = await Promise.all([
      supabase.from('stories').select('id', { count: 'exact' }).eq('family_id', familyId),
      supabase.from('recipes').select('id', { count: 'exact' }).eq('family_id', familyId),
      supabase.from('pets').select('id', { count: 'exact' }).eq('family_id', familyId),
      supabase.from('properties').select('id', { count: 'exact' }).eq('family_id', familyId)
    ])

    const spaces: FamilySpace[] = [
      {
        id: 'stories',
        type: 'stories',
        title: 'Family Stories',
        count: storiesRes.count || 0,
        lastUpdated: '2 hours ago',
        icon: FileText,
        href: '/collections?tab=story',
        addHref: '/stories/new'
      },
      {
        id: 'recipes',
        type: 'recipes', 
        title: 'Recipes',
        count: recipesRes.count || 0,
        lastUpdated: '1 day ago',
        icon: ChefHat,
        href: '/collections?tab=recipe',
        addHref: '/recipes/new'
      },
      {
        id: 'objects',
        type: 'objects',
        title: 'Heirlooms',
        count: 12, // Mock count since we don't have things table
        lastUpdated: '3 days ago',
        icon: Package,
        href: '/collections?tab=object',
        addHref: '/objects/new'
      },
      {
        id: 'properties',
        type: 'properties',
        title: 'Homes',
        count: propertiesRes.count || 0,
        lastUpdated: '1 week ago',
        icon: HomeIcon,
        href: '/collections?tab=property',
        addHref: '/properties/new'
      },
      {
        id: 'pets',
        type: 'pets',
        title: 'Pets',
        count: petsRes.count || 0,
        lastUpdated: '2 days ago',
        icon: PetIcon,
        href: '/collections?tab=pet',
        addHref: '/pets/new'
      }
    ]

    setFamilySpaces(spaces)
  }

  const loadActivities = async (familyId: string, userId: string) => {
    try {
      const activities: ActivityItem[] = []

      // Get recent stories
      const { data: stories } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          content,
          created_at,
          profiles:profile_id (full_name)
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (stories) {
        stories.forEach(story => {
          activities.push({
            id: `story-${story.id}`,
            type: 'story',
            actor: story.profiles?.full_name || 'Someone',
            action: 'shared a story',
            target: story.title,
            snippet: story.content?.substring(0, 100) + '...',
            time: getRelativeTime(story.created_at),
            unread: isRecent(story.created_at)
          })
        })
      }

      // Get recent recipes  
      const { data: recipes } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          notes,
          created_at,
          created_by
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (recipes) {
        for (const recipe of recipes) {
          // Get creator profile separately
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', recipe.created_by)
            .single()

          activities.push({
            id: `recipe-${recipe.id}`,
            type: 'photo',
            actor: profile?.full_name || 'Someone',
            action: 'added a recipe',
            target: recipe.title,
            snippet: recipe.notes?.substring(0, 100),
            time: getRelativeTime(recipe.created_at),
            unread: isRecent(recipe.created_at)
          })
        }
      }

      // Get recent pets
      const { data: pets } = await supabase
        .from('pets')
        .select(`
          id,
          name,
          species,
          created_at,
          created_by
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (pets) {
        for (const pet of pets) {
          // Get creator profile separately
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', pet.created_by)
            .single()

          activities.push({
            id: `pet-${pet.id}`,
            type: 'photo',
            actor: profile?.full_name || 'Someone',
            action: 'added a pet',
            target: `${pet.name} (${pet.species})`,
            time: getRelativeTime(pet.created_at),
            unread: isRecent(pet.created_at)
          })
        }
      }

      // Get recent properties
      const { data: properties } = await supabase
        .from('properties')
        .select(`
          id,
          name,
          description,
          created_at,
          created_by
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (properties) {
        for (const property of properties) {
          // Get creator profile separately
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', property.created_by)
            .single()

          activities.push({
            id: `property-${property.id}`,
            type: 'photo',
            actor: profile?.full_name || 'Someone',
            action: 'added a property',
            target: property.name,
            snippet: property.description?.substring(0, 100),
            time: getRelativeTime(property.created_at),
            unread: isRecent(property.created_at)
          })
        }
      }

      // Get recent comments
      const { data: comments } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          story_id,
          profiles:profile_id (full_name),
          stories:story_id (title)
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (comments) {
        comments.forEach(comment => {
          activities.push({
            id: `comment-${comment.id}`,
            type: 'comment',
            actor: comment.profiles?.full_name || 'Someone',
            action: 'commented on',
            target: comment.stories?.title || 'a story',
            snippet: comment.content?.substring(0, 100),
            time: getRelativeTime(comment.created_at),
            unread: isRecent(comment.created_at)
          })
        })
      }

      // Sort all activities by created_at timestamp and take the most recent
      activities.sort((a, b) => {
        // Extract timestamp from the time string or use a proper timestamp field
        const timeA = new Date(a.time.includes('ago') ? Date.now() - parseTimeAgo(a.time) : a.time).getTime()
        const timeB = new Date(b.time.includes('ago') ? Date.now() - parseTimeAgo(b.time) : b.time).getTime()
        return timeB - timeA
      })
      setActivities(activities.slice(0, 15))
      
    } catch (error) {
      console.error('Error loading activities:', error)
      // Fallback to empty array
      setActivities([])
    }
  }

  const loadResumeItems = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (!member) return

      const resumeItems: ResumeItem[] = []

      // Get recently updated stories
      const { data: stories } = await supabase
        .from('stories')
        .select('id, title, updated_at')
        .eq('family_id', member.family_id)
        .eq('profile_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(3)

      if (stories) {
        stories.forEach(story => {
          resumeItems.push({
            id: story.id,
            type: 'story',
            title: story.title,
            progress: Math.floor(Math.random() * 40) + 60, // Mock progress for now
            lastEdited: getRelativeTime(story.updated_at)
          })
        })
      }

      // Get recently updated recipes
      const { data: recipes } = await supabase
        .from('recipes')
        .select('id, title, updated_at')
        .eq('family_id', member.family_id)
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false })
        .limit(2)

      if (recipes) {
        recipes.forEach(recipe => {
          resumeItems.push({
            id: recipe.id,
            type: 'property',
            title: recipe.title,
            progress: Math.floor(Math.random() * 30) + 70,
            lastEdited: getRelativeTime(recipe.updated_at)
          })
        })
      }

      setResumeItems(resumeItems.slice(0, 4))
    } catch (error) {
      console.error('Error loading resume items:', error)
      setResumeItems([])
    }
  }

  const loadSuggestions = async () => {
    const mockSuggestions: Suggestion[] = [
      {
        id: '1',
        title: 'Share a memory about your first pet',
        description: 'Tell the story of how you met your first furry friend',
        type: 'story',
        action: 'Write Story'
      },
      {
        id: '2',
        title: 'Upload photos from last weekend',
        description: 'Add those family gathering photos to your collection',
        type: 'photo',
        action: 'Add Photos'
      },
      {
        id: '3',
        title: 'Record Grandma\\\'s secret recipe',
        description: 'Capture her cooking tips in her own voice',
        type: 'voice',
        action: 'Record Voice'
      }
    ]
    setSuggestions(mockSuggestions)
  }

  const loadUpcomingEvents = async (familyId: string) => {
    const mockEvents: UpcomingEvent[] = [
      {
        id: '1',
        title: 'Mom\\\'s Birthday',
        date: '2024-01-25',
        type: 'birthday',
        person: 'Mom'
      },
      {
        id: '2',
        title: 'Parents\\\' Anniversary',
        date: '2024-02-14',
        type: 'anniversary'
      }
    ]
    setUpcomingEvents(mockEvents)
  }

  const loadStreak = async (userId: string) => {
    // Would calculate from actual capture data
    setStreak({ current: 4, target: 7 })
  }

  const handleQuickCapture = (mode: 'write' | 'photo' | 'voice' | 'video') => {
    setSelectedCaptureMode(mode)
    setQuickCaptureOpen(true)
    track('home_quick_capture_open', { mode })
  }

  const handleMarkAllRead = () => {
    setActivities(prev => prev.map(item => ({ ...item, unread: false })))
    track('home_mark_all_read')
  }

  const handleResumeItem = (item: ResumeItem) => {
    track('home_resume_click', { type: item.type })
    // Navigate to appropriate editor
    if (item.type === 'story') {
      navigate(`/stories/${item.id}/edit`)
    } else if (item.type === 'property') {
      navigate(`/recipes/${item.id}/edit`)
    }
  }

  const handleSuggestionClick = (suggestion: Suggestion) => {
    track('home_suggestion_click', { type: suggestion.type })
    if (suggestion.type === 'story') {
      navigate('/stories/new')
    } else if (suggestion.type === 'photo') {
      handleQuickCapture('photo')
    } else if (suggestion.type === 'voice') {
      handleQuickCapture('voice')
    }
  }

  if (loading) {
    return (
      <AuthGate>
        <div className="min-h-screen">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-32 bg-muted rounded-lg"></div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                  <div className="h-24 bg-muted rounded-lg"></div>
                  <div className="h-40 bg-muted rounded-lg"></div>
                  <div className="h-60 bg-muted rounded-lg"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-20 bg-muted rounded-lg"></div>
                  <div className="h-32 bg-muted rounded-lg"></div>
                  <div className="h-40 bg-muted rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGate>
    )
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Primary Column */}
            <div className="lg:col-span-3 space-y-6 max-w-4xl">
              
              {/* Quick Capture Hero */}
              <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">What would you like to capture today?</CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {streak.current}/{streak.target} streak
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Primary capture modes */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button 
                      onClick={() => handleQuickCapture('write')}
                      variant="outline"
                      className="relative h-24 flex-col gap-2 overflow-hidden border-0 shadow-sm group"
                      style={{
                        backgroundImage: `linear-gradient(rgba(239, 246, 255, 0.9), rgba(199, 210, 254, 0.9)), url(${writingPaperBg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-100/30 group-hover:from-blue-100/50 group-hover:to-indigo-200/50 transition-all duration-300"></div>
                      <FileText className="h-7 w-7 relative z-10 text-blue-600" />
                      <span className="font-semibold relative z-10 text-blue-800">Write</span>
                    </Button>
                    <Button 
                      onClick={() => handleQuickCapture('photo')}
                      variant="outline"
                      className="relative h-24 flex-col gap-2 overflow-hidden border-0 shadow-sm group"
                      style={{
                        backgroundImage: `linear-gradient(rgba(236, 253, 245, 0.9), rgba(167, 243, 208, 0.9)), url(${cameraLensBg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-teal-100/30 group-hover:from-emerald-100/50 group-hover:to-teal-200/50 transition-all duration-300"></div>
                      <Camera className="h-7 w-7 relative z-10 text-emerald-600" />
                      <span className="font-semibold relative z-10 text-emerald-800">Photo</span>
                    </Button>
                    <Button 
                      onClick={() => handleQuickCapture('voice')}
                      variant="outline"
                      className="relative h-24 flex-col gap-2 overflow-hidden border-0 shadow-sm group"
                      style={{
                        backgroundImage: `linear-gradient(rgba(255, 247, 237, 0.9), rgba(254, 215, 170, 0.9)), url(${microphoneBg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/30 to-amber-100/30 group-hover:from-orange-100/50 group-hover:to-amber-200/50 transition-all duration-300"></div>
                      <Mic className="h-7 w-7 relative z-10 text-orange-600" />
                      <span className="font-semibold relative z-10 text-orange-800">Voice</span>
                    </Button>
                    <Button 
                      onClick={() => handleQuickCapture('video')}
                      variant="outline"
                      className="relative h-24 flex-col gap-2 overflow-hidden border-0 shadow-sm group"
                      style={{
                        backgroundImage: `linear-gradient(rgba(250, 245, 255, 0.9), rgba(221, 214, 254, 0.9)), url(${videoCameraBg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 to-violet-100/30 group-hover:from-purple-100/50 group-hover:to-violet-200/50 transition-all duration-300"></div>
                      <Video className="h-7 w-7 relative z-10 text-purple-600" />
                      <span className="font-semibold relative z-10 text-purple-800">Video</span>
                    </Button>
                  </div>

                  {/* Secondary actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/prompts')}>
                      Answer today's prompt
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/family/members')}>
                      Invite family
                    </Button>
                    <Button variant="ghost" size="sm">
                      Upload a batch
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* What's New */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>What's New</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                        Mark all as read
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/collections')}>
                        View activity
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="stories">Stories</TabsTrigger>
                      <TabsTrigger value="photos">Photos</TabsTrigger>
                      <TabsTrigger value="comments">Comments</TabsTrigger>
                      <TabsTrigger value="invites">Invites</TabsTrigger>
                    </TabsList>
                    
                     <TabsContent value="all" className="space-y-3 mt-4">
                       {activities
                         .slice((activitiesPage - 1) * activitiesPerPage, activitiesPage * activitiesPerPage)
                         .map((activity) => (
                         <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                           <div className={`w-2 h-2 rounded-full mt-2 ${activity.unread ? 'bg-primary' : 'bg-muted'}`} />
                           <div className="flex-1 min-w-0">
                             <p className="text-sm">
                               <span className="font-medium">{activity.actor}</span>{' '}
                               <span className="text-muted-foreground">{activity.action}</span>{' '}
                               <span className="font-medium">{activity.target}</span>
                             </p>
                             {activity.snippet && (
                               <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                 {activity.snippet}
                               </p>
                             )}
                             <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                           </div>
                           <div className="flex gap-1">
                             <Button variant="ghost" size="sm">View</Button>
                             <Button variant="ghost" size="sm">
                               <Heart className="h-3 w-3" />
                             </Button>
                             <Button variant="ghost" size="sm">
                               <MessageCircle className="h-3 w-3" />
                             </Button>
                           </div>
                         </div>
                       ))}
                       
                       {/* Pagination */}
                       {activities.length > activitiesPerPage && (
                         <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t">
                           <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={() => setActivitiesPage(Math.max(1, activitiesPage - 1))}
                             disabled={activitiesPage === 1}
                           >
                             Previous
                           </Button>
                           
                           <div className="flex gap-1">
                             {Array.from({ length: Math.ceil(activities.length / activitiesPerPage) }, (_, i) => i + 1).map((page) => (
                               <Button
                                 key={page}
                                 variant={activitiesPage === page ? "default" : "outline"}
                                 size="sm"
                                 onClick={() => setActivitiesPage(page)}
                                 className="w-8 h-8"
                               >
                                 {page}
                               </Button>
                             ))}
                           </div>
                           
                           <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={() => setActivitiesPage(Math.min(Math.ceil(activities.length / activitiesPerPage), activitiesPage + 1))}
                             disabled={activitiesPage === Math.ceil(activities.length / activitiesPerPage)}
                           >
                             Next
                           </Button>
                         </div>
                       )}
                     </TabsContent>
                    
                    {/* Other tabs would show filtered content */}
                    <TabsContent value="stories">Stories activity...</TabsContent>
                    <TabsContent value="photos">Photos activity...</TabsContent>
                    <TabsContent value="comments">Comments activity...</TabsContent>
                    <TabsContent value="invites">Invites activity...</TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Continue Where You Left Off */}
              {resumeItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Continue Where You Left Off</CardTitle>
                    <CardDescription>Pick up where you paused</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {resumeItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                          {item.type === 'story' && <FileText className="h-5 w-5" />}
                          {item.type === 'photo' && <Camera className="h-5 w-5" />}
                          {item.type === 'voice' && <Mic className="h-5 w-5" />}
                          {item.type === 'video' && <Video className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={item.progress} className="flex-1 h-2" />
                            <span className="text-xs text-muted-foreground">{item.progress}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{item.lastEdited}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleResumeItem(item)}
                          >
                            Resume
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Your Family Spaces / Collections */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Family Spaces</CardTitle>
                  <CardDescription>Collections of your family's memories and stories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {familySpaces.map((space) => {
                      const IconComponent = space.icon
                      return (
                        <div key={space.id} className="group border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <IconComponent className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-medium">{space.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {space.count} {space.count === 1 ? 'item' : 'items'}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={space.href}>
                                <ChevronRight className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              Last updated {space.lastUpdated}
                            </p>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="outline" size="sm" asChild>
                                <a href={space.href}>Open</a>
                              </Button>
                              <Button size="sm" asChild>
                                <a href={space.addHref}>Add</a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Rail */}
            <div className={`space-y-4 ${simpleMode ? 'hidden lg:block' : ''}`}>
              
              {/* This Week's Captures (Streak) */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">This Week's Captures</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="w-full h-full rounded-full border-4 border-muted">
                      <div 
                        className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-none"
                        style={{
                          clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos(2 * Math.PI * (streak.current / streak.target) - Math.PI/2)}% ${50 + 50 * Math.sin(2 * Math.PI * (streak.current / streak.target) - Math.PI/2)}%, 50% 50%)`
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{streak.current}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{streak.current} of {streak.target} days</p>
                    <p className="text-xs text-muted-foreground">Keep it up!</p>
                  </div>
                  <Button 
                    className="w-full" 
                    size="sm"
                    onClick={() => handleQuickCapture('write')}
                  >
                    Capture now
                  </Button>
                </CardContent>
              </Card>

              {/* Suggestions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Suggestions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suggestions.slice(0, 3).map((suggestion) => (
                    <div key={suggestion.id} className="p-3 border rounded-lg">
                      <h4 className="text-sm font-medium mb-1">{suggestion.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{suggestion.description}</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion.action}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                          {event.type === 'birthday' ? (
                            <Gift className="h-4 w-4" />
                          ) : (
                            <Heart className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Tree Peek */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Tree Peek</CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <a href="/family/tree">View tree</a>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>2 new people added this week</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>3 new relationships linked</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Simple Mode Toggle */}
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setSimpleMode(!simpleMode)
                    track('home_simple_mode_toggle', { enabled: !simpleMode })
                  }}
                >
                  <Settings className="h-3 w-3 mr-2" />
                  {simpleMode ? 'Show all modules' : 'Simple mode'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Capture Composer */}
        <QuickCaptureComposer
          isOpen={quickCaptureOpen}
          onClose={() => setQuickCaptureOpen(false)}
          onSave={() => {
            setQuickCaptureOpen(false)
            // Update streak
            track('home_streak_capture')
            setStreak(prev => ({ ...prev, current: Math.min(prev.current + 1, prev.target) }))
          }}
        />
      </div>
    </AuthGate>
  )
}
