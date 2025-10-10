import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mic, Square, Upload, AlertCircle, Settings, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type RecorderState = 'idle' | 'recording' | 'processing' | 'edit' | 'published'

interface VoiceRecorderPanelProps {
  onTranscriptReady: (transcript: string, audioBlob: Blob, duration: number) => void
  onPublish?: () => void
  className?: string
}

export default function VoiceRecorderPanel({ onTranscriptReady, onPublish, className }: VoiceRecorderPanelProps) {
  const { toast } = useToast()
  const [state, setState] = useState<RecorderState>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [micDenied, setMicDenied] = useState(false)
  const [micCapable, setMicCapable] = useState<boolean | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)

  // Check microphone capability
  useEffect(() => {
    const isSecureContext = window.isSecureContext
    const hasMediaDevices = !!navigator.mediaDevices?.getUserMedia
    setMicCapable(isSecureContext && hasMediaDevices)
  }, [])

  // Recording timer
  useEffect(() => {
    if (state === 'recording') {
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [state])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      startTimeRef.current = Date.now()

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const duration = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0
        
        setAudioBlob(audioBlob)
        setAudioUrl(URL.createObjectURL(audioBlob))
        setDuration(duration)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())

        // Auto-transcribe
        await transcribeAudio(audioBlob, duration)
      }

      mediaRecorder.start()
      setState('recording')
      setRecordingTime(0)
    } catch (error: any) {
      console.error('Mic access error:', error)
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setMicDenied(true)
      }
      
      toast({
        title: 'Microphone access denied',
        description: 'Please check your browser settings or upload an audio file instead.',
        variant: 'destructive'
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const transcribeAudio = async (blob: Blob, audioDuration: number) => {
    setState('processing')
    setProcessingProgress(0)

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => Math.min(prev + 10, 90))
    }, 500)

    try {
      // Convert blob to base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
      })
      reader.readAsDataURL(blob)

      const base64Audio = await base64Promise

      // Call transcription function
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: { audio: base64Audio }
      })

      clearInterval(progressInterval)
      setProcessingProgress(100)

      if (error) throw error
      if (!data?.text) throw new Error('No transcription text returned')

      // Light clean: normalize punctuation, trim
      const cleanedText = data.text
        .replace(/\s+/g, ' ')
        .replace(/\s+([.,!?])/g, '$1')
        .trim()

      setState('edit')
      onTranscriptReady(cleanedText, blob, audioDuration)

      toast({
        title: 'Transcription complete!',
        description: `${Math.round(audioDuration)}s recorded. Text ready to edit.`,
      })

    } catch (error: any) {
      clearInterval(progressInterval)
      console.error('Transcription error:', error)
      
      setState('edit')
      // Still allow editing even if transcription fails
      onTranscriptReady('', blob, audioDuration)
      
      toast({
        title: 'Transcription failed',
        description: error.message || 'You can still manually type the content.',
        variant: 'destructive'
      })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-m4a']
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload .webm, .mp3, .m4a, or .wav',
        variant: 'destructive'
      })
      return
    }

    // Convert to blob and transcribe
    const blob = new Blob([await file.arrayBuffer()], { type: file.type })
    setAudioBlob(blob)
    setAudioUrl(URL.createObjectURL(blob))
    
    // Approximate duration (won't be exact without parsing audio)
    const estimatedDuration = file.size / 16000 // Rough estimate
    setDuration(estimatedDuration)
    
    await transcribeAudio(blob, estimatedDuration)
  }

  const reset = () => {
    setState('idle')
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
    setProcessingProgress(0)
    setDuration(0)
  }

  const getStateColor = () => {
    switch (state) {
      case 'recording': return 'text-red-500'
      case 'processing': return 'text-yellow-500'
      case 'edit': return 'text-green-500'
      case 'published': return 'text-blue-500'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <Card className={cn('p-6', className)} data-testid="voice-recorder-panel">
      {/* State indicator */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-3">
          {['idle', 'recording', 'processing', 'edit', 'published'].map((s, idx) => (
            <div key={s} className="flex items-center gap-1">
              <div className={cn(
                "w-3 h-3 rounded-full transition-all",
                state === s ? getStateColor() : 'bg-muted',
                state === s && 'ring-2 ring-offset-2'
              )} />
              <span className={cn(
                "text-xs font-medium capitalize",
                state === s ? getStateColor() : 'text-muted-foreground'
              )}>
                {s}
              </span>
              {idx < 4 && <div className="w-4 h-px bg-border" />}
            </div>
          ))}
        </div>
      </div>

      {/* Permission denied guidance */}
      {micDenied && (
        <Alert className="mb-4" data-testid="mic-permission-denied">
          <Settings className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p className="font-semibold">Enable microphone access:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Click the lock icon in your browser's address bar</li>
              <li>Find "Microphone" and select "Allow"</li>
              <li>Refresh this page</li>
            </ul>
            <a 
              href="https://support.google.com/chrome/answer/2693767"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline"
            >
              How to allow microphone <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* Not secure context */}
      {micCapable === false && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Voice recording requires HTTPS. Please upload an audio file instead.
          </AlertDescription>
        </Alert>
      )}

      {/* IDLE STATE */}
      {state === 'idle' && (
        <div className="space-y-4">
          {micCapable !== false && (
            <>
              <Button
                type="button"
                size="lg"
                onClick={startRecording}
                className="w-full h-20"
                data-test="voice-start"
                data-testid="start-recording-btn"
              >
                <Mic className="h-6 w-6 mr-2" />
                Start Recording
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>
            </>
          )}

          <label 
            className="flex items-center justify-center w-full h-32 px-4 transition border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none"
            data-test="voice-upload"
            data-testid="audio-upload-label"
          >
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">
                Upload Audio File
              </span>
              <span className="text-xs text-muted-foreground">
                .mp3, .m4a, .wav, .webm
              </span>
            </div>
            <input
              type="file"
              accept="audio/webm,audio/mpeg,audio/mp4,audio/wav,audio/x-m4a"
              onChange={handleFileUpload}
              className="hidden"
              data-testid="audio-upload-input"
            />
          </label>
        </div>
      )}

      {/* RECORDING STATE */}
      {state === 'recording' && (
        <div className="space-y-4">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" data-testid="recording-indicator" />
                <span className="text-2xl font-mono">{formatTime(recordingTime)}</span>
              </div>
              <p className="text-sm text-muted-foreground">Recording in progress...</p>
            </div>
          </div>
          
          <Button
            type="button"
            variant="destructive"
            size="lg"
            onClick={stopRecording}
            className="w-full"
            data-test="voice-stop"
          >
            <Square className="h-5 w-5 mr-2" />
            Stop Recording
          </Button>
        </div>
      )}

      {/* PROCESSING STATE */}
      {state === 'processing' && (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center h-32 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            <div className="w-full max-w-xs space-y-2">
              <p className="text-sm text-center text-muted-foreground">
                Transcribing audio...
              </p>
              <Progress value={processingProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                {processingProgress}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STATE */}
      {state === 'edit' && audioUrl && (
        <div className="space-y-4" data-test="voice-transcribed">
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Ready to edit
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                {Math.round(duration)}s recorded • Transcript inserted below
              </p>
            </div>
          </div>

          <audio controls src={audioUrl} className="w-full" data-testid="audio-player" />
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={reset}
              className="flex-1"
              data-testid="re-record-btn"
            >
              Re-record
            </Button>
            {onPublish && (
              <Button
                type="button"
                onClick={onPublish}
                className="flex-1"
                data-testid="publish-now-btn"
              >
                Publish Now
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
