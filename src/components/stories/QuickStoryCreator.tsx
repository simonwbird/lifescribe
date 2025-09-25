import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Camera, Video, Mic, X, Play, Pause, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { uploadMediaFile } from '@/lib/media'
import { cn } from '@/lib/utils'

interface QuickStoryCreatorProps {
  familyId: string
  onStoryCreated: () => void
  className?: string
}

type MediaType = 'photo' | 'video' | 'audio'

interface MediaPreview {
  type: MediaType
  file?: File
  url?: string
  duration?: number
}

export default function QuickStoryCreator({ familyId, onStoryCreated, className }: QuickStoryCreatorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mediaPreview, setMediaPreview] = useState<MediaPreview | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const { toast } = useToast()

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be under 10MB",
        variant: "destructive"
      })
      return
    }

    setMediaPreview({
      type: 'photo',
      file,
      url: URL.createObjectURL(file)
    })
  }

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file",
        variant: "destructive"
      })
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be under 50MB",
        variant: "destructive"
      })
      return
    }

    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.src = url
    video.onloadedmetadata = () => {
      setMediaPreview({
        type: 'video',
        file,
        url,
        duration: video.duration
      })
    }
  }

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        
        setMediaPreview({
          type: 'audio',
          file: new File([blob], `audio-${Date.now()}.webm`, { type: 'audio/webm' }),
          url
        })
        
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)

      toast({
        title: "Recording started",
        description: "Tap the microphone again to stop",
      })
    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: "Recording failed",
        description: "Could not access microphone",
        variant: "destructive"
      })
    }
  }

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const toggleAudioPlayback = () => {
    if (!audioRef.current || mediaPreview?.type !== 'audio') return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.src = mediaPreview.url!
      audioRef.current.play()
      setIsPlaying(true)
      audioRef.current.onended = () => setIsPlaying(false)
    }
  }

  const removeMedia = () => {
    if (mediaPreview?.url) {
      URL.revokeObjectURL(mediaPreview.url)
    }
    setMediaPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() && !content.trim() && !mediaPreview) {
      toast({
        title: "Story is empty",
        description: "Please add a title, content, or media",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let mediaPath = null
      if (mediaPreview?.file) {
        const { path } = await uploadMediaFile(mediaPreview.file, familyId, user.id)
        mediaPath = path
      }

      // Create the story
      const { data: story, error } = await supabase
        .from('stories')
        .insert({
          title: title.trim() || 'Quick Story',
          content: content.trim(),
          profile_id: user.id,
          family_id: familyId,
          story_type: mediaPreview?.type === 'video' ? 'video' : 
                     mediaPreview?.type === 'audio' ? 'audio' :
                     mediaPreview?.type === 'photo' ? 'photo' : 'text'
        })
        .select()
        .single()

      if (error) throw error

      // Add media if exists
      if (mediaPath && mediaPreview?.file && story) {
        await supabase
          .from('media')
          .insert({
            story_id: story.id,
            family_id: familyId,
            profile_id: user.id,
            file_path: mediaPath,
            file_name: mediaPreview.file.name,
            mime_type: mediaPreview.file.type,
            file_size: mediaPreview.file.size
          })
      }

      toast({
        title: "Story created!",
        description: "Your story has been shared with the family",
      })

      // Reset form
      setTitle('')
      setContent('')
      removeMedia()
      onStoryCreated()

    } catch (error) {
      console.error('Error creating story:', error)
      toast({
        title: "Failed to create story",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="text-2xl">✨</span>
          Share a moment
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title input */}
          <Textarea
            placeholder="What's happening? Share your story..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
            className="resize-none"
          />

          {/* Content input */}
          <Textarea
            placeholder="Add more details (optional)..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none"
          />

          {/* Media preview */}
          {mediaPreview && (
            <div className="relative p-4 bg-muted rounded-lg">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeMedia}
                className="absolute top-2 right-2 h-6 w-6 p-0 z-10"
              >
                <X className="w-4 h-4" />
              </Button>

              {mediaPreview.type === 'photo' && (
                <img
                  src={mediaPreview.url}
                  alt="Story preview"
                  className="w-full h-48 object-cover rounded"
                />
              )}

              {mediaPreview.type === 'video' && (
                <div className="space-y-2">
                  <video
                    ref={videoRef}
                    src={mediaPreview.url}
                    controls
                    className="w-full h-48 object-cover rounded"
                  />
                  {mediaPreview.duration && (
                    <Badge variant="secondary">
                      {formatDuration(mediaPreview.duration)}
                    </Badge>
                  )}
                </div>
              )}

              {mediaPreview.type === 'audio' && (
                <div className="flex items-center gap-3 p-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleAudioPlayback}
                    className="h-10 w-10 p-0"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Audio recording</p>
                    <Badge variant="secondary">Ready to share</Badge>
                  </div>
                  <audio ref={audioRef} />
                </div>
              )}
            </div>
          )}

          {/* Media action buttons */}
          {!mediaPreview && (
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Photo
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                Video
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={isRecording ? stopAudioRecording : startAudioRecording}
                className={cn(
                  "flex items-center gap-2",
                  isRecording && "bg-red-500 text-white hover:bg-red-600"
                )}
              >
                <Mic className="w-4 h-4" />
                {isRecording ? 'Stop' : 'Voice'}
              </Button>
            </div>
          )}

          {/* Submit button */}
          <Button 
            type="submit" 
            disabled={loading || (!title.trim() && !content.trim() && !mediaPreview)}
            className="w-full"
          >
            {loading ? 'Sharing...' : 'Share Story'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}