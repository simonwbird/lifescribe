import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { uploadMediaFile } from '@/lib/media'
import { useComposerState, ComposerMode, StoryPrivacy } from '@/hooks/useComposerState'
import { PromptBanner } from './PromptBanner'
import { ComposerFooter } from './ComposerFooter'
import { ContextPanel } from './ContextPanel'
import { TextPanel } from './TextPanel'
import { PhotoPanel } from './PhotoPanel'
import { VoicePanel } from './VoicePanel'
import { VideoPanel } from './VideoPanel'
import { MixedPanel } from './MixedPanel'

interface UniversalComposerProps {
  familyId: string
}

export function UniversalComposer({ familyId }: UniversalComposerProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [promptTitle, setPromptTitle] = useState<string | null>(null)
  const [showPromptBanner, setShowPromptBanner] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const [defaultPrivacy, setDefaultPrivacy] = useState<StoryPrivacy>('private')

  const { state, updateState, switchMode, clearState, hasContent } = useComposerState(
    (searchParams.get('type') as ComposerMode) || 'text'
  )

  // Load current user and family default privacy
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    }
    
    async function loadFamilyDefaults() {
      try {
        const { data, error } = await supabase
          .from('families')
          .select('default_privacy')
          .eq('id', familyId)
          .maybeSingle()
        
        if (!error && data?.default_privacy) {
          setDefaultPrivacy(data.default_privacy as StoryPrivacy)
          updateState({ privacy: data.default_privacy as StoryPrivacy })
        }
      } catch (e) {
        console.error('Failed to load family defaults:', e)
      }
    }
    
    loadUser()
    loadFamilyDefaults()
  }, [familyId])

  // Load prompt if prompt_id in URL
  useEffect(() => {
    const promptId = searchParams.get('prompt_id')
    if (promptId && promptId !== state.promptId) {
      updateState({ promptId })
      loadPrompt(promptId)
    }
  }, [searchParams])

  async function loadPrompt(promptId: string) {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('title')
        .eq('id', promptId)
        .single()

      if (!error && data) {
        setPromptTitle(data.title)
        setShowPromptBanner(true)
      }
    } catch (e) {
      console.error('Failed to load prompt:', e)
    }
  }

  async function handlePublish(asDraft = false) {
    if (!state.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please provide a title for your story.',
        variant: 'destructive'
      })
      return
    }

    if (state.mode === 'text' && !state.content.trim()) {
      toast({
        title: 'Content required',
        description: 'Please write your story.',
        variant: 'destructive'
      })
      return
    }

    if (state.mode === 'photo' && state.photos.length === 0 && !asDraft) {
      toast({
        title: 'Photos required',
        description: 'Please add at least one photo.',
        variant: 'destructive'
      })
      return
    }

    if (state.mode === 'voice' && !state.audioBlob && !asDraft) {
      toast({
        title: 'Recording required',
        description: 'Please record your voice.',
        variant: 'destructive'
      })
      return
    }

    if (state.mode === 'video' && !state.videoBlob && !asDraft) {
      toast({
        title: 'Video required',
        description: 'Please record or upload a video.',
        variant: 'destructive'
      })
      return
    }

    if (state.mode === 'mixed' && state.contentBlocks.length === 0 && !asDraft) {
      toast({
        title: 'Content required',
        description: 'Please add at least one content block.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const occurredDate = state.dateValue.date
        ? state.dateValue.date.toISOString().split('T')[0]
        : null

      // Determine occurred_precision based on dateValue
      let occurredPrecision: 'day' | 'month' | 'year' = 'day'
      if (state.dateValue.yearOnly) {
        occurredPrecision = 'year'
      } else if (state.dateValue.precision === 'month') {
        occurredPrecision = 'month'
      }

      // Create story with content_type
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          family_id: familyId,
          profile_id: user.id,
          title: state.title.trim(),
          content: state.content.trim() || state.transcript.trim() || null,
          content_type: state.mode,
          occurred_on: occurredDate,
          occurred_precision: occurredPrecision,
          is_approx: state.dateValue.precision === 'circa',
          place_text: state.placeText.trim() || null,
          privacy: state.privacy,
          prompt_id: state.promptId || null,
          status: asDraft ? 'draft' : 'published'
        } as any)
        .select()
        .single()

      if (storyError) throw storyError

      // Handle photos - save to both media and story_assets tables
      if (state.photos.length > 0) {
        for (let i = 0; i < state.photos.length; i++) {
          const file = state.photos[i]
          const { path, error: uploadError } = await uploadMediaFile(file, familyId, user.id)
          if (!uploadError && path) {
            // Create media record (legacy)
            await supabase.from('media').insert({
              story_id: story.id,
              profile_id: user.id,
              family_id: familyId,
              file_path: path,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type
            })

            // Create story_asset record
            const fullUrl = `${supabase.storage.from('media').getPublicUrl(path).data.publicUrl}`
            await supabase.from('story_assets').insert({
              story_id: story.id,
              type: 'image',
              url: fullUrl,
              position: i,
              metadata: {
                file_name: file.name,
                file_size: file.size,
                mime_type: file.type
              }
            })
          }
        }
      }

      // Handle audio - save to both audio_recordings and story_assets
      if (state.audioBlob && state.audioUrl) {
        const audioFile = new File([state.audioBlob], 'recording.webm', { type: 'audio/webm' })
        const { path, error: uploadError } = await uploadMediaFile(audioFile, familyId, user.id)
        
        if (!uploadError && path) {
          // Create audio_recordings record (legacy)
          await supabase.from('audio_recordings').insert({
            story_id: story.id,
            family_id: familyId,
            created_by: user.id,
            audio_url: path,
            transcript: state.transcript || null,
            duration_seconds: 0,
            status: 'completed'
          })

          // Create story_asset record
          const fullUrl = `${supabase.storage.from('media').getPublicUrl(path).data.publicUrl}`
          await supabase.from('story_assets').insert({
            story_id: story.id,
            type: 'audio',
            url: fullUrl,
            position: 0,
            metadata: {
              transcript: state.transcript || null,
              mime_type: 'audio/webm'
            }
          })
        }
      }

      // Handle video - save video and thumbnail to story_assets
      if (state.videoBlob && state.videoUrl && state.videoThumbnail) {
        const videoFile = new File([state.videoBlob], 'video.webm', { type: 'video/webm' })
        const { path, error: uploadError } = await uploadMediaFile(videoFile, familyId, user.id)
        
        if (!uploadError && path) {
          // Upload thumbnail
          const thumbnailResponse = await fetch(state.videoThumbnail)
          const thumbnailBlob = await thumbnailResponse.blob()
          const thumbnailFile = new File([thumbnailBlob], 'thumbnail.jpg', { type: 'image/jpeg' })
          const { path: thumbPath } = await uploadMediaFile(thumbnailFile, familyId, user.id)
          
          const fullUrl = `${supabase.storage.from('media').getPublicUrl(path).data.publicUrl}`
          const thumbUrl = thumbPath ? `${supabase.storage.from('media').getPublicUrl(thumbPath).data.publicUrl}` : null
          
          // Create story_asset record
          await supabase.from('story_assets').insert({
            story_id: story.id,
            type: 'video',
            url: fullUrl,
            thumbnail_url: thumbUrl,
            position: 0,
            metadata: {
              mime_type: 'video/webm'
            }
          })
        }
      }

      // Handle mixed mode blocks
      if (state.mode === 'mixed' && state.contentBlocks.length > 0) {
        for (let i = 0; i < state.contentBlocks.length; i++) {
          const block = state.contentBlocks[i]
          
          if (block.type === 'text') {
            // Store text blocks in story metadata
            await supabase.from('story_assets').insert({
              story_id: story.id,
              type: 'text',
              url: '',
              position: i,
              metadata: {
                content: block.content
              }
            })
          } else if (block.type === 'image') {
            const { path, error: uploadError } = await uploadMediaFile(block.file, familyId, user.id)
            if (!uploadError && path) {
              const fullUrl = `${supabase.storage.from('media').getPublicUrl(path).data.publicUrl}`
              await supabase.from('story_assets').insert({
                story_id: story.id,
                type: 'image',
                url: fullUrl,
                position: i,
                metadata: {
                  file_name: block.file.name,
                  file_size: block.file.size,
                  mime_type: block.file.type
                }
              })
            }
          } else if (block.type === 'video') {
            const videoFile = new File([block.blob], 'video.webm', { type: 'video/webm' })
            const { path, error: uploadError } = await uploadMediaFile(videoFile, familyId, user.id)
            
            if (!uploadError && path) {
              const fullUrl = `${supabase.storage.from('media').getPublicUrl(path).data.publicUrl}`
              let thumbUrl = null
              
              if (block.thumbnail) {
                const thumbnailResponse = await fetch(block.thumbnail)
                const thumbnailBlob = await thumbnailResponse.blob()
                const thumbnailFile = new File([thumbnailBlob], 'thumbnail.jpg', { type: 'image/jpeg' })
                const { path: thumbPath } = await uploadMediaFile(thumbnailFile, familyId, user.id)
                if (thumbPath) {
                  thumbUrl = `${supabase.storage.from('media').getPublicUrl(thumbPath).data.publicUrl}`
                }
              }
              
              await supabase.from('story_assets').insert({
                story_id: story.id,
                type: 'video',
                url: fullUrl,
                thumbnail_url: thumbUrl,
                position: i,
                metadata: {
                  mime_type: 'video/webm'
                }
              })
            }
          } else if (block.type === 'audio') {
            const audioFile = new File([block.blob], 'audio.webm', { type: 'audio/webm' })
            const { path, error: uploadError } = await uploadMediaFile(audioFile, familyId, user.id)
            
            if (!uploadError && path) {
              const fullUrl = `${supabase.storage.from('media').getPublicUrl(path).data.publicUrl}`
              await supabase.from('story_assets').insert({
                story_id: story.id,
                type: 'audio',
                url: fullUrl,
                position: i,
                metadata: {
                  transcript: block.transcript || null,
                  mime_type: 'audio/webm'
                }
              })
            }
          } else if (block.type === 'divider') {
            await supabase.from('story_assets').insert({
              story_id: story.id,
              type: 'divider',
              url: '',
              position: i,
              metadata: {}
            })
          }
        }
      }

      // Create person-story links with roles
      if (state.peopleTags.length > 0) {
        const personLinks = state.peopleTags.map(tag => ({
          person_id: tag.personId,
          story_id: story.id,
          family_id: familyId,
          role: tag.role
        }))

        const { error: linksError } = await supabase
          .from('person_story_links')
          .insert(personLinks)

        if (linksError) {
          console.error('Failed to create person links:', linksError)
        }
      }

      // Mark prompt as completed if applicable
      if (state.promptId) {
        await supabase
          .from('prompt_instances')
          .update({ status: 'completed' })
          .eq('prompt_id', state.promptId)
          .eq('family_id', familyId)
      }

      toast({
        title: asDraft ? 'Draft saved!' : 'Story published!',
        description: asDraft
          ? 'Your draft has been saved.'
          : 'Your story has been published successfully.'
      })

      clearState()
      navigate('/feed')
    } catch (error: any) {
      console.error('Error creating story:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create story. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleCancel() {
    if (hasContent()) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        clearState()
        navigate(-1)
      }
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {showPromptBanner && promptTitle && (
          <PromptBanner
            promptTitle={promptTitle}
            onDismiss={() => setShowPromptBanner(false)}
          />
        )}

        <h1 className="text-3xl font-bold mb-6">Create New Story</h1>

        <Tabs
          value={state.mode}
          onValueChange={(value) => switchMode(value as ComposerMode)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="photo">Photo</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="mixed">Mixed</TabsTrigger>
          </TabsList>

          <div className="grid lg:grid-cols-[1fr_400px] gap-6">
            {/* Left: Content Panel */}
            <div>
              <Card>
                <CardContent className="pt-6">
                  <TabsContent value="text" className="mt-0">
                    <TextPanel
                      title={state.title}
                      content={state.content}
                      onTitleChange={(value) => updateState({ title: value })}
                      onContentChange={(value) => updateState({ content: value })}
                    />
                  </TabsContent>

                  <TabsContent value="photo" className="mt-0">
                    <PhotoPanel
                      title={state.title}
                      content={state.content}
                      photos={state.photos}
                      onTitleChange={(value) => updateState({ title: value })}
                      onContentChange={(value) => updateState({ content: value })}
                      onPhotosChange={(files) => updateState({ photos: files })}
                      onDateChange={(date) => updateState({ dateValue: { date, precision: 'exact', yearOnly: false } })}
                      familyId={familyId}
                    />
                  </TabsContent>

                  <TabsContent value="voice" className="mt-0">
                    <VoicePanel
                      title={state.title}
                      content={state.content}
                      audioBlob={state.audioBlob}
                      audioUrl={state.audioUrl}
                      onTitleChange={(value) => updateState({ title: value })}
                      onContentChange={(value) => updateState({ content: value })}
                      onRecordingReady={(blob, url, transcript) =>
                        updateState({
                          audioBlob: blob,
                          audioUrl: url,
                          transcript: transcript || '',
                          content: transcript || state.content
                        })
                      }
                    />
                  </TabsContent>

                  <TabsContent value="video" className="mt-0">
                    <VideoPanel
                      title={state.title}
                      content={state.content}
                      videoBlob={state.videoBlob}
                      videoUrl={state.videoUrl}
                      thumbnailUrl={state.videoThumbnail}
                      onTitleChange={(value) => updateState({ title: value })}
                      onContentChange={(value) => updateState({ content: value })}
                      onVideoReady={(blob, url, thumbnail) =>
                        updateState({
                          videoBlob: blob,
                          videoUrl: url,
                          videoThumbnail: thumbnail
                        })
                      }
                    />
                  </TabsContent>

                  <TabsContent value="mixed" className="mt-0">
                    <MixedPanel
                      title={state.title}
                      blocks={state.contentBlocks}
                      onTitleChange={(value) => updateState({ title: value })}
                      onBlocksChange={(blocks) => updateState({ contentBlocks: blocks })}
                      familyId={familyId}
                    />
                  </TabsContent>
                </CardContent>
              </Card>
            </div>

            {/* Right: Context & Tags Panel */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <Card>
                <CardContent className="pt-6">
                  <ContextPanel
                    familyId={familyId}
                    dateValue={state.dateValue}
                    placeText={state.placeText}
                    privacy={state.privacy}
                    peopleTags={state.peopleTags}
                    currentUserId={currentUserId}
                    onDateChange={(value) => updateState({ dateValue: value })}
                    onPlaceChange={(place) => updateState({ placeText: place })}
                    onPrivacyChange={(privacy) => updateState({ privacy })}
                    onPeopleTagsChange={(tags) => updateState({ peopleTags: tags })}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </div>

      <ComposerFooter
        isSubmitting={isSubmitting}
        hasContent={hasContent()}
        onSaveDraft={() => handlePublish(true)}
        onPublish={() => handlePublish(false)}
        onCancel={handleCancel}
      />
    </div>
  )
}
