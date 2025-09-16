import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import ReactionBar from './ReactionBar'
import CommentThread from './CommentThread'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Users, MessageSquare, Mic2 } from 'lucide-react'
import type { Story, Profile, Media } from '@/lib/types'

interface ExtendedStory extends Story {
  occurred_on?: string
  occurred_precision?: string
  is_approx?: boolean
  happened_at_property_id?: string
  prompt_id?: string
  prompt_text?: string
}

interface ExtendedMedia extends Media {
  transcript_text?: string
}

interface StoryCardProps {
  story: ExtendedStory & { profiles: Profile }
}

export default function StoryCard({ story }: StoryCardProps) {
  const [media, setMedia] = useState<ExtendedMedia[]>([])
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [linkedPeople, setLinkedPeople] = useState<any[]>([])
  const [property, setProperty] = useState<any>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [transcriptFallback, setTranscriptFallback] = useState<boolean>(false)

  useEffect(() => {
    const loadStoryData = async () => {
      // Load media
      const { data: mediaData } = await supabase
        .from('media')
        .select('*')
        .eq('story_id', story.id)
        .order('created_at')

      if (mediaData) {
        setMedia(mediaData)
        
        // Get signed URLs for media
        const urls = await Promise.all(
          mediaData.map(async (item) => {
            const { data: { signedUrl } } = await supabase.storage
              .from('media')
              .createSignedUrl(item.file_path, 3600)
            return signedUrl || ''
          })
        )
        setMediaUrls(urls.filter(Boolean))

        // Check for transcript in voice recordings (fallback to story content if missing)
        const voiceMedia = mediaData.find(item => item.mime_type?.startsWith('audio/')) as ExtendedMedia | undefined
        if (voiceMedia) {
          if ((voiceMedia as any).transcript_text) {
            setTranscript((voiceMedia as any).transcript_text as string)
            setTranscriptFallback(false)
          } else if (story.content) {
            setTranscript(story.content)
            setTranscriptFallback(true)
          }
        }
      }

      // Load linked people
      const { data: peopleLinks } = await supabase
        .from('person_story_links')
        .select(`
          people:person_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('story_id', story.id)

      if (peopleLinks) {
        setLinkedPeople(peopleLinks.map(link => link.people).filter(Boolean))
      }

      // Load property if story happened at a property
      if (story.happened_at_property_id) {
        const { data: propertyData } = await supabase
          .from('properties')
          .select('name, address')
          .eq('id', story.happened_at_property_id)
          .single()

        if (propertyData) {
          setProperty(propertyData)
        }
      }
    }

    loadStoryData()
  }, [story.id, story.happened_at_property_id])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={story.profiles.avatar_url || ''} />
            <AvatarFallback>
              {story.profiles.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">
              <Link to={`/stories/${story.id}`} className="hover:underline">
                {story.title}
              </Link>
            </CardTitle>
            <CardDescription>
              by {story.profiles.full_name || 'User'} • {' '}
              {new Date(story.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Story metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {story.occurred_on && (
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>
                {story.occurred_precision === 'year' ? new Date(story.occurred_on).getFullYear() : 
                 story.occurred_precision === 'month' ? new Date(story.occurred_on).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) :
                 new Date(story.occurred_on).toLocaleDateString()}
                {story.is_approx && ' (approximate)'}
                {story.occurred_precision && ` • ${story.occurred_precision} precision`}
              </span>
            </div>
          )}
          
          {linkedPeople.length > 0 && (
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{linkedPeople.map(p => p.full_name).join(', ')}</span>
            </div>
          )}
          
          {property && (
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>{property.name}</span>
            </div>
          )}
          
          {story.prompt_text && (
            <div className="flex items-center gap-1">
              <MessageSquare size={14} />
              <span className="italic">"{story.prompt_text}"</span>
            </div>
          )}
        </div>

        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap">{story.content}</p>
        </div>

        {transcript && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Mic2 size={14} />
              <span>Original Transcript</span>
            </div>
            <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">
              "{transcript}"
            </p>
            {transcriptFallback && (
              <p className="text-xs text-muted-foreground">Auto-filled from story content</p>
            )}
          </div>
        )}

        {mediaUrls.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {mediaUrls.map((url, index) => {
              const mediaItem = media[index]
              if (mediaItem?.mime_type.startsWith('image/')) {
                return (
                  <img
                    key={index}
                    src={url}
                    alt={mediaItem.file_name}
                    className="rounded-lg max-h-64 object-cover w-full"
                  />
                )
              } else if (mediaItem?.mime_type.startsWith('video/')) {
                return (
                  <video
                    key={index}
                    src={url}
                    controls
                    className="rounded-lg max-h-64 w-full"
                  />
                )
              } else if (mediaItem?.mime_type.startsWith('audio/')) {
                return (
                  <div key={index} className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">
                        {mediaItem.file_name || 'Audio Recording'}
                      </p>
                      <audio
                        src={url}
                        controls
                        className="w-full"
                        preload="metadata"
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                )
              }
              return null
            })}
          </div>
        )}

        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {story.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <ReactionBar 
          targetType="story" 
          targetId={story.id}
          familyId={story.family_id}
        />
        
        <CommentThread 
          targetType="story" 
          targetId={story.id}
          familyId={story.family_id}
        />
      </CardContent>
    </Card>
  )
}