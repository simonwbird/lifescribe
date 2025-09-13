import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import ProfilePhotoUploader from '@/components/ProfilePhotoUploader'
import StoryCard from '@/components/StoryCard'
import AnswerCard from '@/components/AnswerCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  User,
  Calendar,
  FileText,
  MessageSquare,
  ImageIcon,
  Link as LinkIcon,
  Camera,
  Heart,
  TreePine,
  ArrowLeft,
  Plus
} from 'lucide-react'
import type { Story, Answer, Question, Profile } from '@/lib/types'
import type { Person } from '@/lib/familyTreeTypes'
import { formatPersonYears, getPersonDisplayName } from '@/utils/familyTreeUtils'
import { useToast } from '@/hooks/use-toast'

interface PersonStory extends Story {
  profiles: Profile
}

interface PersonAnswer extends Answer {
  profiles: Profile
  questions: Question
}

export default function PersonProfile() {
  const { id } = useParams<{ id: string }>()
  const [person, setPerson] = useState<Person | null>(null)
  const [stories, setStories] = useState<PersonStory[]>([])
  const [answers, setAnswers] = useState<PersonAnswer[]>([])
  const [allStories, setAllStories] = useState<Story[]>([])
  const [relationships, setRelationships] = useState<any[]>([])
  const [photos, setPhotos] = useState<any[]>([])
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLinkStoryOpen, setIsLinkStoryOpen] = useState(false)
  const [selectedStoryId, setSelectedStoryId] = useState('')
  const [isLinkedToUser, setIsLinkedToUser] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      loadPersonData()
    }
  }, [id])

  const loadPersonData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      // Get user's family
      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (!member) return
      setFamilyId(member.family_id)

      // Load person details
      const { data: personData } = await supabase
        .from('people')
        .select('*')
        .eq('id', id)
        .eq('family_id', member.family_id)
        .single()

      if (!personData) return
      setPerson(personData as Person)

      // Load linked stories
      const { data: linkedStories } = await supabase
        .from('person_story_links')
        .select(`
          story_id,
          stories (*, profiles (*))
        `)
        .eq('person_id', id)

      const storyData = linkedStories?.map(link => link.stories).filter(Boolean) || []
      setStories(storyData as PersonStory[])

      // Load linked answers
      const { data: linkedAnswers } = await supabase
        .from('person_answer_links')
        .select(`
          answer_id,
          answers (*, profiles (*), questions (*))
        `)
        .eq('person_id', id)

      const answerData = linkedAnswers?.map(link => link.answers).filter(Boolean) || []
      setAnswers(answerData as PersonAnswer[])

      // Load all family stories for linking
      const { data: familyStories } = await supabase
        .from('stories')
        .select('*')
        .eq('family_id', member.family_id)

      setAllStories(familyStories || [])

      // Load relationships
      const { data: relationshipData } = await supabase
        .from('relationships')
        .select(`
          *,
          from_people:people!relationships_from_person_id_fkey(*),
          to_people:people!relationships_to_person_id_fkey(*)
        `)
        .or(`from_person_id.eq.${id},to_person_id.eq.${id}`)
        .eq('family_id', member.family_id)

      setRelationships(relationshipData || [])

      // Load photos/media
      const { data: mediaData } = await supabase
        .from('media')
        .select('*')
        .eq('family_id', member.family_id)
        .or(`story_id.in.(${storyData.map(s => s.id).join(',')}),answer_id.in.(${answerData.map(a => a.id).join(',')})`)

      setPhotos(mediaData || [])

      // Check if this person is linked to current user
      const { data: userLink } = await supabase
        .from('person_user_links')
        .select('id')
        .eq('person_id', id)
        .eq('user_id', user.id)
        .eq('family_id', member.family_id)
        .single()

      setIsLinkedToUser(!!userLink)

    } catch (error) {
      console.error('Error loading person data:', error)
      toast({
        title: "Error",
        description: "Failed to load person details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLinkStory = async () => {
    if (!selectedStoryId || !person || !familyId) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if link already exists
      const { data: existing } = await supabase
        .from('person_story_links')
        .select('id')
        .eq('person_id', person.id)
        .eq('story_id', selectedStoryId)
        .single()

      if (existing) {
        toast({
          title: "Already Linked",
          description: "This story is already linked to this person",
          variant: "destructive"
        })
        return
      }

      await supabase
        .from('person_story_links')
        .insert({
          person_id: person.id,
          story_id: selectedStoryId,
          family_id: familyId
        })

      toast({
        title: "Story Linked",
        description: "The story has been linked to this person"
      })

      setIsLinkStoryOpen(false)
      setSelectedStoryId('')
      loadPersonData() // Reload to show new link

    } catch (error) {
      console.error('Error linking story:', error)
      toast({
        title: "Error",
        description: "Failed to link story",
        variant: "destructive"
      })
    }
  }

  const handlePhotoUploaded = (newPhotoUrl: string) => {
    setPerson(prev => prev ? { ...prev, avatar_url: newPhotoUrl } : null)
  }

  const handlePhotoUpload = async () => {
    // This function is now handled by the ProfilePhotoUploader component
    toast({
      title: "Photo Upload",
      description: "Click on the avatar to upload a new photo"
    })
  }

  const getRelationshipSummary = () => {
    const children = relationships.filter(r => r.relationship_type === 'parent' && r.from_person_id === person?.id)
    const parents = relationships.filter(r => r.relationship_type === 'parent' && r.to_person_id === person?.id)
    const spouses = relationships.filter(r => r.relationship_type === 'spouse' && 
      (r.from_person_id === person?.id || r.to_person_id === person?.id))

    return { parents, children, spouses }
  }

  const handleLinkToUser = async () => {
    if (!person || !familyId || !currentUserId) return

    try {
      if (isLinkedToUser) {
        // Unlink
        await supabase
          .from('person_user_links')
          .delete()
          .eq('person_id', person.id)
          .eq('user_id', currentUserId)
          .eq('family_id', familyId)

        setIsLinkedToUser(false)
        toast({
          title: "Profile Unlinked",
          description: "This person is no longer linked to your profile"
        })
      } else {
        // Link
        await supabase
          .from('person_user_links')
          .insert({
            person_id: person.id,
            user_id: currentUserId,
            family_id: familyId
          })

        setIsLinkedToUser(true)
        toast({
          title: "Profile Linked",
          description: "This person is now linked to your profile"
        })
      }
    } catch (error) {
      console.error('Error linking profile:', error)
      toast({
        title: "Error",
        description: "Failed to link/unlink profile",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <AuthGate>
        <div className="min-h-screen">
          <Header />
          <div className="container mx-auto px-4 py-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AuthGate>
    )
  }

  if (!person) {
    return (
      <AuthGate>
        <div className="min-h-screen">
          <Header />
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Person Not Found</h1>
            <Link to="/family/tree">
              <Button>
                <TreePine className="h-4 w-4 mr-2" />
                Back to Family Tree
              </Button>
            </Link>
          </div>
        </div>
      </AuthGate>
    )
  }

  const { parents, children, spouses } = getRelationshipSummary()
  const displayName = getPersonDisplayName(person)
  const years = formatPersonYears(person)
  const initials = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Header */}
        <div className="border-b bg-white">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link to="/family/tree">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Tree
                  </Button>
                </Link>
                <div className="flex items-center space-x-4">
                  <ProfilePhotoUploader
                    currentPhotoUrl={person.avatar_url || ''}
                    fallbackText={initials}
                    onPhotoUploaded={handlePhotoUploaded}
                    personId={person.id}
                    isUserProfile={false}
                    size="md"
                  />
                  <div>
                    <h1 className="text-3xl font-bold">
                      {displayName}
                      {isLinkedToUser && (
                        <Badge variant="default" className="ml-3">
                          <User className="h-3 w-3 mr-1" />
                          This is me
                        </Badge>
                      )}
                    </h1>
                    <div className="flex items-center space-x-4 mt-1">
                      {years && (
                        <Badge variant="outline" className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{years}</span>
                        </Badge>
                      )}
                      {person.gender && (
                        <Badge variant="secondary">
                          {person.gender.charAt(0).toUpperCase() + person.gender.slice(1)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button 
                  onClick={handleLinkToUser}
                  variant={isLinkedToUser ? "outline" : "default"}
                >
                  <User className="h-4 w-4 mr-2" />
                  {isLinkedToUser ? "Unlink My Profile" : "Link My Profile"}
                </Button>

                <Dialog open={isLinkStoryOpen} onOpenChange={setIsLinkStoryOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Link Story
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Link Story to {displayName}</DialogTitle>
                      <DialogDescription>
                        Choose a family story to associate with this person.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select value={selectedStoryId} onValueChange={setSelectedStoryId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a story" />
                        </SelectTrigger>
                        <SelectContent>
                          {allStories.map((story) => (
                            <SelectItem key={story.id} value={story.id}>
                              {story.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex space-x-2">
                        <Button onClick={handleLinkStory} disabled={!selectedStoryId}>
                          Link Story
                        </Button>
                        <Button variant="outline" onClick={() => setIsLinkStoryOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Link to={`/people/${person.id}/timeline`}>
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Timeline
                  </Button>
                </Link>

                <Button onClick={handlePhotoUpload}>
                  <Camera className="h-4 w-4 mr-2" />
                  Add Photos
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="stories">Stories ({stories.length})</TabsTrigger>
                <TabsTrigger value="memories">Memories ({answers.length})</TabsTrigger>
                <TabsTrigger value="photos">Photos ({photos.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Personal Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Personal Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Full Name</h4>
                        <p className="font-medium">{person.full_name}</p>
                      </div>
                      {person.given_name && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Given Name</h4>
                          <p>{person.given_name}</p>
                        </div>
                      )}
                      {person.surname && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Surname</h4>
                          <p>{person.surname}</p>
                        </div>
                      )}
                      {person.birth_year && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Birth Year</h4>
                          <p>{person.birth_year}</p>
                        </div>
                      )}
                      {person.notes && (
                        <div className="md:col-span-2">
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Notes</h4>
                          <p className="text-sm">{person.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Family Relationships */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Heart className="h-5 w-5" />
                      <span>Family Relationships</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {parents.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Parents</h4>
                          <div className="flex flex-wrap gap-2">
                            {parents.map((rel) => (
                              <Link key={rel.id} to={`/people/${rel.from_person_id}`}>
                                <Badge variant="outline" className="hover:bg-muted">
                                  {getPersonDisplayName(rel.from_people)}
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {spouses.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Spouse(s)</h4>
                          <div className="flex flex-wrap gap-2">
                            {spouses.map((rel) => {
                              const spouse = rel.from_person_id === person.id ? rel.to_people : rel.from_people
                              return (
                                <Link key={rel.id} to={`/people/${spouse.id}`}>
                                  <Badge variant="secondary" className="hover:bg-secondary/80">
                                    <Heart className="h-3 w-3 mr-1" />
                                    {getPersonDisplayName(spouse)}
                                  </Badge>
                                </Link>
                              )
                            })}
                          </div>
                        </div>
                      )}
                      
                      {children.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Children</h4>
                          <div className="flex flex-wrap gap-2">
                            {children.map((rel) => (
                              <Link key={rel.id} to={`/people/${rel.to_person_id}`}>
                                <Badge variant="outline" className="hover:bg-muted">
                                  {getPersonDisplayName(rel.to_people)}
                                </Badge>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {parents.length === 0 && children.length === 0 && spouses.length === 0 && (
                        <p className="text-muted-foreground text-sm">No family relationships recorded yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stories" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Stories</h3>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => navigate(`/stories/new?person=${person.id}`)}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Story
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsLinkStoryOpen(true)}
                      size="sm"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Link Existing
                    </Button>
                  </div>
                </div>
                
                {stories.length > 0 ? (
                  stories.map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Stories Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Share a memory, experience, or story about {displayName}.
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button 
                          onClick={() => navigate(`/stories/new?person=${person.id}`)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Story
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsLinkStoryOpen(true)}
                        >
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Link Existing
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="memories" className="space-y-6">
                {answers.length > 0 ? (
                  answers.map((answer) => (
                    <AnswerCard key={answer.id} answer={answer} />
                  ))
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Memories Yet</h3>
                      <p className="text-muted-foreground">
                        No question answers have been linked to {displayName} yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="photos" className="space-y-6">
                {photos.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {photos.map((photo) => (
                      <Card key={photo.id}>
                        <CardContent className="p-4">
                          <img 
                            src={`${supabase.storage.from('media').getPublicUrl(photo.file_path).data.publicUrl}`}
                            alt={photo.file_name}
                            className="w-full aspect-square object-cover rounded-lg mb-2"
                          />
                          <p className="text-sm font-medium truncate">{photo.file_name}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Photos Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        No photos have been added to {displayName}'s profile yet.
                      </p>
                      <Button onClick={handlePhotoUpload}>
                        <Camera className="h-4 w-4 mr-2" />
                        Add Photos
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AuthGate>
  )
}