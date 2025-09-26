import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertTriangle, User, Calendar, Camera, BookOpen, Clock, Edit2, ArrowLeft } from 'lucide-react'
import Header from '@/components/Header'
import PersonPromptsTab from '@/components/prompts/PersonPromptsTab'
import MemoryPhotosGallery from '@/components/people/MemoryPhotosGallery'
import { Person, getUserRole, getPageType } from '@/utils/personUtils'
import { formatForUser, getCurrentUserRegion } from '@/utils/date'

interface ProfileData {
  id: string
  email: string
  full_name: string
  avatar_url: string
  settings: any
}

export default function PersonProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [person, setPerson] = useState<Person | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [memberRole, setMemberRole] = useState<string | null>(null)
  const [stories, setStories] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!id) return

    const fetchPersonAndUser = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUserId(user?.id || null)

        if (!user) {
          window.location.href = '/login'
          return
        }

        const { data: personData, error: personError } = await supabase
          .from('people')
          .select('*')
          .eq('id', id)
          .single()

        if (personError) throw personError

        if (personData) {
          const { data: memberData } = await supabase
            .from('members')
            .select('role')
            .eq('family_id', personData.family_id)
            .eq('profile_id', user.id)
            .single()

          setMemberRole(memberData?.role || 'guest')
        }

        setPerson(personData as Person)
        
        // Fetch stories for this person
        const { data: storyData } = await supabase
          .from('person_story_links')
          .select(`
            story_id,
            stories (
              id,
              title,
              content,
              occurred_on,
              created_at,
              profile_id,
              profiles (full_name)
            )
          `)
          .eq('person_id', id)
          .order('created_at', { ascending: false })

        setStories(storyData?.map(link => link.stories).filter(Boolean) || [])
      } catch (error) {
        console.error('Error fetching person:', error)
        setError('Failed to load person data')
      } finally {
        setLoading(false)
      }
    }

    fetchPersonAndUser()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-96" />
            <Skeleton className="h-6 w-48" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Person not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const userRole = getUserRole(person, currentUserId, memberRole)
  const userRegion = getCurrentUserRegion()

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString()
    } catch {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/people')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to People
            </Button>
          </div>
        </div>

        {/* Person Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={person.avatar_url || ''} alt={person.full_name} />
                <AvatarFallback className="text-2xl">
                  {person.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'P'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold">{person.full_name}</h1>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/people/${person.id}/timeline`)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    View Timeline
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {person.birth_date && (
                    <Badge variant="secondary">
                      <Calendar className="h-3 w-3 mr-1" />
                      Born {formatDate(person.birth_date)}
                    </Badge>
                  )}
                  {person.death_date && (
                    <Badge variant="secondary">
                      Died {formatDate(person.death_date)}
                    </Badge>
                  )}
                </div>

                {person.bio && (
                  <p className="text-muted-foreground text-sm mt-3 max-w-2xl">
                    {person.bio}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="stories" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Stories ({stories.length})
            </TabsTrigger>
            <TabsTrigger value="prompts" className="flex items-center gap-2">
              <Edit2 className="h-4 w-4" />
              Questions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {person.birth_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Born:</span>
                      <span>{formatDate(person.birth_date)}</span>
                    </div>
                  )}
                  {person.death_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Died:</span>
                      <span>{formatDate(person.death_date)}</span>
                    </div>
                  )}
                  {person.bio && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-muted-foreground">Biography:</span>
                      <span className="text-sm">{person.bio}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Stories */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Stories</CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab('stories')}
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {stories.length > 0 ? (
                    <div className="space-y-3">
                      {stories.slice(0, 3).map((story) => (
                        <div key={story.id} className="border-l-2 border-muted pl-3">
                          <h4 className="font-medium text-sm">{story.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {story.content?.substring(0, 100)}...
                          </p>
                          {story.occurred_on && (
                            <span className="text-xs text-muted-foreground">
                              {formatDate(story.occurred_on)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No stories yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="photos">
            <MemoryPhotosGallery person={person} />
          </TabsContent>

          <TabsContent value="stories" className="space-y-4">
            {stories.length > 0 ? (
              <div className="space-y-4">
                {stories.map((story) => (
                  <Card key={story.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{story.title}</CardTitle>
                        <div className="text-sm text-muted-foreground">
                          {story.occurred_on && formatDate(story.occurred_on)}
                        </div>
                      </div>
                      {story.profiles?.full_name && (
                        <p className="text-sm text-muted-foreground">
                          Shared by {story.profiles.full_name}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">{story.content}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Stories Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Be the first to share a story about {person.full_name}
                  </p>
                  <Button onClick={() => navigate('/stories/new')}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Share a Story
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="prompts">
            <PersonPromptsTab
              person={person}
              familyId={person.family_id}
              onStartPrompt={(instanceId) => {
                window.location.href = `/prompts/respond/${instanceId}`
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}