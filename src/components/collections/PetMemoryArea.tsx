import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  MapPin, 
  Users, 
  FileText, 
  Camera, 
  Heart,
  Plus,
  Clock
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import type { PetContent } from '@/lib/collectionsTypes'

interface PetMemory {
  id: string
  type: 'story' | 'photo'
  title: string
  content?: string
  occurredAt?: string | null
  createdAt: string
  authorName: string
  peopleCount: number
  mediaCount?: number
}

interface PetMemoryAreaProps {
  pets: PetContent[]
  familyId: string
}

export default function PetMemoryArea({ pets, familyId }: PetMemoryAreaProps) {
  const [memories, setMemories] = useState<PetMemory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPetMemories()
  }, [pets, familyId])

  const loadPetMemories = async () => {
    if (!familyId || pets.length === 0) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Get pet names for searching stories
      const petNames = pets.map(pet => pet.title.toLowerCase())
      
      // Search for stories that mention pets by name
      const searchPattern = petNames.join('|')
      
      const { data: stories } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          content,
          occurred_on,
          created_at,
          profiles:profile_id (full_name),
          person_story_links (person_id),
          media (id)
        `)
        .eq('family_id', familyId)
        .or(`title.ilike.%${petNames[0]}%,content.ilike.%${petNames[0]}%${petNames.length > 1 ? ',' + petNames.slice(1).map(name => `title.ilike.%${name}%,content.ilike.%${name}%`).join(',') : ''}`)
        .order('occurred_on', { ascending: false, nullsFirst: false })
        .limit(20)

      // Also get photos from media table that might be pet-related
      const { data: photos } = await supabase
        .from('media')
        .select(`
          id,
          file_name,
          created_at,
          profiles:profile_id (full_name)
        `)
        .eq('family_id', familyId)
        .like('file_name', '%pet%')
        .order('created_at', { ascending: false })
        .limit(10)

      const petMemories: PetMemory[] = []

      // Add stories
      if (stories) {
        petMemories.push(...stories.map(story => ({
          id: story.id,
          type: 'story' as const,
          title: story.title,
          content: story.content?.slice(0, 150) + (story.content?.length > 150 ? '...' : ''),
          occurredAt: story.occurred_on,
          createdAt: story.created_at,
          authorName: (story.profiles as any)?.full_name || 'Unknown',
          peopleCount: story.person_story_links?.length || 0,
          mediaCount: story.media?.length || 0
        })))
      }

      // Add photos
      if (photos) {
        petMemories.push(...photos.map(photo => ({
          id: photo.id,
          type: 'photo' as const,
          title: photo.file_name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
          occurredAt: null,
          createdAt: photo.created_at,
          authorName: (photo.profiles as any)?.full_name || 'Unknown',
          peopleCount: 0
        })))
      }

      // Sort by creation date
      petMemories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setMemories(petMemories)
    } catch (error) {
      console.error('Error loading pet memories:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString()
    } catch {
      return dateStr
    }
  }

  if (pets.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5 text-pink-600" />
          <div>
            <h2 className="text-lg font-semibold">Pet Memories & Stories</h2>
            <p className="text-sm text-muted-foreground">
              Stories and photos featuring your beloved pets
            </p>
          </div>
        </div>
        <Button size="sm" asChild>
          <Link to="/stories/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Memory
          </Link>
        </Button>
      </div>

      <Separator />

      {/* Pet Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pets.slice(0, 6).map((pet) => (
          <Card key={pet.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center">
                  {pet.coverUrl ? (
                    <img 
                      src={pet.coverUrl} 
                      alt={pet.title}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <Heart className="h-6 w-6 text-pink-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{pet.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {pet.fields.species} • {pet.fields.status}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Memories Timeline */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Recent Memories</h3>
          {memories.length > 0 && (
            <Badge variant="secondary">{memories.length}</Badge>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 bg-muted rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : memories.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No pet memories yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start documenting stories and memories about your pets
              </p>
              <Button asChild>
                <Link to="/stories/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Share Your First Pet Story
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {memories.map((memory) => (
              <Card key={memory.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center">
                        {memory.type === 'story' ? (
                          <FileText className="h-6 w-6 text-accent-foreground" />
                        ) : (
                          <Camera className="h-6 w-6 text-accent-foreground" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <Link 
                          to={memory.type === 'story' ? `/stories/${memory.id}` : '#'}
                          className="font-medium hover:underline line-clamp-1"
                        >
                          {memory.title}
                        </Link>
                        <Badge variant="outline" className="flex-shrink-0">
                          {memory.type}
                        </Badge>
                      </div>
                      
                      {memory.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {memory.content}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>by {memory.authorName}</span>
                        
                        {memory.occurredAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(memory.occurredAt)}</span>
                          </div>
                        )}
                        
                        {memory.peopleCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{memory.peopleCount} people</span>
                          </div>
                        )}
                        
                        {memory.mediaCount && memory.mediaCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            <span>{memory.mediaCount} photos</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {memories.length >= 20 && (
              <div className="text-center pt-4">
                <Button variant="outline">
                  Load More Memories
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}