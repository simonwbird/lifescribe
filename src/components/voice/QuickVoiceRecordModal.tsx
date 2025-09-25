import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mic, Square, Play, Pause, Send, Trash2, Zap } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface QuickVoiceRecordModalProps {
  open: boolean
  onClose: () => void
  onStoryCreated?: (storyId: string) => void
}

export default function QuickVoiceRecordModal({ 
  open, 
  onClose, 
  onStoryCreated 
}: QuickVoiceRecordModalProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const { track } = useAnalytics()
  const { toast } = useToast()

  useEffect(() => {
    if (isRecording && timerRef.current === null) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else if (!isRecording && timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      
      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType })
        setRecordedBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      track('voice_capture_start')
    } catch (error) {
      console.error('Failed to start recording:', error)
      toast({
        title: 'Recording Failed',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive'
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      track('voice_capture_stop')
    }
  }

  const playRecording = () => {
    if (recordedBlob && !isPlaying) {
      const url = URL.createObjectURL(recordedBlob)
      audioRef.current = new Audio(url)
      audioRef.current.play()
      audioRef.current.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(url)
      }
      setIsPlaying(true)
      track('voice_capture_start')
    } else if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const deleteRecording = () => {
    setRecordedBlob(null)
    setRecordingTime(0)
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
    track('voice_capture_stop')
  }

  const uploadAndCreateStory = async () => {
    if (!recordedBlob) return

    setIsUploading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload audio file
      const fileName = `quick-voice-${Date.now()}.webm`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(`audio/${fileName}`, recordedBlob)

      if (uploadError) throw uploadError

      // Get user's family
      const { data: memberData } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .limit(1)
        .single()

      if (!memberData) throw new Error('No family found')

      // Create story with audio
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: `Quick Voice Recording - ${new Date().toLocaleDateString()}`,
          content: 'Audio story created via quick recording',
          family_id: memberData.family_id,
          profile_id: user.id,
          story_type: 'voice'
        })
        .select()
        .single()

      if (storyError) throw storyError

      // Create media record
      await supabase.from('media').insert({
        story_id: storyData.id,
        family_id: memberData.family_id,
        file_path: uploadData.path,
        file_name: fileName,
        mime_type: 'audio/webm',
        file_size: recordedBlob.size,
        profile_id: user.id
      })

      track('voice_story_published')

      toast({
        title: 'Voice Story Created!',
        description: 'Your quick recording has been saved as a story.',
      })

      onStoryCreated?.(storyData.id)
      onClose()
      
    } catch (error) {
      console.error('Failed to create story:', error)
      toast({
        title: 'Upload Failed',
        description: 'Could not save your recording. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleClose = () => {
    if (isRecording) stopRecording()
    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
    setRecordedBlob(null)
    setRecordingTime(0)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="relative">
              <Mic className="h-5 w-5" />
              <Zap className="h-3 w-3 absolute -top-1 -right-1 text-yellow-500" />
            </div>
            Quick Voice Recording
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Recording Status */}
          <div className="text-center">
            {isRecording && (
              <div className="flex items-center justify-center gap-2 text-red-600">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
              </div>
            )}
            {recordedBlob && !isRecording && (
              <Badge variant="secondary" className="text-sm">
                Recording ready • {formatTime(recordingTime)}
              </Badge>
            )}
          </div>

          {/* Main Action Button */}
          <div className="flex justify-center">
            {!recordedBlob && !isRecording && (
              <Button
                size="lg"
                onClick={startRecording}
                className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
              >
                <Mic className="h-8 w-8" />
              </Button>
            )}

            {isRecording && (
              <Button
                size="lg"
                onClick={stopRecording}
                className="w-20 h-20 rounded-full bg-gray-600 hover:bg-gray-700 text-white shadow-lg"
              >
                <Square className="h-8 w-8" />
              </Button>
            )}

            {recordedBlob && !isRecording && (
              <div className="flex items-center gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={playRecording}
                  className="w-16 h-16 rounded-full"
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={deleteRecording}
                  className="w-16 h-16 rounded-full text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-6 w-6" />
                </Button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {recordedBlob && !isRecording && (
            <div className="flex gap-2">
              <Button
                onClick={uploadAndCreateStory}
                disabled={isUploading}
                className="flex-1 gap-2"
              >
                <Send className="h-4 w-4" />
                {isUploading ? 'Saving...' : 'Save as Story'}
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>🎤 Tap the red button to start recording</p>
            <p>⏹️ Tap the square to stop • ▶️ Play to review • 🗑️ Delete to retry</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}