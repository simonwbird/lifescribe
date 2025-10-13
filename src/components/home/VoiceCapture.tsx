import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Mic, Square, Pause, Play, Loader2, Check, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { cn } from '@/lib/utils'

interface VoiceCaptureProps {
  familyId: string
  userId: string
  onPublished?: () => void
  onCancel?: () => void
}

export function VoiceCapture({ familyId, userId, onPublished, onCancel }: VoiceCaptureProps) {
  const [state, setState] = useState<'idle' | 'requesting-mic' | 'recording' | 'paused' | 'stopped'>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcribing, setTranscribing] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const { toast } = useToast()

  // Listen for global event to trigger recording
  useEffect(() => {
    const handleOpen = () => {
      if (state === 'idle') {
        startRecording()
      }
    }
    window.addEventListener('open-voice-capture', handleOpen)
    return () => window.removeEventListener('open-voice-capture', handleOpen)
  }, [state])

  useEffect(() => {
    return () => {
      stopRecording()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = async () => {
    try {
      setState('requesting-mic')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      })
      
      streamRef.current = stream
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        await transcribeAudio(blob)
      }
      
      mediaRecorder.start()
      setState('recording')
      setRecordingTime(0)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
    } catch (error) {
      console.error('Microphone access error:', error)
      setState('idle')
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record audio.",
        variant: "destructive"
      })
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      setState('paused')
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      setState('recording')
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop()
      streamRef.current?.getTracks().forEach(track => track.stop())
      setState('stopped')
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const transcribeAudio = async (blob: Blob) => {
    setTranscribing(true)
    try {
      // Convert blob to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1]
          resolve(base64)
        }
      })
      reader.readAsDataURL(blob)
      const base64Audio = await base64Promise

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      })

      if (error) throw error

      setTranscription(data.text || '')
      toast({
        title: "Transcription ready! ✍️",
        description: "Review and edit before publishing"
      })
    } catch (error) {
      console.error('Transcription error:', error)
      toast({
        title: "Transcription failed",
        description: "You can still publish the audio without transcription",
        variant: "destructive"
      })
    } finally {
      setTranscribing(false)
    }
  }

  const saveDraft = async () => {
    if (!audioBlob) return
    
    setPublishing(true)
    try {
      // Upload audio
      const fileName = `${userId}-${Date.now()}.webm`
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(`voice-notes/${fileName}`, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Create draft audio recording
      const { error: recordingError } = await supabase
        .from('audio_recordings')
        .insert({
          family_id: familyId,
          created_by: userId,
          audio_url: `voice-notes/${fileName}`,
          duration_seconds: recordingTime,
          is_draft: true,
          transcript: transcription,
          status: 'completed'
        })

      if (recordingError) throw recordingError

      toast({
        title: "Draft saved! 💾",
        description: "Resume from 'Resume Drafts' on Home"
      })
      
      reset()
      onCancel?.()
    } catch (error) {
      console.error('Save draft error:', error)
      toast({
        title: "Failed to save draft",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setPublishing(false)
    }
  }

  const publish = async () => {
    if (!audioBlob) return
    
    setPublishing(true)
    try {
      // Upload audio
      const fileName = `${userId}-${Date.now()}.webm`
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(`voice-notes/${fileName}`, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Create story with audio
      const { error: storyError } = await supabase
        .from('stories')
        .insert({
          family_id: familyId,
          profile_id: userId,
          title: transcription ? transcription.slice(0, 100) : 'Voice Note',
          content: transcription || '[Voice recording]'
        })

      if (storyError) throw storyError

      toast({
        title: "Published! 🎉",
        description: "Your voice note is now live"
      })
      
      reset()
      onPublished?.()
    } catch (error) {
      console.error('Publish error:', error)
      toast({
        title: "Failed to publish",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setPublishing(false)
    }
  }

  const reset = () => {
    setState('idle')
    setRecordingTime(0)
    setTranscription('')
    setAudioBlob(null)
    chunksRef.current = []
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (state === 'idle') {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="p-6 text-center">
          <Button
            onClick={startRecording}
            size="lg"
            className="gap-2"
          >
            <Mic className="h-5 w-5" />
            Start Voice Recording
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Record anywhere on Home • Auto-transcribes
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary">
      <CardContent className="p-6 space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center",
              state === 'recording' ? "bg-red-100 animate-pulse" : "bg-muted"
            )}>
              <Mic className={cn(
                "h-6 w-6",
                state === 'recording' ? "text-red-600" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="font-semibold text-lg font-mono">
                {formatTime(recordingTime)}
              </p>
              <p className="text-xs text-muted-foreground">
                {state === 'recording' ? 'Recording...' : state === 'paused' ? 'Paused' : 'Stopped'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {state === 'recording' && (
              <>
                <Button variant="outline" size="sm" onClick={pauseRecording}>
                  <Pause className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={stopRecording}>
                  <Square className="h-4 w-4" />
                </Button>
              </>
            )}
            {state === 'paused' && (
              <>
                <Button variant="outline" size="sm" onClick={resumeRecording}>
                  <Play className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={stopRecording}>
                  <Square className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Transcription */}
        {(state === 'stopped' || transcription) && (
          <div className="space-y-2">
            {transcribing ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-sm text-muted-foreground">Transcribing...</p>
              </div>
            ) : (
              <>
                <label className="text-sm font-medium">Transcription (editable)</label>
                <Textarea
                  value={transcription}
                  onChange={(e) => setTranscription(e.target.value)}
                  placeholder="Transcription will appear here..."
                  className="min-h-[120px]"
                />
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {state === 'stopped' && !transcribing && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={publish}
              disabled={publishing}
              className="flex-1 gap-2"
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Approve & Publish
            </Button>
            <Button
              onClick={saveDraft}
              disabled={publishing}
              variant="outline"
              className="gap-2"
            >
              Save Draft
            </Button>
            <Button
              onClick={() => {
                reset()
                onCancel?.()
              }}
              disabled={publishing}
              variant="ghost"
              size="icon"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
