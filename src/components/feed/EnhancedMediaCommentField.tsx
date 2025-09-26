import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Camera, 
  Mic, 
  Image as ImageIcon, 
  Smile, 
  X,
  Paperclip,
  MicIcon,
  Video,
  Gift,
  Play,
  Pause,
  Volume2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'

interface EnhancedMediaCommentFieldProps {
  storyId: string
  familyId: string
  onCommentAdded?: (comment: any) => void
  placeholder?: string
  compact?: boolean
}

// Fun GIFs/stickers for reactions
const quickStickers = [
  { emoji: '👏', label: 'Applause', category: 'celebration' },
  { emoji: '❤️', label: 'Love', category: 'love' },
  { emoji: '😂', label: 'Funny', category: 'emotion' },
  { emoji: '🥳', label: 'Celebrate', category: 'celebration' },
  { emoji: '🤗', label: 'Hug', category: 'love' },
  { emoji: '👍', label: 'Great!', category: 'approval' },
  { emoji: '🔥', label: 'Amazing', category: 'approval' },
  { emoji: '✨', label: 'Beautiful', category: 'celebration' },
  { emoji: '🎉', label: 'Party', category: 'celebration' },
  { emoji: '💪', label: 'Strong', category: 'approval' },
  { emoji: '🌈', label: 'Wonderful', category: 'celebration' },
  { emoji: '🤯', label: 'Mind Blown', category: 'emotion' },
]

// Popular GIF categories (simplified for demo)
const gifCategories = [
  { name: 'Happy', emoji: '😊', keywords: ['happy', 'joy', 'smile'] },
  { name: 'Love', emoji: '❤️', keywords: ['love', 'heart', 'kiss'] },
  { name: 'Funny', emoji: '😂', keywords: ['funny', 'laugh', 'lol'] },
  { name: 'Celebration', emoji: '🎉', keywords: ['celebrate', 'party', 'dance'] },
  { name: 'Animals', emoji: '🐱', keywords: ['cat', 'dog', 'cute'] },
  { name: 'Reaction', emoji: '🤯', keywords: ['wow', 'omg', 'shocked'] },
]

