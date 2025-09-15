import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Mic, MicOff, Loader2, Upload, Play, Pause, Trash2, X, Settings } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useLabs } from '@/hooks/useLabs'
import { autoTitle, suggestPeople, inferDate } from '@/lib/voiceHelpers'
import { transcribeAudio } from '@/lib/transcriptionService'
import { uploadVoiceRecording, createStoryFromVoice } from '@/lib/voiceService'

type CaptureState = 'idle' | 'recording' | 'transcribing' | 'review' | 'publishing' | 'drafting'

interface VoiceCaptureModalProps {
  open: boolean
  onClose: () => void
  onStoryCreated?: (storyId: string) => void
  preselectedPeople?: Array<{ id: string; name: string }>
}

interface ReviewData {
  title: string
  content: string
  people: Array<{ id?: string; name: string }>
  date: string
  datePrecision: 'day' | 'month' | 'year' | 'unknown'
  privacy: 'family' | 'private'
  tags: string[]
}

export default function VoiceCaptureModal({ open, onClose, onStoryCreated, preselectedPeople = [] }: VoiceCaptureModalProps) {
  const [state, setState] = useState<CaptureState>('idle')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [reviewData, setReviewData] = useState<ReviewData>({
    title: '',
    content: '',
    people: [],
    date: '',
    datePrecision: 'unknown',
    privacy: 'family',
    tags: []
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const isLoading = state === 'publishing' || state === 'drafting'
  const isDrafting = state === 'drafting'
  const isPublishing = state === 'publishing'

  const { track } = useAnalytics()
  const { labsEnabled } = useLabs()

  // Initialize review data with preselected people
  useEffect(() => {
    if (preselectedPeople.length > 0) {
      setReviewData(prev => ({
        ...prev,
        people: preselectedPeople.map(p => ({ id: p.id, name: p.name }))
      }))
    }
  }, [preselectedPeople])

  // Auto-stop at 90 seconds
  useEffect(() => {
    if (state === 'recording') {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 90) {
            stopRecording()
            return 90
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [state])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setAudioBlob(blob)
        
        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }

        // Start transcription
        setState('transcribing')
        try {
          const result = await transcribeAudio(blob)
          setTranscript(result.text)
          setConfidence(result.confidence || 0)
          
          // Generate smart suggestions
          const suggestedTitle = autoTitle(result.text)
          const suggestedPeople = await suggestPeople(result.text)
          const inferredDate = inferDate(result.text)
          
          setReviewData({
            title: suggestedTitle,
            content: result.text,
            people: suggestedPeople,
            date: inferredDate.value,
            datePrecision: inferredDate.precision,
            privacy: 'family',
            tags: []
          })
          
          setState('review')
        } catch (error) {
          console.error('Transcription failed:', error)
          setState('idle')
        }
      }

      mediaRecorder.start()
      setState('recording')
      setRecordingTime(0)
      track('voice_capture_start')
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop()
      track('voice_capture_stop')
    }
  }

  const handleClose = () => {
    if (state === 'recording') {
      stopRecording()
    }
    setState('idle')
    setAudioUrl(null)
    setAudioBlob(null)
    setTranscript('')
    setRecordingTime(0)
    setReviewData({
      title: '',
      content: '',
      people: [],
      date: '',
      datePrecision: 'unknown',
      privacy: 'family',
      tags: []
    })
    onClose()
  }

  const handlePublish = async () => {
    if (!audioBlob) return
    
    setState('publishing')
    try {
      const storyId = await createStoryFromVoice(audioBlob, reviewData)
      onStoryCreated?.(storyId)
      handleClose()
    } catch (error) {
      console.error('Publishing failed:', error)
      setState('review')
    }
  }

  const handleSaveDraft = async () => {
    if (!audioBlob) return
    
    setState('drafting')
    try {
      const storyId = await createStoryFromVoice(audioBlob, { ...reviewData, isDraft: true })
      onStoryCreated?.(storyId)
      handleClose()
    } catch (error) {
      console.error('Saving draft failed:', error)
      setState('review')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const addPerson = (name: string) => {
    if (name.trim() && !reviewData.people.find(p => p.name === name.trim())) {
      setReviewData(prev => ({
        ...prev,
        people: [...prev.people, { name: name.trim() }]
      }))
    }
  }

  const removePerson = (index: number) => {
    setReviewData(prev => ({
      ...prev,
      people: prev.people.filter((_, i) => i !== index)
    }))
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Capture
          </DialogTitle>
        </DialogHeader>

        {state === 'idle' && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Mic className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Share Your Story</h3>
                <p className="text-muted-foreground">
                  Record up to 90 seconds telling your story. We'll automatically transcribe it and help you add details.
                </p>
              </div>
              <Button onClick={startRecording} size="lg" className="gap-2">
                <Mic className="h-4 w-4" />
                Start Recording
              </Button>
            </div>
          </div>
        )}

        {state === 'recording' && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto bg-destructive/10 rounded-full flex items-center justify-center animate-pulse">
                <MicOff className="h-12 w-12 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-destructive">Recording...</h3>
                <p className="text-2xl font-mono font-bold">{formatTime(recordingTime)}</p>
                <p className="text-sm text-muted-foreground">
                  {90 - recordingTime} seconds remaining
                </p>
              </div>
              <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2">
                <MicOff className="h-4 w-4" />
                Stop Recording
              </Button>
            </div>
            
            {/* Live waveform placeholder */}
            <div className="h-16 bg-muted/30 rounded-lg flex items-center justify-center">
              <div className="flex items-end gap-1 h-8">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div 
                    key={i}
                    className="w-1 bg-primary/60 rounded-full animate-pulse"
                    style={{ 
                      height: `${Math.random() * 100}%`,
                      animationDelay: `${i * 50}ms`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {state === 'transcribing' && (
          <div className="space-y-6 py-8">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
              <div>
                <h3 className="text-lg font-medium">Transcribing your story...</h3>
                <p className="text-muted-foreground">
                  This should take less than 10 seconds
                </p>
              </div>
            </div>
          </div>
        )}

        {state === 'review' && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Story Title *</Label>
                <Input
                  id="title"
                  value={reviewData.title}
                  onChange={(e) => setReviewData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter a title for your story"
                />
              </div>

              <div className="space-y-2">
                <Label>People in this story</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {reviewData.people.map((person, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {person.name}
                      <button
                        onClick={() => removePerson(index)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add a person (press Enter)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addPerson(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">When did this happen?</Label>
                  <Input
                    id="date"
                    type="date"
                    value={reviewData.date}
                    onChange={(e) => setReviewData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precision">Date precision</Label>
                  <Select
                    value={reviewData.datePrecision}
                    onValueChange={(value: any) => setReviewData(prev => ({ ...prev, datePrecision: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Exact day</SelectItem>
                      <SelectItem value="month">Month and year</SelectItem>
                      <SelectItem value="year">Year only</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacy">Privacy</Label>
                <Select
                  value={reviewData.privacy}
                  onValueChange={(value: any) => setReviewData(prev => ({ ...prev, privacy: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Family (default)</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {labsEnabled && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Advanced Options</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {showAdvanced && (
                    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                      <div className="space-y-2">
                        <Label>Tags (Studio only)</Label>
                        <Input
                          placeholder="Add tags separated by commas"
                          value={reviewData.tags.join(', ')}
                          onChange={(e) => setReviewData(prev => ({
                            ...prev,
                            tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                          }))}
                        />
                      </div>
                      
                      <Button variant="outline" size="sm" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Add photo/video
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Audio playback */}
              {audioUrl && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Your recording</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (audioRef.current) {
                            if (isPlaying) {
                              audioRef.current.pause()
                            } else {
                              audioRef.current.play()
                            }
                            setIsPlaying(!isPlaying)
                          }
                        }}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {formatTime(recordingTime)}
                      </span>
                    </div>
                  </div>
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full"
                  />
                </div>
              )}

              {/* Transcript */}
              <div className="space-y-2">
                <Label htmlFor="content">Transcript</Label>
                <Textarea
                  id="content"
                  value={reviewData.content}
                  onChange={(e) => setReviewData(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  placeholder="Your transcribed story will appear here..."
                />
                {confidence > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Confidence: {Math.round(confidence * 100)}%
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isLoading || !reviewData.title.trim()}
                className="gap-2"
              >
                {isDrafting && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Draft
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isLoading || !reviewData.title.trim()}
                className="gap-2 flex-1"
              >
                {isPublishing && <Loader2 className="h-4 w-4 animate-spin" />}
                Publish Story
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}