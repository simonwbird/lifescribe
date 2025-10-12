import { useState, useRef, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Mic,
  MicOff,
  StopCircle,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { TranscriptEditor } from './TranscriptEditor'

interface RecordingFlowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personId: string
  familyId: string
  onSuccess: () => void
}

type RecordingState = 'preflight' | 'countdown' | 'recording' | 'processing' | 'review'

const MAX_DURATION = 120 // 120 seconds
const MIN_DURATION = 3 // 3 seconds

export function RecordingFlow({
  open,
  onOpenChange,
  personId,
  familyId,
  onSuccess
}: RecordingFlowProps) {
  const { toast } = useToast()
  const [state, setState] = useState<RecordingState>('preflight')
  const [countdown, setCountdown] = useState(3)
  const [duration, setDuration] = useState(0)
  const [hasPermission, setHasPermission] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [transcript, setTranscript] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingId, setRecordingId] = useState<string>('')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Check for saved draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      const draftKey = `audio-draft-${familyId}-${personId}`
      const savedDraft = localStorage.getItem(draftKey)
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft)
          
          // Fetch the draft recording from database
          const { data: draftRecording, error } = await supabase
            .from('audio_recordings')
            .select('*')
            .eq('id', draft.recordingId)
            .eq('is_draft', true)
            .single()
          
          if (!error && draftRecording) {
            setRecordingId(draft.recordingId)
            setTranscript(draftRecording.transcript || '')
            setAudioUrl(draftRecording.audio_url)
            setDuration(draftRecording.duration_seconds)
            setState('review')
            
            toast({
              title: "Draft restored",
              description: "Your previous recording has been loaded",
            })
          } else {
            // Clean up invalid draft
            localStorage.removeItem(draftKey)
          }
        } catch (error) {
          console.error('Error loading draft:', error)
          localStorage.removeItem(draftKey)
        }
      }
    }
    
    loadDraft()
  }, [familyId, personId])

  // Save draft to localStorage
  const saveDraft = () => {
    if (recordingId) {
      const draftKey = `audio-draft-${familyId}-${personId}`
      const draft = {
        timestamp: Date.now(),
        recordingId,
        duration,
      }
      localStorage.setItem(draftKey, JSON.stringify(draft))
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      if (audioContextRef.current) audioContextRef.current.close()
    }
  }, [audioUrl])

  const checkMicPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      setHasPermission(true)
      startCountdown()
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record your memory",
        variant: "destructive"
      })
    }
  }

  const startCountdown = () => {
    setState('countdown')
    setCountdown(3)

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          startRecording()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })

      // Set up audio analysis for waveform
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      
      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      // Start waveform animation
      const drawWaveform = () => {
        if (!canvasRef.current || !analyserRef.current) return
        
        analyserRef.current.getByteFrequencyData(dataArray)
        
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        
        const width = canvas.width
        const height = canvas.height
        
        ctx.clearRect(0, 0, width, height)
        
        const barCount = 40
        const barWidth = width / barCount
        
        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * bufferLength)
          const barHeight = (dataArray[dataIndex] / 255) * height * 0.8
          const x = i * barWidth
          const y = (height - barHeight) / 2
          
          ctx.fillStyle = 'hsl(var(--destructive))'
          ctx.fillRect(x, y, barWidth - 2, barHeight)
        }
        
        animationFrameRef.current = requestAnimationFrame(drawWaveform)
      }
      
      drawWaveform()

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        if (audioContextRef.current) audioContextRef.current.close()
        
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        
        setState('processing')
        await uploadAndTranscribe(blob)
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setState('recording')
      setDuration(0)

      // Duration timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1
          if (newDuration >= MAX_DURATION) {
            stopRecording()
          }
          return newDuration
        })
      }, 1000)

    } catch (error) {
      console.error('Recording error:', error)
      toast({
        title: "Recording failed",
        description: "Could not start recording. Please try again.",
        variant: "destructive"
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      if (duration < MIN_DURATION) {
        toast({
          title: "Recording too short",
          description: `Please record at least ${MIN_DURATION} seconds`,
          variant: "destructive"
        })
        return
      }
      
      mediaRecorderRef.current.stop()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const uploadAndTranscribe = async (blob: Blob) => {
    setIsTranscribing(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload audio to storage
      const fileName = `${user.id}/${Date.now()}.webm`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-recordings')
        .upload(fileName, blob)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('audio-recordings')
        .getPublicUrl(fileName)

      // Create database record
      const { data: recordingData, error: dbError } = await supabase
        .from('audio_recordings')
        .insert({
          family_id: familyId,
          created_by: user.id,
          audio_url: publicUrl,
          duration_seconds: duration,
          status: 'processing',
          is_draft: true,
          draft_data: {
            person_id: personId
          }
        })
        .select()
        .single()

      if (dbError) throw dbError
      setRecordingId(recordingData.id)

      // Transcribe audio
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1]
        
        const { data: transcriptData, error: transcriptError } = await supabase.functions
          .invoke('transcribe-audio', {
            body: { audio: base64Audio }
          })

        if (transcriptError) throw transcriptError

        setTranscript(transcriptData.text)
        
        // Update record with transcript
        await supabase
          .from('audio_recordings')
          .update({ 
            transcript: transcriptData.text,
            status: 'completed'
          })
          .eq('id', recordingData.id)

        setState('review')
        saveDraft()
      }
    } catch (error) {
      console.error('Upload/transcribe error:', error)
      toast({
        title: "Processing failed",
        description: "Could not process your recording. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleApprove = async () => {
    try {
      const { error } = await supabase
        .from('audio_recordings')
        .update({
          is_draft: false,
          transcript,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordingId)

      if (error) throw error

      // Clear draft
      const draftKey = `audio-draft-${familyId}-${personId}`
      localStorage.removeItem(draftKey)

      toast({
        title: "Memory saved",
        description: "Your audio remembrance has been published"
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Approval error:', error)
      toast({
        title: "Save failed",
        description: "Could not save your memory. Please try again.",
        variant: "destructive"
      })
    }
  }

  const renderContent = () => {
    switch (state) {
      case 'preflight':
        return (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mic className="h-10 w-10 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">
                Record Your Memory
              </h3>
              <p className="text-muted-foreground mb-6">
                Share a 1-2 minute audio remembrance in your own voice
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Find a quiet space</li>
                  <li>Speak clearly and naturally</li>
                  <li>Recording will be 60-120 seconds</li>
                  <li>You'll be able to review before publishing</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={checkMicPermission}
            >
              <Mic className="h-5 w-5" />
              Start Recording
            </Button>
          </div>
        )

      case 'countdown':
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-8xl font-bold text-primary mb-4 animate-pulse">
              {countdown}
            </div>
            <p className="text-muted-foreground">Get ready to speak...</p>
          </div>
        )

      case 'recording':
        const progress = (duration / MAX_DURATION) * 100
        return (
          <div className="space-y-6 py-8">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Mic className="h-10 w-10 text-destructive" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-2">
                Recording...
              </h3>
              <p className="text-2xl font-mono">
                {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Max: {Math.floor(MAX_DURATION / 60)}:{(MAX_DURATION % 60).toString().padStart(2, '0')}
              </p>
            </div>

            {/* Real-time Waveform */}
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={600}
                height={80}
                className="w-full h-20 rounded-lg bg-muted"
              />
            </div>

            <Progress value={progress} className="h-2" />

            <Button
              variant="destructive"
              className="w-full gap-2"
              size="lg"
              onClick={stopRecording}
              disabled={duration < MIN_DURATION}
            >
              <StopCircle className="h-5 w-5" />
              {duration < MIN_DURATION 
                ? `Stop (minimum ${MIN_DURATION}s)` 
                : 'Stop Recording'
              }
            </Button>
          </div>
        )

      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="font-serif text-xl font-semibold mb-2">
              Processing Recording
            </h3>
            <p className="text-muted-foreground">
              {isTranscribing ? 'Transcribing audio...' : 'Uploading...'}
            </p>
          </div>
        )

      case 'review':
        return (
          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-serif text-xl font-semibold mb-2">
                Review Your Memory
              </h3>
              <p className="text-sm text-muted-foreground">
                Listen and edit the transcript before publishing
              </p>
            </div>

            {/* Audio Player */}
            {audioUrl && (
              <div className="bg-muted rounded-lg p-4">
                <audio 
                  src={audioUrl} 
                  controls 
                  className="w-full"
                  preload="metadata"
                />
              </div>
            )}

            {/* Transcript Editor */}
            <TranscriptEditor
              transcript={transcript}
              onTranscriptChange={setTranscript}
              recordingId={recordingId}
            />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setState('preflight')
                  setAudioBlob(null)
                  setTranscript('')
                }}
                className="flex-1"
              >
                Re-record
              </Button>
              <Button
                onClick={handleApprove}
                className="flex-1 gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Publish Memory
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            Audio Remembrance
          </DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
