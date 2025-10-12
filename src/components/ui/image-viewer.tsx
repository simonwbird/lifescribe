import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, ZoomIn, ZoomOut, RotateCw, Download, MessageCircle, Send, Loader2 } from 'lucide-react'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { VisualPhotoTagger } from '@/components/media/VisualPhotoTagger'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useWriteProtection } from '@/hooks/useWriteProtection'

interface ImageViewerProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  imageAlt?: string
  title?: string
  mediaId?: string
  familyId?: string
  storyId?: string
}

interface PhotoTag {
  id: string
  person_name: string
  position_x: number
  position_y: number
  position_width?: number
  position_height?: number
}

export function ImageViewer({ isOpen, onClose, imageUrl, imageAlt, title, mediaId, familyId, storyId }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [showSidebar, setShowSidebar] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [tags, setTags] = useState<PhotoTag[]>([])
  const { checkWritePermission } = useWriteProtection()

  // Fetch tags when media changes
  useEffect(() => {
    if (mediaId && isOpen) {
      fetchTags()
    }
  }, [mediaId, isOpen])

  // Fetch comments when story changes
  useEffect(() => {
    if (storyId && isOpen) {
      fetchComments()
      getUser()
    }
  }, [storyId, isOpen])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = title || 'image'
    link.click()
  }

  const handleClose = () => {
    handleReset()
    setShowSidebar(false)
    onClose()
  }

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)
  }

  const fetchComments = async () => {
    if (!storyId) return
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          profile_id,
          profiles:profile_id (
            full_name,
            avatar_url
          )
        `)
        .eq('story_id', storyId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUserId || !storyId || !familyId) return
    if (!checkWritePermission('add_comment')) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          story_id: storyId,
          family_id: familyId,
          profile_id: currentUserId,
          content: newComment.trim()
        })

      if (error) throw error

      setNewComment('')
      await fetchComments()
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted'
      })
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const fetchTags = async () => {
    if (!mediaId) return
    
    try {
      const { data, error } = await supabase
        .from('entity_links')
        .select(`
          id,
          entity_id,
          position_x,
          position_y,
          position_width,
          position_height
        `)
        .eq('source_type', 'media')
        .eq('source_id', mediaId)
        .eq('entity_type', 'person')

      if (error) throw error

      if (data && data.length > 0) {
        const personIds = data.map(link => link.entity_id)
        const { data: peopleData, error: peopleError } = await supabase
          .from('people')
          .select('id, full_name')
          .in('id', personIds)

        if (peopleError) throw peopleError

        const peopleMap = new Map(peopleData?.map(p => [p.id, p.full_name]))

        setTags(data.map(link => ({
          id: link.id,
          person_name: peopleMap.get(link.entity_id) || 'Unknown',
          position_x: link.position_x || 0,
          position_y: link.position_y || 0,
          position_width: link.position_width,
          position_height: link.position_height
        })).filter(tag => tag.position_x !== null && tag.position_y !== null))
      } else {
        setTags([])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  }

  const hasSidebarFeatures = mediaId && familyId

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/90 border-0 flex">
        {/* Main Image Area */}
        <div className="flex-1 relative">
        <VisuallyHidden>
          <DialogTitle>{title || 'Image Viewer'}</DialogTitle>
        </VisuallyHidden>
        
          {/* Controls Bar */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm rounded-lg p-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 0.25}
                className="text-white hover:bg-white/20"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <span className="text-white text-sm min-w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="text-white hover:bg-white/20"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <div className="w-px h-6 bg-white/20 mx-1" />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRotate}
                className="text-white hover:bg-white/20"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="text-white hover:bg-white/20"
              >
                <Download className="h-4 w-4" />
              </Button>

              {hasSidebarFeatures && (
                <>
                  <div className="w-px h-6 bg-white/20 mx-1" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="text-white hover:bg-white/20"
                  >
                    {showSidebar ? <X className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Image Container with Tags */}
          <div className="flex items-center justify-center w-full h-full p-8 overflow-auto">
            <div className="relative inline-block">
              <img
                src={imageUrl}
                alt={imageAlt || 'Viewing image'}
                className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
                draggable={false}
                onError={(e) => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = '/placeholder.svg'
                }}
              />
              
              {/* Visual Tags Overlay */}
              {mediaId && familyId && tags.length > 0 && (
                <>
                  {tags.map(tag => (
                    <div
                      key={tag.id}
                      className="absolute transition-opacity"
                      style={{
                        left: `${tag.position_x}%`,
                        top: `${tag.position_y}%`,
                        width: tag.position_width ? `${tag.position_width}%` : 'auto',
                        height: tag.position_height ? `${tag.position_height}%` : 'auto',
                        transform: `translate(-50%, -50%) scale(${zoom}) rotate(${rotation}deg)`,
                        pointerEvents: 'none'
                      }}
                    >
                      {/* Tag box */}
                      <div 
                        className="absolute inset-0 border-2 border-white rounded shadow-lg"
                        style={{
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.5)',
                        }}
                      />
                      
                      {/* Tag label - always visible in viewer */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-10">
                        <div className="bg-black/80 text-white px-2 py-1 rounded text-sm whitespace-nowrap shadow-lg">
                          {tag.person_name}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Title Bar */}
          {title && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
              <p className="text-white text-sm font-medium max-w-md truncate">
                {title}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar for Tagging & Comments */}
        {showSidebar && hasSidebarFeatures && (
          <div className="w-96 bg-background border-l flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {/* Photo Tagging Section */}
                {mediaId && familyId && imageUrl && (
                  <div>
                    <h3 className="font-semibold mb-3">Tag People</h3>
                    <VisualPhotoTagger
                      mediaId={mediaId}
                      familyId={familyId}
                      imageUrl={imageUrl}
                      className="max-h-[60vh]"
                      onTagsUpdated={fetchTags}
                    />
                  </div>
                )}

                {/* Comments Section */}
                {storyId && familyId && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Comments ({comments.length})
                    </h3>
                    
                    {/* Comments List */}
                    <div className="space-y-4 mb-4">
                      {comments.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4 text-sm">
                          No comments yet
                        </p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              {comment.profiles?.avatar_url && (
                                <AvatarImage src={comment.profiles.avatar_url} />
                              )}
                              <AvatarFallback className="text-xs">
                                {getInitials(comment.profiles?.full_name || 'User')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">
                                  {comment.profiles?.full_name || 'Unknown User'}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(comment.created_at), {
                                    addSuffix: true
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Comment Input */}
                    {currentUserId && (
                      <div className="space-y-2 border-t pt-4">
                        <Textarea
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                          disabled={submitting}
                        />
                        <div className="flex justify-end">
                          <Button 
                            onClick={handleSubmitComment}
                            disabled={!newComment.trim() || submitting}
                            size="sm"
                          >
                            {submitting ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Send className="h-4 w-4 mr-2" />
                            )}
                            Post Comment
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}