import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { DatePrecisionPicker, DatePrecisionValue } from '@/components/DatePrecisionPicker'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { uploadMediaFile } from '@/lib/media'
import VoiceRecorderPanel from './VoiceRecorderPanel'

interface VoiceStoryFormProps {
  familyId: string
}

export default function VoiceStoryForm({ familyId }: VoiceStoryFormProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autoSaved, setAutoSaved] = useState(false)
  const [searchParams] = useSearchParams()
  const [initialAudio, setInitialAudio] = useState<{ blob: Blob; duration: number } | null>(null)
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [dateValue, setDateValue] = useState<DatePrecisionValue>({ date: new Date(), precision: 'exact', yearOnly: false })
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [duration, setDuration] = useState(0)
  const [draftId, setDraftId] = useState<string | null>(null)

  // Check for pending recording from prompt
  useEffect(() => {
    const promptTitle = searchParams.get('promptTitle')
    const hasRecording = searchParams.get('hasRecording')
    const transcript = searchParams.get('transcript')
    
    if (promptTitle) {
      setTitle(promptTitle)
    }

    // Pre-fill transcript from URL parameter
    if (transcript) {
      setContent(decodeURIComponent(transcript))
    }
    
    if (hasRecording === 'true') {
      const audioData = sessionStorage.getItem('pendingAudioRecording')
      const audioDuration = sessionStorage.getItem('pendingAudioDuration')
      const pendingTranscript = sessionStorage.getItem('pendingTranscript')
      
      if (audioData) {
        // Convert base64 back to blob
        fetch(audioData)
          .then(res => res.blob())
          .then(blob => {
            const duration = audioDuration ? parseFloat(audioDuration) : 0
            setInitialAudio({ blob, duration })
            setAudioBlob(blob)
            setDuration(duration)
            
            // Pre-fill transcript if available
            if (pendingTranscript && !transcript) {
              setContent(pendingTranscript)
            }
            
            // Clear from session storage
            sessionStorage.removeItem('pendingAudioRecording')
            sessionStorage.removeItem('pendingAudioDuration')
            sessionStorage.removeItem('pendingTranscript')
          })
          .catch(err => {
            console.error('Error loading recording:', err)
            toast({
              title: 'Could not load recording',
              description: 'Please record again.',
              variant: 'destructive'
            })
          })
      }
    }
  }, [searchParams])

  const handleTranscriptReady = async (transcript: string, blob: Blob, audioDuration: number) => {
    setAudioBlob(blob)
    setDuration(audioDuration)
    
    // Insert transcript into content field
    if (transcript) {
      setContent(transcript)
    }
    
    // Auto-save as draft
    if (transcript && !draftId) {
      await autoSaveDraft(transcript, blob)
    }
  }

  const autoSaveDraft = async (transcript: string, blob: Blob) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const draftTitle = title || `Voice recording ${new Date().toLocaleDateString()}`

      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          family_id: familyId,
          profile_id: user.id,
          title: draftTitle,
          content: transcript,
          status: 'draft'
        })
        .select()
        .single()

      if (storyError) throw storyError
      
      setDraftId(story.id)
      if (!title) {
        setTitle(draftTitle)
      }
      setAutoSaved(true)
      
      toast({
        title: 'Draft auto-saved',
        description: 'Your recording has been saved. Edit and publish when ready.',
      })
    } catch (error) {
      console.error('Auto-save error:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent, asDraft = false) {
    e.preventDefault()
    
    // Validation
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Required fields',
        description: 'Please fill in title and content.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const occurredDate = dateValue.date ? dateValue.date.toISOString().split('T')[0] : null
      
      let story
      
      // Update existing draft or create new
      if (draftId && !asDraft) {
        const { data, error: updateError } = await supabase
          .from('stories')
          .update({
            title: title.trim(),
            content: content.trim(),
            occurred_on: occurredDate,
            is_approx: dateValue.yearOnly,
            status: 'published'
          })
          .eq('id', draftId)
          .select()
          .single()
        
        if (updateError) throw updateError
        story = data
      } else {
        const { data, error: storyError } = await supabase
          .from('stories')
          .insert({
            family_id: familyId,
            profile_id: user.id,
            title: title.trim(),
            content: content.trim(),
            occurred_on: occurredDate,
            is_approx: dateValue.yearOnly,
            status: asDraft ? 'draft' : 'published'
          })
          .select()
          .single()

        if (storyError) throw storyError
        story = data
      }

      // Upload audio if present and not already uploaded
      if (audioBlob) {
        const { data: existingMedia } = await supabase
          .from('media')
          .select('id')
          .eq('story_id', story.id)
          .maybeSingle()

        if (!existingMedia) {
          const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: audioBlob.type })
          const { path, error: uploadError } = await uploadMediaFile(audioFile, familyId, user.id)

          if (uploadError || !path) throw new Error(uploadError || 'Failed to upload audio')

          const { error: mediaError } = await supabase
            .from('media')
            .insert({
              story_id: story.id,
              profile_id: user.id,
              family_id: familyId,
              file_path: path,
              file_name: audioFile.name,
              file_size: audioFile.size,
              mime_type: audioFile.type,
              transcript_text: content.trim()
            })

          if (mediaError) throw mediaError
        }
      }

      // If this story was created from a prompt, mark it completed
      const promptInstanceId = searchParams.get('prompt_id')
      if (!asDraft && promptInstanceId) {
        try {
          await supabase
            .from('prompt_instances')
            .update({ 
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', promptInstanceId)
        } catch (e) {
          console.warn('Failed to mark prompt as completed', e)
        }
      }

      toast({
        title: asDraft ? 'Draft saved!' : 'Story published!',
        description: asDraft ? 'Your draft has been saved.' : 'Your voice story is now live.'
      })

      navigate('/feed')
    } catch (error: any) {
      console.error('Error saving voice story:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save story. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Voice Story</CardTitle>
        {autoSaved && (
          <p className="text-sm text-muted-foreground">
            Draft auto-saved • Edit and publish when ready
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* Voice Recorder Panel */}
          <VoiceRecorderPanel
            onTranscriptReady={handleTranscriptReady}
            onPublish={() => handleSubmit(new Event('submit') as any, false)}
            initialAudio={initialAudio || undefined}
          />

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              data-testid="story-title-input"
              placeholder="Give your story a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Story <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="content"
              data-testid="story-content-input"
              placeholder="Describe what's in the recording..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="resize-none"
              required
            />
          </div>


          <div>
            <label className="block text-sm font-medium mb-2">
              When was this recorded? (Optional)
            </label>
            <DatePrecisionPicker value={dateValue} onChange={setDateValue} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="secondary"
              onClick={(e) => handleSubmit(e, true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Story'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