export function EnhancedMediaCommentField({
  storyId,
  familyId,
  onCommentAdded,
  placeholder = "Add a comment with photos, audio, or GIFs...",
  compact = false
}: EnhancedMediaCommentFieldProps) {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [attachedMedia, setAttachedMedia] = useState<File[]>([])
  const [userProfile, setUserProfile] = useState<{ avatar_url?: string; full_name?: string } | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const { track } = useAnalytics()

  // Load user profile
  useState(() => {
    const getUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url, full_name')
          .eq('id', user.id)
          .single()
        if (profile) setUserProfile(profile)
      }
    }
    getUserProfile()
  })

  const handleSubmit = async () => {
    if (!comment.trim() && attachedMedia.length === 0 && !audioBlob) return

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create comment
      const { data: newComment, error } = await supabase
        .from('comments')
        .insert({
          family_id: familyId,
          story_id: storyId,
          profile_id: user.id,
          content: comment.trim()
        })
        .select('*')
        .single()

      if (error) throw error

      // Handle media attachments (simplified for demo)
      if (attachedMedia.length > 0) {
        track('activity_clicked', {
          storyId,
          familyId,
          mediaCount: attachedMedia.length,
          mediaTypes: attachedMedia.map(f => f.type.split('/')[0])
        })
      }

      // Handle audio attachment
      if (audioBlob) {
        track('activity_clicked', {
          storyId,
          familyId,
          duration: recordingTime
        })
      }

      // Reset form
      setComment('')
      setAttachedMedia([])
      setAudioBlob(null)
      setRecordingTime(0)
      setShowAttachments(false)
      setShowStickers(false)
      setShowGifPicker(false)

      // Callback
      onCommentAdded?.(newComment)

      track('activity_clicked', {
        storyId,
        familyId,
        hasMedia: attachedMedia.length > 0,
        hasAudio: !!audioBlob,
        hasStickers: comment.includes('👏') || comment.includes('❤️') || comment.includes('😂')
      })

      toast({
        title: "✨ Comment added!",
        description: "Your enhanced comment has been shared with the family.",
      })

    } catch (error) {
      console.error('Failed to create comment:', error)
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStickerSelect = (sticker: typeof quickStickers[0]) => {
    setComment(prev => prev + sticker.emoji + ' ')
    setShowStickers(false)
    textareaRef.current?.focus()
    
    track('activity_clicked', {
      sticker: sticker.label,
      category: sticker.category,
      storyId
    })
  }

  const handleMediaAttach = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => {
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      const isValidType = file.type.startsWith('image/') || 
                         file.type.startsWith('video/') || 
                         file.type.startsWith('audio/') ||
                         file.type === 'image/gif'
      return isValidSize && isValidType
    })
    
    setAttachedMedia(prev => [...prev, ...validFiles.slice(0, 5 - prev.length)])
    
    track('activity_clicked', {
      fileCount: validFiles.length,
      totalSize: validFiles.reduce((sum, file) => sum + file.size, 0),
      storyId
    })

    if (files.length !== validFiles.length) {
      toast({
        title: "Some files were skipped",
        description: "Only images, videos, GIFs and audio files under 10MB are supported.",
        variant: "destructive"
      })
    }
  }

  const removeAttachment = (index: number) => {
    setAttachedMedia(prev => prev.filter((_, i) => i !== index))
  }

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      track('activity_clicked', { storyId })
      
    } catch (error) {
      toast({
        title: "🎤 Microphone access needed",
        description: "Please allow microphone access to record voice comments.",
        variant: "destructive"
      })
    }
  }

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      
      track('activity_clicked', { 
        storyId, 
        duration: recordingTime 
      })
      
      toast({
        title: "🎤 Voice recorded!",
        description: `${recordingTime}s audio ready to share`,
      })
    }
  }

  const playAudio = () => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob))
      setIsPlayingAudio(true)
      audio.play()
      audio.onended = () => setIsPlayingAudio(false)
    }
  }

  const handleGifSelect = (gifUrl: string) => {
    // In a real implementation, this would add the GIF to attachments
    setComment(prev => prev + ` [GIF: ${gifUrl}] `)
    setShowGifPicker(false)
    
    track('activity_clicked', {
      storyId,
      gifUrl
    })
    
    toast({
      title: "🎬 GIF added!",
      description: "Your animated reaction has been added to the comment.",
    })
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border border-muted/50">
        <Avatar className="h-8 w-8">
          <AvatarImage src={userProfile?.avatar_url || ''} />
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {userProfile?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <input
          type="text"
          placeholder={placeholder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/70"
        />
        <div className="flex items-center gap-1">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowStickers(!showStickers)}
            className="h-8 w-8 p-0 hover:bg-primary/10"
          >
            <Smile className="h-4 w-4 text-primary" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleMediaAttach}
            className="h-8 w-8 p-0 hover:bg-primary/10"
          >
            <Camera className="h-4 w-4 text-primary" />
          </Button>
          <Button 
            size="sm" 
            variant="default"
            onClick={handleSubmit}
            disabled={!comment.trim() || isSubmitting}
            className="h-8 px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 mt-1 ring-2 ring-primary/20">
          <AvatarImage src={userProfile?.avatar_url || ''} />
          <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
            {userProfile?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-3">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px] resize-none border-2 border-muted/50 bg-gradient-to-br from-background to-muted/20 focus-visible:ring-2 focus-visible:ring-primary/50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          
          {/* Audio Recording Preview */}
          {audioBlob && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 animate-fade-in">
              <Button
                size="sm"
                variant="ghost"
                onClick={playAudio}
                disabled={isPlayingAudio}
                className="h-10 w-10 p-0 rounded-full bg-blue-100 hover:bg-blue-200"
              >
                {isPlayingAudio ? (
                  <Pause className="h-5 w-5 text-blue-600" />
                ) : (
                  <Play className="h-5 w-5 text-blue-600" />
                )}
              </Button>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-blue-800">🎤 Voice Recording</span>
                  <span className="text-blue-600">{recordingTime}s</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                  <div className="bg-blue-500 rounded-full h-2 w-1/3" />
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAudioBlob(null)}
                className="h-6 w-6 p-0 text-blue-600 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Attached Media Preview */}
          {attachedMedia.length > 0 && (
            <div className="flex gap-2 flex-wrap animate-fade-in">
              {attachedMedia.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center border-2 border-muted/50 overflow-hidden">
                    {file.type.startsWith('image/') ? (
                      <div className="flex flex-col items-center gap-1">
                        <ImageIcon className="w-6 h-6 text-primary" />
                        {file.type === 'image/gif' && (
                          <Badge variant="secondary" className="text-xs">GIF</Badge>
                        )}
                      </div>
                    ) : file.type.startsWith('video/') ? (
                      <div className="flex flex-col items-center gap-1">
                        <Video className="w-6 h-6 text-green-600" />
                        <Badge variant="secondary" className="text-xs">VIDEO</Badge>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Volume2 className="w-6 h-6 text-blue-600" />
                        <Badge variant="secondary" className="text-xs">AUDIO</Badge>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* Enhanced Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowStickers(!showStickers)}
                className={cn(
                  "h-9 px-3 border-2 border-dashed border-muted hover:border-primary transition-all",
                  showStickers && "bg-primary/10 border-primary"
                )}
              >
                <Smile className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Stickers</span>
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMediaAttach}
                className="h-9 px-3 border-2 border-dashed border-muted hover:border-primary transition-all"
              >
                <Camera className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Photo/Video</span>
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowGifPicker(!showGifPicker)}
                className={cn(
                  "h-9 px-3 border-2 border-dashed border-muted hover:border-primary transition-all",
                  showGifPicker && "bg-primary/10 border-primary"
                )}
              >
                <Gift className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">GIFs</span>
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                disabled={!!audioBlob}
                className={cn(
                  "h-9 px-3 border-2 border-dashed border-muted hover:border-primary transition-all",
                  isRecording && "bg-red-100 border-red-300 text-red-600 animate-pulse"
                )}
              >
                <MicIcon className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">
                  {isRecording ? `Recording ${recordingTime}s` : 'Voice'}
                </span>
              </Button>
            </div>
            
            <Button 
              size="sm"
              onClick={handleSubmit}
              disabled={(!comment.trim() && attachedMedia.length === 0 && !audioBlob) || isSubmitting}
              className="flex items-center gap-2 h-9 px-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Share Comment
            </Button>
          </div>
        </div>
      </div>

      {/* Sticker Picker */}
      {showStickers && (
        <Card className="ml-13 animate-fade-in">
          <CardContent className="p-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Express yourself with stickers!</h4>
              <div className="grid grid-cols-6 gap-2">
                {quickStickers.map((sticker) => (
                  <Button
                    key={sticker.label}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStickerSelect(sticker)}
                    className="h-12 text-2xl hover:bg-primary/10 hover:scale-110 transition-all"
                    title={sticker.label}
                  >
                    {sticker.emoji}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GIF Picker */}
      {showGifPicker && (
        <Card className="ml-13 animate-fade-in">
          <CardContent className="p-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Add animated GIFs!</h4>
              <div className="grid grid-cols-3 gap-3">
                {gifCategories.map((category) => (
                  <Button
                    key={category.name}
                    variant="outline"
                    onClick={() => handleGifSelect(`https://example.com/gif/${category.name.toLowerCase()}`)}
                    className="flex flex-col items-center gap-2 h-auto p-4 hover:bg-primary/10 transition-all"
                  >
                    <span className="text-2xl">{category.emoji}</span>
                    <span className="text-sm font-medium">{category.name}</span>
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Coming soon: Full GIF search powered by GIPHY
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*,.gif"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}