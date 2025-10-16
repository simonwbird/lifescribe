import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface VoiceReplyButtonProps {
  storyId: string
  familyId: string
  onReplySent: () => void
}

export function VoiceReplyButton({ storyId, familyId, onReplySent }: VoiceReplyButtonProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  const MAX_RECORDING_TIME = 10000 // 10 seconds

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      stopRecording()
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
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
        await uploadVoiceReply(blob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const next = prev + 100
          if (next >= MAX_RECORDING_TIME) {
            stopRecording()
            return MAX_RECORDING_TIME
          }
          return next
        })
      }, 100)
      
      // Auto-stop after 10s
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording()
        }
      }, MAX_RECORDING_TIME)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record voice replies.",
        variant: "destructive"
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const uploadVoiceReply = async (blob: Blob) => {
    setIsUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // First create the comment to get its id
      const { data: insertedComment, error: commentInsertError } = await supabase
        .from('comments')
        .insert({
          story_id: storyId,
          family_id: familyId,
          profile_id: user.id,
          content: `[Voice message - ${(recordingTime / 1000).toFixed(1)}s]`
        })
        .select('id')
        .single()

      if (commentInsertError) throw commentInsertError

      // Upload to storage
      const fileName = `${storyId}-${Date.now()}.webm`
      const storagePath = `voice-replies/${fileName}`
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(storagePath, blob, {
          contentType: 'audio/webm',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Resolve a public URL for playback
      const { data: pub } = supabase.storage
        .from('media')
        .getPublicUrl(storagePath)

      const publicUrl = pub?.publicUrl

      // Create an audio_recordings row linked to this comment via draft_data
      if (publicUrl) {
        await supabase
          .from('audio_recordings')
          .insert({
            story_id: storyId,
            family_id: familyId,
            created_by: user.id,
            audio_url: publicUrl,
            duration_seconds: Math.round(recordingTime / 1000),
            is_draft: false,
            status: 'complete',
            draft_data: { comment_id: insertedComment.id }
          })
      }

      toast({
        title: "Voice reply sent! 🎤",
        description: "Your voice message has been posted."
      })
      
      onReplySent()
    } catch (error) {
      console.error('Error uploading voice reply:', error)
      toast({
        title: "Upload failed",
        description: "Unable to send voice reply. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      setRecordingTime(0)
    }
  }

  if (isUploading) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs">Sending...</span>
      </Button>
    )
  }

  if (isRecording) {
    return (
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={stopRecording}
        className="gap-2 animate-pulse"
      >
        <Square className="h-4 w-4" />
        <span className="text-xs font-mono">
          {(recordingTime / 1000).toFixed(1)}s
        </span>
      </Button>
    )
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={startRecording}
      className="gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
    >
      <Mic className="h-4 w-4" />
      <span className="text-xs">10s Reply</span>
    </Button>
  )
}
