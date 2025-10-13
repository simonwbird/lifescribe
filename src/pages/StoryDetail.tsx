import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Link as LinkIcon, Calendar, MapPin, Lock, Globe, Share2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Story, Profile } from '@/lib/types'
import { AttachToEntityModal } from '@/components/entity/AttachToEntityModal'
import { StoryComments } from '@/components/story/StoryComments'
import { StoryAssetRenderer } from '@/components/story-view/StoryAssetRenderer'
import { PersonChips } from '@/components/story-view/PersonChips'
import { formatForUser } from '@/utils/date'
import ReactionBar from '@/components/ReactionBar'
import { StoryPageSEO } from '@/components/seo/StoryPageSEO'

export default function StoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [story, setStory] = useState<(Story & { profiles: Profile }) | null>(null)
  const [assets, setAssets] = useState<any[]>([])
  const [peopleTags, setPeopleTags] = useState<any[]>([])
  const [prompt, setPrompt] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [attachModalOpen, setAttachModalOpen] = useState(false)
  const [processingState, setProcessingState] = useState<string>('ready')
  const [familyName, setFamilyName] = useState<string>('')

  // Compute OG image from story assets
  const ogImage = useMemo(() => {
    if (!assets.length) return null
    
    // Use thumbnail_url if it's a video, otherwise use the first image
    const firstVisualAsset = assets.find(a => a.type === 'video' || a.type === 'image')
    if (!firstVisualAsset) return null
    
    if (firstVisualAsset.type === 'video' && firstVisualAsset.thumbnail_url) {
      return firstVisualAsset.thumbnail_url
    }
    
    if (firstVisualAsset.type === 'image' && firstVisualAsset.url) {
      return firstVisualAsset.url
    }
    
    return null
  }, [assets])

  useEffect(() => {
    const getStory = async () => {
      if (!id) return

      try {
        const { data } = await supabase
          .from('stories')
          .select(`
            *,
            profiles (*)
          `)
          .eq('id', id)
          .single()

        if (data) {
          setStory(data)
          setProcessingState((data as any).processing_state || 'ready')

          // Load family name for SEO
          if ((data as any).family_id) {
            const { data: familyData } = await supabase
              .from('families')
              .select('name')
              .eq('id', (data as any).family_id)
              .single()
            
            if (familyData) {
              setFamilyName(familyData.name || '')
            }
          }

          // Load story assets
          const { data: assetsData } = await supabase
            .from('story_assets' as any)
            .select('*')
            .eq('story_id', id)
            .order('position', { ascending: true })

          if (assetsData) {
            setAssets(assetsData)
          }

          // Load people tags
          const { data: tagsData } = await supabase
            .from('person_story_links')
            .select(`
              person_id,
              role,
              people (
                id,
                given_name,
                surname
              )
            `)
            .eq('story_id', id)

          if (tagsData) {
            setPeopleTags(tagsData)
          }

          // Load prompt if exists
          if ((data as any).prompt_id) {
            const { data: promptData } = await supabase
              .from('prompts')
              .select('*')
              .eq('id', (data as any).prompt_id)
              .single()

            if (promptData) {
              setPrompt(promptData)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching story:', error)
      } finally {
        setLoading(false)
      }
    }

    getStory()

    // Poll for processing updates if story is processing
    const pollInterval = setInterval(async () => {
      if (!id || processingState === 'ready') return

      const { data } = await supabase
        .from('stories')
        .select('processing_state')
        .eq('id', id)
        .single()

      if (data) {
        const newState = (data as any).processing_state || 'ready'
        setProcessingState(newState)
        if (newState === 'ready') {
          // Reload full story when processing completes
          getStory()
        }
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(pollInterval)
  }, [id, processingState])

  const handlePersonClick = (personId: string, personName: string) => {
    setSearchParams({ person: personId, personName })
    navigate(`/feed?person=${personId}&personName=${encodeURIComponent(personName)}`)
  }

  const getPrivacyIcon = (privacy?: string) => {
    switch (privacy) {
      case 'public':
        return <Globe className="h-4 w-4" />
      case 'link_only':
        return <Share2 className="h-4 w-4" />
      default:
        return <Lock className="h-4 w-4" />
    }
  }

  const getPrivacyLabel = (privacy?: string) => {
    switch (privacy) {
      case 'public':
        return 'Public'
      case 'link_only':
        return 'Link-only'
      default:
        return 'Family only'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Story Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The story you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button asChild>
              <Link to="/feed">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Feed
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setAttachModalOpen(true)}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Add to Person
            </Button>
          </div>
          
          {processingState === 'processing' && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Processing media... Your story is being optimized and will be ready soon.
                </p>
              </div>
            </div>
          )}

          {processingState === 'failed' && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                Media processing failed. Some content may not display correctly.
              </p>
            </div>
          )}

          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            {/* Main Content */}
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={story.profiles.avatar_url || undefined} />
                      <AvatarFallback>
                        {story.profiles.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{story.profiles.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(story.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Title */}
                  <h1 className="text-2xl md:text-3xl font-bold">{story.title}</h1>

                  {/* Content/Body Text */}
                  {story.content && (
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap text-base leading-relaxed">{story.content}</p>
                    </div>
                  )}

                  {/* Story Assets */}
                  {assets.length > 0 && (
                    <div className="space-y-4">
                      {assets.map((asset) => (
                        <StoryAssetRenderer key={asset.id} asset={asset} />
                      ))}
                    </div>
                  )}

                  {/* Reactions */}
                  <ReactionBar 
                    targetType="story" 
                    targetId={story.id}
                    familyId={story.family_id}
                  />
                </CardContent>
              </Card>

              {/* Comments */}
              <StoryComments 
                storyId={story.id}
                familyId={story.family_id}
              />
            </div>

            {/* Right Rail - Metadata */}
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {/* People */}
                  {peopleTags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">People</h3>
                      <PersonChips 
                        tags={peopleTags}
                        onPersonClick={handlePersonClick}
                      />
                    </div>
                  )}

                  {/* Date */}
                  {(story as any).occurred_on && (
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date((story as any).occurred_on).toLocaleDateString()}
                          {(story as any).is_approx && ' (approx)'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Place */}
                  {(story as any).place_text && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Place</p>
                        <p className="text-sm text-muted-foreground">
                          {(story as any).place_text}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Privacy */}
                  <div className="flex items-start gap-2">
                    {getPrivacyIcon((story as any).privacy)}
                    <div>
                      <p className="text-sm font-medium">Privacy</p>
                      <p className="text-sm text-muted-foreground">
                        {getPrivacyLabel((story as any).privacy)}
                      </p>
                    </div>
                  </div>

                  {/* Prompt */}
                  {prompt && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Responding to prompt
                      </p>
                      <p className="text-sm italic">"{prompt.title}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {story && (
        <AttachToEntityModal
          open={attachModalOpen}
          onOpenChange={setAttachModalOpen}
          contentType="story"
          contentId={story.id}
          familyId={story.family_id}
        />
      )}
    </div>
  )
}