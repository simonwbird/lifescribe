import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, Square, Play, Pause, Trash2, Edit2, Save, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { Textarea } from '@/components/ui/textarea'

interface AudioNoteProps {
  familyId: string
  storyId?: string
  tributeId?: string
  onTranscriptSaved?: (transcript: string, audioUrl: string) => void
}

export function AudioNote({ familyId, storyId, tributeId, onTranscriptSaved }: AudioNoteProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isEditingTranscript, setIsEditingTranscript] = useState(false)
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [draftId, setDraftId] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  const { toast } = useToast()
  const MAX_RECORDING_TIME = 120 // 2 minutes

  useEffect(() => {
    // Check mic permission on mount
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then(result => {
      setMicPermission(result.state as any)
    })

    // Load draft if exists
    loadDraft()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Auto-save draft every 5 seconds while recording
  useEffect(() => {
    if (isRecording && audioChunksRef.current.length > 0) {
      const autoSaveInterval = setInterval(() => {
        saveDraft()
      }, 5000)
      return () => clearInterval(autoSaveInterval)
    }
  }, [isRecording])

  const loadDraft = async () => {
    try {
      const { data, error } = await supabase
        .from('audio_recordings')
        .select('*')
        .eq('family_id', familyId)
        .eq('is_draft', true)
        .eq('created_by', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle()

      if (data) {
        setDraftId(data.id)
        if (data.audio_url) setAudioUrl(data.audio_url)
        if (data.transcript) setTranscript(data.transcript)
      }
    } catch (error) {
      console.error('Error loading draft:', error)
    }
  }

  const saveDraft = async () => {
    if (audioChunksRef.current.length === 0) return

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const fileName = `${familyId}/${Date.now()}.webm`
      
      const { error: uploadError } = await supabase.storage
        .from('audio-recordings')
        .upload(fileName, audioBlob, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('audio-recordings')
        .getPublicUrl(fileName)

      const user = await supabase.auth.getUser()
      
      if (draftId) {
        await supabase
          .from('audio_recordings')
          .update({
            audio_url: publicUrl,
            duration_seconds: recordingTime,
            updated_at: new Date().toISOString()
          })
          .eq('id', draftId)
      } else {
        const { data } = await supabase
          .from('audio_recordings')
          .insert({
            family_id: familyId,
            created_by: user.data.user?.id,
            story_id: storyId,
            tribute_id: tributeId,
            audio_url: publicUrl,
            duration_seconds: recordingTime,
            is_draft: true,
            status: 'processing'
          })
          .select()
          .single()

        if (data) setDraftId(data.id)
      }
    } catch (error) {
      console.error('Error saving draft:', error)
    }
  }

  const startCountdown = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      setMicPermission('granted')
      
      // Start 3-second countdown
      setCountdown(3)
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            startRecording(stream)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      console.error('Mic access error:', error)
      setMicPermission('denied')
      toast({
        title: "Microphone access denied",
        description: "Please enable microphone access to record audio notes",
        variant: "destructive"
      })
    }
  }

  const startRecording = (stream: MediaStream) => {
    audioChunksRef.current = []
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop())
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
    }

    mediaRecorder.start(1000) // Capture data every second
    setIsRecording(true)
    setRecordingTime(0)

    timerRef.current = window.setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= MAX_RECORDING_TIME) {
          stopRecording()
          return prev
        }
        return prev + 1
      })
    }, 1000)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      
      // Transcribe after stopping
      transcribeAudio()
    }
  }

  const transcribeAudio = async () => {
    if (audioChunksRef.current.length === 0) return

    setIsTranscribing(true)
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const reader = new FileReader()
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1]
        
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { audio: base64Audio, recordingId: draftId }
        })

        if (error) throw error

        setTranscript(data.text)
        toast({
          title: "Transcription complete",
          description: "Your audio has been transcribed successfully"
        })
      }
      
      reader.readAsDataURL(audioBlob)
    } catch (error) {
      console.error('Transcription error:', error)
      toast({
        title: "Transcription failed",
        description: "Please try again or type manually",
        variant: "destructive"
      })
    } finally {
      setIsTranscribing(false)
    }
  }

  const playAudio = () => {
    if (!audioUrl) return
    
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => setIsPlaying(false)
    }
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const saveTranscript = async () => {
    if (!draftId || !transcript) return

    try {
      // Create version
      const { data: versions } = await supabase
        .from('transcript_versions')
        .select('version_number')
        .eq('audio_recording_id', draftId)
        .order('version_number', { ascending: false })
        .limit(1)

      const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1

      const user = await supabase.auth.getUser()
      await supabase
        .from('transcript_versions')
        .insert({
          audio_recording_id: draftId,
          version_number: nextVersion,
          transcript,
          edited_by: user.data.user?.id
        })

      // Update main record
      await supabase
        .from('audio_recordings')
        .update({
          transcript,
          is_draft: false,
          status: 'completed'
        })
        .eq('id', draftId)

      toast({
        title: "Transcript saved",
        description: "Your audio note has been saved successfully"
      })

      if (onTranscriptSaved && audioUrl) {
        onTranscriptSaved(transcript, audioUrl)
      }

      setIsEditingTranscript(false)
    } catch (error) {
      console.error('Error saving transcript:', error)
      toast({
        title: "Save failed",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  const discardRecording = () => {
    setAudioUrl(null)
    setTranscript('')
    setRecordingTime(0)
    audioChunksRef.current = []
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (micPermission === 'denied') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Microphone access is required for audio notes
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Recording controls */}
          {!audioUrl && (
            <div className="text-center">
              {countdown > 0 ? (
                <div className="text-6xl font-bold text-primary animate-pulse">
                  {countdown}
                </div>
              ) : isRecording ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-2xl font-mono">{formatTime(recordingTime)}</span>
                  </div>
                  
                  {/* Waveform placeholder */}
                  <div className="flex items-center justify-center gap-1 h-16">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-primary rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 100}%`,
                          animationDelay: `${i * 50}ms`
                        }}
                      />
                    ))}
                  </div>

                  <Button onClick={stopRecording} variant="destructive" size="lg">
                    <Square className="h-5 w-5 mr-2" />
                    Stop Recording
                  </Button>
                  
                  {recordingTime >= MAX_RECORDING_TIME - 10 && (
                    <p className="text-sm text-muted-foreground">
                      {MAX_RECORDING_TIME - recordingTime}s remaining
                    </p>
                  )}
                </div>
              ) : (
                <Button onClick={startCountdown} size="lg">
                  <Mic className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              )}
            </div>
          )}

          {/* Playback and transcript */}
          {audioUrl && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button onClick={playAudio} variant="outline">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {formatTime(recordingTime)}
                </span>
                <Button onClick={discardRecording} variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {isTranscribing ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Transcribing...</p>
                </div>
              ) : transcript ? (
                <div className="space-y-2">
                  {isEditingTranscript ? (
                    <>
                      <Textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        rows={6}
                        className="w-full"
                      />
                      <div className="flex gap-2">
                        <Button onClick={saveTranscript} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button 
                          onClick={() => setIsEditingTranscript(false)} 
                          variant="ghost" 
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap">{transcript}</p>
                      <Button 
                        onClick={() => setIsEditingTranscript(true)} 
                        variant="outline" 
                        size="sm"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Transcript
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
