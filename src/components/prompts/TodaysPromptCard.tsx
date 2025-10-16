import React, { useState, memo, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, BookOpen, Shuffle, Sparkles, Mic, MessageCircle, PenTool, Loader2, Square, Check, AlertCircle } from 'lucide-react'
import { PromptInstance } from '@/hooks/usePrompts'
import PersonChip from './PersonChip'
import { ResponseModal } from './ResponseModal'
import { useNavigate } from 'react-router-dom'
import { ListenButton } from '@/components/prompts/ListenButton'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToast } from '@/hooks/use-toast'
import { MetadataPanel } from '@/components/stories/MetadataPanel'
import { getPersonaConfig } from '@/config/personaConfig'
import { transcribeAudio } from '@/lib/transcriptionService'

interface TodaysPromptCardProps {
  promptInstance: PromptInstance | null
  onRespond: (instanceId: string) => void
  onBrowseAll: () => void
  onShuffle?: () => void
  loading?: boolean
  people?: Array<{ id: string; full_name: string }> // For person chips
  persona?: string // User persona for analytics
}

type RecordingState = 'idle' | 'preflight' | 'countdown' | 'recording' | 'saving' | 'transcribing' | 'saved' | 'mic-denied'

const TodaysPromptCard = memo(function TodaysPromptCard({ 
  promptInstance, 
  onRespond, 
  onBrowseAll,
  onShuffle,
  loading = false,
  people = [],
  persona = 'general'
}: TodaysPromptCardProps) {
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [countdown, setCountdown] = useState(3)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [lastAutoSave, setLastAutoSave] = useState<number>(0)
  const [recordingPauses, setRecordingPauses] = useState<number>(0)
  const [listenStartTime, setListenStartTime] = useState<number>(0)
  const [showMetadataPanel, setShowMetadataPanel] = useState(false)
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null)
  const [recordingTranscript, setRecordingTranscript] = useState<string>('')
  const [isShuffling, setIsShuffling] = useState(false)
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const navigate = useNavigate()
  const { track } = useAnalytics()
  const { toast } = useToast()
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasTrackedImpressionRef = useRef(false)

  // Get persona config
  const personaConfig = persona ? getPersonaConfig(persona as any) : null

  // Track prompt impression on mount
  useEffect(() => {
    if (promptInstance?.id && !hasTrackedImpressionRef.current) {
      track({
        event_name: 'prompt_impression',
        properties: {
          prompt_id: promptInstance.id,
          prompt_title: promptInstance.prompt?.title,
          prompt_category: promptInstance.prompt?.category,
          persona,
          has_person_ids: promptInstance.person_ids?.length > 0
        }
      } as any)
      hasTrackedImpressionRef.current = true
    }
  }, [promptInstance?.id, persona])

  // Countdown timer effect
  useEffect(() => {
    if (recordingState === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (recordingState === 'countdown' && countdown === 0) {
      setRecordingState('recording')
      track({
        event_name: 'record_start',
        properties: {
          prompt_id: promptInstance?.id,
          persona
        }
      } as any)
    }
  }, [recordingState, countdown])

  // Recording duration timer and MediaRecorder start
  useEffect(() => {
    if (recordingState === 'recording' && mediaStream) {
      // Start MediaRecorder
      try {
        const recorder = new MediaRecorder(mediaStream, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        })
        
        audioChunksRef.current = [] // Reset chunks
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data)
          }
        }
        
        recorder.start()
        mediaRecorderRef.current = recorder
      } catch (error) {
        console.error('Failed to start MediaRecorder:', error)
        toast({
          title: 'Recording failed',
          description: 'Could not start recording. Please try again.',
          variant: 'destructive'
        })
        setRecordingState('idle')
        return
      }
      
      // Duration timer
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
      return () => {
        clearInterval(timer)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }
    }
  }, [recordingState, mediaStream])

  // Auto-save every 5 seconds during recording
  useEffect(() => {
    if (recordingState === 'recording') {
      autoSaveTimerRef.current = setInterval(() => {
        setLastAutoSave(Date.now())
        console.log('Auto-saving recording...')
      }, 5000)
      
      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current)
        }
      }
    }
  }, [recordingState])

  // Track dropoff when user leaves recording state
  useEffect(() => {
    return () => {
      if (recordingState !== 'idle' && recordingState !== 'saved') {
        let dropoffStep: string
        if (recordingState === 'preflight') {
          dropoffStep = 'preflight'
        } else if (recordingState === 'countdown') {
          dropoffStep = 'countdown'
        } else if (recordingState === 'recording') {
          if (recordingDuration <= 15) {
            dropoffStep = 'recording_0_15'
          } else if (recordingDuration <= 60) {
            dropoffStep = 'recording_15_60'
          } else {
            dropoffStep = 'recording_60_plus'
          }
        } else if (recordingState === 'mic-denied') {
          dropoffStep = 'preflight'
        } else {
          return
        }

        track({
          event_name: 'dropoff_step',
          properties: {
            prompt_id: promptInstance?.id,
            persona,
            step: dropoffStep,
            duration: recordingDuration
          }
        } as any)
      }
    }
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartRecording = async () => {
    setRecordingState('preflight')
    track({
      event_name: 'prompt_record_attempt',
      properties: {
        prompt_id: promptInstance?.id,
        persona
      }
    } as any)
    
    try {
      // Check microphone permission and get stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      setMediaStream(stream)
      setRecordingState('countdown')
      setCountdown(3)
    } catch (error) {
      console.error('Microphone access denied:', error)
      setRecordingState('mic-denied')
      track({
        event_name: 'prompt_mic_denied',
        properties: {
          prompt_id: promptInstance?.id,
          persona
        }
      } as any)
      track({
        event_name: 'dropoff_step',
        properties: {
          prompt_id: promptInstance?.id,
          persona,
          step: 'preflight',
          duration: 0
        }
      } as any)
      
      toast({
        title: 'Microphone blocked',
        description: 'Browser blocked the mic. Try text, or enable microphone in settings.',
        variant: 'destructive'
      })
    }
  }

  const handleStopRecording = () => {
    // Stop MediaRecorder
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop()
    }
    
    // Stop media stream
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop())
      setMediaStream(null)
    }
    
    setRecordingState('saving')
    
    // Track record completion
    track({
      event_name: 'record_complete',
      properties: {
        prompt_id: promptInstance?.id,
        persona,
        duration: recordingDuration,
        pauses: recordingPauses,
        duration_bucket: recordingDuration <= 15 ? '0_15' : 
                        recordingDuration <= 60 ? '15_60' : 
                        '60_plus'
      }
    } as any)
    
    // Give MediaRecorder time to finalize, then process audio
    setTimeout(async () => {
      const chunks = audioChunksRef.current
      
      if (chunks.length > 0 && promptInstance) {
        const audioBlob = new Blob(chunks, { 
          type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        })
        
        // Transcribe the audio
        setRecordingState('transcribing')
        
        try {
          const transcription = await transcribeAudio(audioBlob, promptInstance.prompt?.body)
          
          // Store audio temporarily in sessionStorage
          const reader = new FileReader()
          reader.onloadend = () => {
            sessionStorage.setItem('pendingAudioRecording', reader.result as string)
            sessionStorage.setItem('pendingAudioDuration', recordingDuration.toString())
            sessionStorage.setItem('pendingTranscript', transcription.text)
            
            // Check if archivist persona should open metadata panel
            if (personaConfig?.postRecordAction === 'openMetadataPanel') {
              setRecordingTranscript(transcription.text)
              setShowMetadataPanel(true)
              setRecordingState('idle')
              
              track({
                event_name: 'metadata_panel_opened',
                properties: {
                  prompt_id: promptInstance.id,
                  persona,
                  trigger: 'post_record'
                }
              } as any)
            } else {
              // Navigate to story creation with prompt info and transcript
              const searchParams = new URLSearchParams({
                type: 'voice',
                promptTitle: promptInstance.prompt?.title || '',
                prompt_id: promptInstance.id,
                prompt_text: promptInstance.prompt?.body || '',
                hasRecording: 'true',
                transcript: transcription.text
              })
              navigate(`/stories/new?${searchParams.toString()}`)
            }
          }
          reader.readAsDataURL(audioBlob)
        } catch (error) {
          console.error('Transcription failed:', error)
          toast({
            title: 'Transcription failed',
            description: 'We couldn\'t transcribe your recording. You can add the story manually.',
            variant: 'destructive'
          })
          
          // Still save the audio and navigate
          const reader = new FileReader()
          reader.onloadend = () => {
            sessionStorage.setItem('pendingAudioRecording', reader.result as string)
            sessionStorage.setItem('pendingAudioDuration', recordingDuration.toString())
            
            const searchParams = new URLSearchParams({
              type: 'voice',
              promptTitle: promptInstance.prompt?.title || '',
              prompt_id: promptInstance.id,
              prompt_text: promptInstance.prompt?.body || '',
              hasRecording: 'true'
            })
            navigate(`/stories/new?${searchParams.toString()}`)
          }
          reader.readAsDataURL(audioBlob)
        }
      } else if (promptInstance) {
        // No audio captured, just navigate
        const searchParams = new URLSearchParams({
          type: 'voice',
          promptTitle: promptInstance.prompt?.title || '',
          prompt_id: promptInstance.id,
          prompt_text: promptInstance.prompt?.body || ''
        })
        navigate(`/stories/new?${searchParams.toString()}`)
      }
    }, 500)
  }

  const handleWriteInstead = () => {
    track({
      event_name: 'write_instead',
      properties: {
        prompt_id: promptInstance?.id,
        persona,
        from_state: recordingState
      }
    } as any)
    
    if (promptInstance) {
      const searchParams = new URLSearchParams({
        type: 'text',
        promptTitle: promptInstance.prompt?.title || '',
        prompt_id: promptInstance.id,
        prompt_text: promptInstance.prompt?.body || ''
      })
      navigate(`/stories/new?${searchParams.toString()}`)
    }
    
    setRecordingState('idle')
  }

  const handleShuffle = () => {
    if (onShuffle) {
      setIsShuffling(true)
      track({
        event_name: 'shuffle',
        properties: {
          prompt_id: promptInstance?.id,
          persona,
          previous_prompt_id: promptInstance?.id
        }
      } as any)
      onShuffle()
      // Reset shuffle animation after transition completes
      setTimeout(() => setIsShuffling(false), 200)
    }
  }

  const handleListenStart = () => {
    setListenStartTime(Date.now())
  }

  const handleListenEnd = () => {
    if (listenStartTime > 0) {
      const duration = Math.floor((Date.now() - listenStartTime) / 1000)
      track({
        event_name: 'listen_play',
        properties: {
          prompt_id: promptInstance?.id,
          persona,
          duration_listened: duration,
          prompt_text_length: promptInstance?.prompt?.body?.length || 0
        }
      } as any)
      setListenStartTime(0)
    }
  }

  const handleResponseSelect = (type: 'voice' | 'text' | 'video') => {
    setShowResponseModal(false)
    
    if (!promptInstance) return
    
    track({
      event_name: 'response_type_selected',
      properties: {
        prompt_id: promptInstance.id,
        persona,
        response_type: type
      }
    } as any)
    
    const searchParams = new URLSearchParams({
      type,
      promptTitle: promptInstance.prompt?.title || '',
      prompt_id: promptInstance.id,
      prompt_text: promptInstance.prompt?.body || ''
    })
    
    navigate(`/stories/new?${searchParams.toString()}`)
  }
  // Show loading skeleton while data is being fetched
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Loading */}
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          
          <div className="flex items-start justify-between gap-4">
            <div className="h-8 w-3/4 bg-muted animate-pulse rounded flex-1" />
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            </div>
          </div>
          
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>

        {/* Prompt Card Loading */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <div className="h-5 w-5 bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Button Loading */}
        <div className="h-14 w-full bg-muted animate-pulse rounded" />
      </div>
    )
  }

  if (!promptInstance?.prompt) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BookOpen className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-center mb-4">
            No prompts available right now
          </p>
          <Button onClick={onBrowseAll} variant="outline">
            Browse All Prompts
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-2xl text-muted-foreground">Today's prompt</h2>
        
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-medium text-foreground flex-1">
            {promptInstance.prompt.title}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <ListenButton
              text={`${promptInstance.prompt.title}. ${promptInstance.prompt.body}`}
              promptId={promptInstance.id}
              size="lg"
              showLabel
              className="h-12 px-6 text-base font-medium min-w-[140px]"
              onPlayStart={handleListenStart}
              onPlayEnd={handleListenEnd}
              persona={persona}
            />
            <Button
              variant="ghost" 
              size="lg" 
              className={cn(
                "gap-2 h-12 px-6",
                "transition-all duration-150 ease-out",
                "hover:bg-accent"
              )}
              onClick={handleShuffle}
              disabled={!onShuffle || recordingState !== 'idle'}
              title="Get a different prompt."
            >
              <Shuffle className={cn(
                "h-5 w-5 transition-transform duration-150 ease-out",
                isShuffling && "rotate-180"
              )} />
              Shuffle
            </Button>
          </div>
        </div>
        
        <p className="text-muted-foreground">
          Don't aim for perfect—aim for true. 60–90 seconds is plenty.
        </p>
      </div>

      {/* Prompt Card */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="font-medium text-foreground">
                Personal Prompt
              </p>
              <p className="text-foreground">
                {promptInstance.prompt.body}
              </p>
              
              {/* Person chips for person-specific prompts */}
              {promptInstance.person_ids && promptInstance.person_ids.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {promptInstance.person_ids.map(personId => {
                    const person = people.find(p => p.id === personId)
                    return person ? (
                      <PersonChip key={personId} name={person.full_name} />
                    ) : null
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recording States */}
      {recordingState === 'preflight' && (
        <Card className="border-primary/50">
          <CardContent className="p-6 flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-foreground">Checking microphone...</p>
          </CardContent>
        </Card>
      )}

      {recordingState === 'countdown' && (
        <Card className="border-primary/50">
          <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
            <div className="text-7xl font-bold text-primary animate-pulse">
              {countdown}
            </div>
            <p className="text-muted-foreground">Get ready...</p>
          </CardContent>
        </Card>
      )}

      {recordingState === 'recording' && (
        <Card className="border-red-500/50 bg-red-50/5">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-center gap-4">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-3xl font-mono font-semibold">
                {formatDuration(recordingDuration)}
              </span>
            </div>
            
            {/* Live waveform visualization */}
            <div className="flex items-center justify-center gap-1 h-16">
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  style={{
                    height: `${20 + Math.random() * 80}%`,
                    animation: `pulse ${0.5 + Math.random() * 0.5}s ease-in-out infinite`,
                    animationDelay: `${i * 0.05}s`
                  }}
                />
              ))}
            </div>
            
            <div className="flex items-center justify-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-success font-medium">
                Recording… Auto-saving
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {recordingState === 'saving' && (
        <Card className="border-primary/50">
          <CardContent className="p-6 flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-foreground">Saving your recording...</p>
          </CardContent>
        </Card>
      )}

      {recordingState === 'transcribing' && (
        <Card className="border-primary/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-foreground font-medium">Transcribing your recording...</p>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Converting your voice to text
            </p>
          </CardContent>
        </Card>
      )}

      {recordingState === 'mic-denied' && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-medium text-foreground">Microphone Access Blocked</p>
                <p className="text-sm text-muted-foreground">
                  Browser blocked the mic. Try text, or enable microphone in settings.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleWriteInstead}
                className="flex-1"
              >
                <PenTool className="h-4 w-4 mr-2" />
                Write Instead
              </Button>
              <Button 
                onClick={() => setRecordingState('idle')}
                variant="outline"
                className="flex-1"
              >
                Dismiss
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main CTAs - only show when idle */}
      {recordingState === 'idle' && (
        <>
          {/* Main CTA - Large, high-contrast button */}
          <Button 
            onClick={handleStartRecording}
            className="w-full h-16 text-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-all hover:scale-[1.02]"
            size="lg"
          >
            <Mic className="h-6 w-6 mr-3" />
            Start Recording
          </Button>

          {/* Secondary action */}
          <div className="flex justify-center">
            <Button 
              onClick={handleWriteInstead}
              variant="outline"
              size="lg"
              className="min-w-[200px]"
            >
              <PenTool className="h-4 w-4 mr-2" />
              Write Instead
            </Button>
          </div>
        </>
      )}

      {/* Stop recording button */}
      {recordingState === 'recording' && (
        <Button 
          onClick={handleStopRecording}
          variant="destructive"
          className="w-full h-16 text-xl font-semibold shadow-lg"
          size="lg"
        >
          <Square className="h-6 w-6 mr-3" />
          Finish
        </Button>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-2">
              <div className="flex items-center">
                <BookOpen className="h-6 w-6 text-muted-foreground mr-1" />
                <span className="text-muted-foreground">🏷️</span>
              </div>
            </div>
          </div>
          <h3 className="font-medium">Build Your Life Page</h3>
          <p className="text-sm text-muted-foreground">
            Collect stories, photos, and memories in one place
          </p>
        </div>
        
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-2">
              <div className="flex items-center">
                <Mic className="h-6 w-6 text-muted-foreground mr-1" />
                <PenTool className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          <h3 className="font-medium">Try Quick Voice</h3>
          <p className="text-sm text-muted-foreground">
            Just start talking
          </p>
        </div>
        
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-2">
              <div className="flex items-center">
                <span className="text-amber-500 text-xl mr-1">⚡</span>
                <span className="text-muted-foreground">🏷️</span>
              </div>
            </div>
          </div>
          <h3 className="font-medium">Create Your Own Story</h3>
          <p className="text-sm text-muted-foreground">
            Share anything you like
          </p>
        </div>
      </div>

      {/* Browse All Prompts */}
      <div className="text-center">
        <Button 
          onClick={onBrowseAll}
          variant="outline"
          className="gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Browse all prompts
        </Button>
      </div>

      {/* Encouragement */}
      <div className="text-center flex items-center justify-center gap-2">
        <span className="text-sm text-muted-foreground">🔒</span>
        <p className="text-sm text-muted-foreground">
          Private by default. You choose who sees it.
        </p>
      </div>

      {/* Response Modal */}
      {promptInstance?.prompt && (
        <ResponseModal
          isOpen={showResponseModal}
          onClose={() => setShowResponseModal(false)}
          prompt={{
            title: promptInstance.prompt.title,
            body: promptInstance.prompt.body
          }}
          onSelectResponse={handleResponseSelect}
        />
      )}

      {/* Metadata Panel (Archivist Mode) */}
      <MetadataPanel
        isOpen={showMetadataPanel}
        onClose={() => {
          setShowMetadataPanel(false)
          track({
            event_name: 'metadata_panel_closed',
            properties: {
              prompt_id: promptInstance?.id,
              persona
            }
          } as any)
        }}
        storyId={currentStoryId || undefined}
        transcript={recordingTranscript}
        promptId={promptInstance?.id}
        familyId={promptInstance?.family_id || ''}
      />
    </div>
    )
  }
)

export default TodaysPromptCard