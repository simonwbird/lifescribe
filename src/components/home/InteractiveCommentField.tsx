import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Send, 
  Camera, 
  Mic, 
  Image as ImageIcon, 
  Smile, 
  X,
  Paperclip,
  MicIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'

interface InteractiveCommentFieldProps {
  storyId: string
  familyId: string
  onCommentAdded?: (comment: any) => void
  placeholder?: string
  compact?: boolean
}

// Fun GIFs/stickers for reactions
const quickStickers = [
  { emoji: '👏', label: 'Applause' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Funny' },
  { emoji: '🥳', label: 'Celebrate' },
  { emoji: '🤗', label: 'Hug' },
  { emoji: '👍', label: 'Great!' },
  { emoji: '🔥', label: 'Amazing' },
  { emoji: '✨', label: 'Beautiful' },
]

export function InteractiveCommentField({
  storyId,
  familyId,
  onCommentAdded,
  placeholder = "Add a comment...",
  compact = false
}: InteractiveCommentFieldProps) {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)
  const [showStickers, setShowStickers] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [attachedMedia, setAttachedMedia] = useState<File[]>([])
  const [userProfile, setUserProfile] = useState<{ avatar_url?: string; full_name?: string } | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
    if (!comment.trim() && attachedMedia.length === 0) return

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
        toast({
          title: "Media attachments",
          description: "Media attachment feature coming soon!"
        })
      }

      // Reset form
      setComment('')
      setAttachedMedia([])
      setShowAttachments(false)
      setShowStickers(false)

      // Callback
      onCommentAdded?.(newComment)

      track('activity_clicked', {
        story_id: storyId,
        family_id: familyId,
        has_media: attachedMedia.length > 0
      })

      toast({
        title: "Comment added!",
        description: "Your comment has been shared with the family."
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
      story_id: storyId
    })
  }

  const handleMediaAttach = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachedMedia(prev => [...prev, ...files.slice(0, 3 - prev.length)])
    track('activity_clicked', {
      file_count: files.length,
      story_id: storyId
    })
  }

  const removeAttachment = (index: number) => {
    setAttachedMedia(prev => prev.filter((_, i) => i !== index))
  }

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setIsRecording(true)
      // Simplified - in real implementation would handle recording
      setTimeout(() => {
        setIsRecording(false)
        stream.getTracks().forEach(track => track.stop())
        toast({
          title: "Voice recording",
          description: "Voice recording feature coming soon!"
        })
      }, 1000)
    } catch (error) {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record voice comments.",
        variant: "destructive"
      })
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
        <Avatar className="h-8 w-8">
          <AvatarImage src={userProfile?.avatar_url || ''} />
          <AvatarFallback className="text-xs">
            {userProfile?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        <input
          type="text"
          placeholder={placeholder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="flex-1 bg-transparent border-none outline-none text-sm"
        />
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleSubmit}
          disabled={!comment.trim() || isSubmitting}
          className="h-8 w-8 p-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={userProfile?.avatar_url || ''} />
          <AvatarFallback className="text-xs">
            {userProfile?.full_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <Textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[60px] resize-none border-0 bg-muted/30 focus-visible:ring-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
          />
          
          {/* Attached Media Preview */}
          {attachedMedia.length > 0 && (
            <div className="flex gap-2">
              {attachedMedia.map((file, index) => (
                <div key={index} className="relative">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="w-6 h-6" />
                    ) : (
                      <Paperclip className="w-6 h-6" />
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowStickers(!showStickers)}
                className={cn("h-8 w-8 p-0", showStickers && "bg-primary/10")}
              >
                <Smile className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMediaAttach}
                className="h-8 w-8 p-0"
              >
                <Camera className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={startVoiceRecording}
                disabled={isRecording}
                className={cn("h-8 w-8 p-0", isRecording && "bg-red-100 text-red-600")}
              >
                <MicIcon className={cn("h-4 w-4", isRecording && "animate-pulse")} />
              </Button>
            </div>
            
            <Button 
              size="sm"
              onClick={handleSubmit}
              disabled={(!comment.trim() && attachedMedia.length === 0) || isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Comment
            </Button>
          </div>
        </div>
      </div>

      {/* Sticker Picker */}
      {showStickers && (
        <Card className="ml-11">
          <CardContent className="p-3">
            <div className="grid grid-cols-4 gap-2">
              {quickStickers.map((sticker) => (
                <Button
                  key={sticker.label}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStickerSelect(sticker)}
                  className="h-10 text-lg hover:bg-primary/10"
                  title={sticker.label}
                >
                  {sticker.emoji}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}