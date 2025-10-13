import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { uploadMediaFile } from '@/lib/media'
import { useComposerState, ComposerMode } from '@/hooks/useComposerState'
import { PromptBanner } from './PromptBanner'
import { ComposerFooter } from './ComposerFooter'
import { ContextPanel } from './ContextPanel'
import { TextPanel } from './TextPanel'
import { PhotoPanel } from './PhotoPanel'
import { VoicePanel } from './VoicePanel'

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

  const { state, updateState, switchMode, clearState, hasContent } = useComposerState(
    (searchParams.get('type') as ComposerMode) || 'text'
  )

  // Load current user
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)
    }
    loadUser()
  }, [])

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

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const occurredDate = state.dateValue.date
        ? state.dateValue.date.toISOString().split('T')[0]
        : null

      // Create story
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          family_id: familyId,
          profile_id: user.id,
          title: state.title.trim(),
          content: state.content.trim() || state.transcript.trim() || null,
          occurred_on: occurredDate,
          is_approx: state.dateValue.yearOnly,
          status: asDraft ? 'draft' : 'published'
        })
        .select()
        .single()

      if (storyError) throw storyError

      // Handle photos
      if (state.photos.length > 0) {
        for (const file of state.photos) {
          const { path, error: uploadError } = await uploadMediaFile(file, familyId, user.id)
          if (!uploadError && path) {
            await supabase.from('media').insert({
              story_id: story.id,
              profile_id: user.id,
              family_id: familyId,
              file_path: path,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type
            })
          }
        }
      }

      // Handle audio
      if (state.audioBlob && state.audioUrl) {
        const audioFile = new File([state.audioBlob], 'recording.webm', { type: 'audio/webm' })
        const { path, error: uploadError } = await uploadMediaFile(audioFile, familyId, user.id)
        
        if (!uploadError && path) {
          await supabase.from('audio_recordings').insert({
            story_id: story.id,
            family_id: familyId,
            created_by: user.id,
            audio_url: path,
            transcript: state.transcript || null,
            duration_seconds: 0,
            status: 'completed'
          })
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
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Video stories coming soon!</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="mixed" className="mt-0">
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">Mixed media stories coming soon!</p>
                    </div>
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
                    peopleTags={state.peopleTags}
                    currentUserId={currentUserId}
                    onDateChange={(value) => updateState({ dateValue: value })}
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
