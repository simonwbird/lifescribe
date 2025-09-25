import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Camera, Mic, Image, Video, X, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { uploadMediaFile } from '@/lib/media'
import { formatForUser, getCurrentUserRegion } from '@/utils/date'
import EnhancedReactionBar from './EnhancedReactionBar'
import type { Comment, Profile } from '@/lib/types'

interface MediaComment extends Comment {
  profiles: Profile
  media_attachments?: Array<{
    id: string
    file_path: string
    mime_type: string
    file_name: string
  }>
}

interface MediaCommentThreadProps {
  targetType: 'story' | 'answer'
  targetId: string
  familyId: string
}

export default function MediaCommentThread({ targetType, targetId, familyId }: MediaCommentThreadProps) {
  const [comments, setComments] = useState<MediaComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const { toast } = useToast()

  useEffect(() => {
    const getComments = async () => {
      const column = `${targetType}_id`
      const { data: commentsData } = await (supabase as any)
        .from('comments')
        .select('*')
        .eq(column, targetId)
        .eq('family_id', familyId)
        .order('created_at')

      if (commentsData) {
        // Fetch family member profiles separately for comments 
        const profileIds = [...new Set(commentsData.map((c: any) => c.profile_id))]
        const { data: profilesData } = await supabase
          .rpc('get_family_member_safe_profiles')
        
        if (profilesData) {
          const filteredProfiles = profilesData.filter((p: any) => 
            profileIds.includes(p.id)
          )
        
          // Fetch comment media attachments using existing media table
          const commentIds = commentsData.map((c: any) => c.id)
          const { data: mediaData } = await supabase
            .from('media')
            .select('*')
            .in('comment_id', commentIds)
            .not('comment_id', 'is', null)
        
          // Combine the data
          const commentsWithProfiles = commentsData.map((comment: any) => ({
            ...comment,
            profiles: filteredProfiles?.find((p: any) => p.id === comment.profile_id) || {
              id: comment.profile_id,
              email: 'Unknown User',
              full_name: null,
              avatar_url: null,
              created_at: '',
              updated_at: ''
            },
            media_attachments: mediaData?.filter((m: any) => m.comment_id === comment.id) || []
          }))
          
          setComments(commentsWithProfiles)
        }
      }
    }

    if (showComments) {
      getComments()
    }
  }, [targetType, targetId, familyId, showComments])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: "Only images and videos are allowed",
          variant: "destructive"
        })
        return false
      }
      
      if (!isValidSize) {
        toast({
          title: "File too large",
          description: "Files must be under 10MB",
          variant: "destructive"
        })
        return false
      }
      
      return true
    })
    
    setAttachments(prev => [...prev, ...validFiles].slice(0, 3)) // Max 3 attachments
  }

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setRecordingBlob(blob)
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

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      toast({
        title: "Recording stopped",
        description: "Voice note ready to send",
      })
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const removeVoiceNote = () => {
    setRecordingBlob(null)
  }

  const playAudio = async (audioUrl: string, commentId: string) => {
    if (playingAudio === commentId) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setPlayingAudio(null)
    } else {
      // Start playing
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        audioRef.current.onended = () => setPlayingAudio(null)
        await audioRef.current.play()
        setPlayingAudio(commentId)
      }
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.trim() && attachments.length === 0 && !recordingBlob) {
      return
    }

    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const column = `${targetType}_id`
      
      // Create comment
      const { data: commentData } = await (supabase as any)
        .from('comments')
        .insert({
          [column]: targetId,
          profile_id: user.id,
          family_id: familyId,
          content: newComment.trim(),
        })
        .select('*')
        .single()
        
      if (commentData) {
        // Upload attachments if any
        const uploadedAttachments = []
        
        // Upload regular file attachments using existing media table
        for (const file of attachments) {
          const { path, error } = await uploadMediaFile(file, familyId, user.id)
          if (path && !error) {
            const { data: attachment } = await supabase
              .from('media')
              .insert({
                comment_id: commentData.id,
                family_id: familyId,
                profile_id: user.id,
                file_path: path,
                file_name: file.name,
                mime_type: file.type,
                file_size: file.size
              })
              .select('*')
              .single()
            
            if (attachment) uploadedAttachments.push(attachment)
          }
        }
        
        // Upload voice note using existing media table
        if (recordingBlob) {
          const voiceFile = new File([recordingBlob], `voice-${Date.now()}.webm`, { 
            type: 'audio/webm' 
          })
          const { path, error } = await uploadMediaFile(voiceFile, familyId, user.id)
          if (path && !error) {
            const { data: attachment } = await supabase
              .from('media')
              .insert({
                comment_id: commentData.id,
                family_id: familyId,
                profile_id: user.id,
                file_path: path,
                file_name: voiceFile.name,
                mime_type: voiceFile.type,
                file_size: voiceFile.size
              })
              .select('*')
              .single()
            
            if (attachment) uploadedAttachments.push(attachment)
          }
        }
        
        // Fetch the user's own profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        const newCommentWithProfile = {
          ...commentData,
          profiles: profileData || {
            id: user.id,
            email: user.email || 'Unknown User',
            full_name: null,
            avatar_url: null,
            created_at: '',
            updated_at: ''
          },
          media_attachments: uploadedAttachments
        }
        
        setComments(prev => [...prev, newCommentWithProfile])
        setNewComment('')
        setAttachments([])
        setRecordingBlob(null)
        
        toast({
          title: "Comment posted!",
          description: "Your comment has been shared with the family",
        })
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: "Failed to post comment",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="flex items-center space-x-2"
      >
        <MessageCircle className="h-4 w-4" />
        <span>
          {comments.length > 0 
            ? `${comments.length} comment${comments.length !== 1 ? 's' : ''}`
            : 'Add comment'
          }
        </span>
      </Button>

      {showComments && (
        <div className="space-y-3 pl-4 border-l-2 border-primary/20">
          {/* Existing comments */}
          {comments.map((comment) => (
            <Card key={comment.id} className="bg-muted/50">
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={comment.profiles.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {comment.profiles.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {comment.profiles.full_name || 'User'}
                  </span>
                   <span className="text-xs text-muted-foreground">
                     {formatForUser(comment.created_at, 'relative', getCurrentUserRegion())}
                   </span>
                </div>
                
                {comment.content && (
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                )}
                
                {/* Media attachments */}
                {comment.media_attachments && comment.media_attachments.length > 0 && (
                  <div className="space-y-2">
                    {comment.media_attachments.map((attachment) => (
                      <div key={attachment.id} className="relative">
                        {attachment.mime_type.startsWith('image/') && (
                          <img
                            src={attachment.file_path}
                            alt={attachment.file_name}
                            className="rounded-lg max-w-xs max-h-48 object-cover"
                          />
                        )}
                        {attachment.mime_type.startsWith('video/') && (
                          <video
                            src={attachment.file_path}
                            controls
                            className="rounded-lg max-w-xs max-h-48"
                          />
                        )}
                        {attachment.mime_type.startsWith('audio/') && (
                          <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => playAudio(attachment.file_path, comment.id)}
                              className="h-8 w-8 p-0"
                            >
                              {playingAudio === comment.id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                            <span className="text-xs text-muted-foreground">Voice message</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <EnhancedReactionBar 
                  targetType="comment" 
                  targetId={comment.id}
                  familyId={familyId}
                  compact
                />
              </CardContent>
            </Card>
          ))}

          {/* Comment input form */}
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
            />
            
            {/* Attachment previews */}
            {(attachments.length > 0 || recordingBlob) && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 flex-1">
                      {file.type.startsWith('image/') && <Image className="w-4 h-4" />}
                      {file.type.startsWith('video/') && <Video className="w-4 h-4" />}
                      <span className="text-sm truncate">{file.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                
                {recordingBlob && (
                  <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg">
                    <Mic className="w-4 h-4" />
                    <span className="text-sm">Voice message ready</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeVoiceNote}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 w-8 p-0"
                  title="Add photo or video"
                >
                  <Camera className="w-4 h-4" />
                </Button>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  className={cn(
                    "h-8 w-8 p-0",
                    isRecording && "bg-red-100 text-red-600 animate-pulse"
                  )}
                  title={isRecording ? "Stop recording" : "Record voice note"}
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
              
              <Button 
                type="submit" 
                size="sm" 
                disabled={loading || (!newComment.trim() && attachments.length === 0 && !recordingBlob)}
              >
                {loading ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {/* Hidden audio element for playback */}
      <audio ref={audioRef} />
    </div>
  )
}
