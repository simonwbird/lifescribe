import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageCircle, 
  Camera, 
  Video, 
  Upload, 
  X,
  Heart,
  Smile,
  Sparkles
} from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import type { UpcomingEvent } from '@/lib/eventsService'
import { validateFile, generateAcceptAttribute, formatFileSize, getFileTypeDescription } from '@/utils/fileValidation'
import { checkEventPermissions } from '@/lib/eventAclService'
import { EventPermissionBanner } from '@/components/events/EventPermissionBanner'

interface EventContributionModalProps {
  event: UpcomingEvent | null
  isOpen: boolean
  onClose: () => void
}

interface Contribution {
  type: 'text' | 'photo' | 'video'
  content: string
  message?: string
  file?: File
}

export const EventContributionModal = ({ event, isOpen, onClose }: EventContributionModalProps) => {
  const [activeTab, setActiveTab] = useState<'text' | 'photo' | 'video'>('text')
  const [textMessage, setTextMessage] = useState('')
  const [photoMessage, setPhotoMessage] = useState('')
  const [videoMessage, setVideoMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<any>(null)
  const [loadingPermissions, setLoadingPermissions] = useState(true)
  const { track } = useAnalytics()
  const { toast } = useToast()

  // Check permissions when modal opens
  React.useEffect(() => {
    if (isOpen && event) {
      checkPermissions()
    }
  }, [isOpen, event])

  const checkPermissions = async () => {
    setLoadingPermissions(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const perms = await checkEventPermissions(event?.id || '', user?.id)
      setPermissions(perms)
    } catch (error) {
      console.error('Error checking permissions:', error)
    } finally {
      setLoadingPermissions(false)
    }
  }

  const handleFileSelect = (file: File) => {
    // Validate file using enhanced validation
    const validation = validateFile(file)
    
    if (!validation.isValid) {
      toast({
        title: 'File not supported',
        description: validation.error,
        variant: 'destructive'
      })
      return
    }
    
    // Show warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        toast({
          title: 'File Warning',
          description: warning,
          variant: 'default'
        })
      })
    }
    
    setSelectedFile(file)
    
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleFileRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleSubmit = async () => {
    if (!event) return

    // Check permissions before submitting
    if (!permissions?.canContribute) {
      toast({
        title: 'Permission denied',
        description: 'You need contributor approval to add content',
        variant: 'destructive'
      })
      return
    }

    let content = ''
    let message = ''
    
    switch (activeTab) {
      case 'text':
        if (!textMessage.trim()) {
          toast({
            title: 'Message required',
            description: 'Please write a message to contribute',
            variant: 'destructive'
          })
          return
        }
        content = textMessage.trim()
        break
        
      case 'photo':
        if (!selectedFile || !selectedFile.type.startsWith('image/')) {
          toast({
            title: 'Photo required',
            description: 'Please select a photo to contribute',
            variant: 'destructive'
          })
          return
        }
        message = photoMessage.trim()
        break
        
      case 'video':
        if (!selectedFile || !selectedFile.type.startsWith('video/')) {
          toast({
            title: 'Video required',
            description: 'Please select a video to contribute',
            variant: 'destructive'
          })
          return
        }
        message = videoMessage.trim()
        break
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get user's family ID
      const { data: memberData } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .limit(1)
        .single()

      if (!memberData) throw new Error('Family not found')

      let mediaUrl = null
      
      // Upload file if present
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2)}.${fileExt}`
        const filePath = `contributions/${fileName}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, selectedFile)

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from('media')
          .getPublicUrl(uploadData.path)

        mediaUrl = publicUrlData.publicUrl
      }

      // Save contribution as a story
      const storyData = {
        title: `${event.person_name}'s ${event.type === 'birthday' ? 'Birthday' : 'Event'} Contribution`,
        content: activeTab === 'text' ? content : message || `Contributed a ${activeTab} for ${event.person_name}'s special day`,
        family_id: memberData.family_id,
        profile_id: user.id
      }

      const { error: storyError } = await supabase
        .from('stories')
        .insert(storyData)

      if (storyError) throw storyError

      track('event_contribution_submitted', {
        eventType: event.type,
        contributionType: activeTab,
        hasMedia: !!mediaUrl,
        eventId: event.id
      })

      toast({
        title: '🎉 Contribution Added!',
        description: `Your ${activeTab} has been added to ${event.person_name}'s celebration`
      })

      // Reset form
      setTextMessage('')
      setPhotoMessage('')
      setVideoMessage('')
      handleFileRemove()
      onClose()

    } catch (error) {
      console.error('Error submitting contribution:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit your contribution. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getContributionCount = () => {
    // This would come from a query to count existing contributions
    return Math.floor(Math.random() * 5) + 1 // Mock data
  }

  if (!event) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Contribute to {event.person_name}'s {event.type === 'birthday' ? 'Birthday' : 'Event'}
          </DialogTitle>
          <DialogDescription>
            Share a message, photo, or video to make this celebration special
          </DialogDescription>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {getContributionCount()} contributions so far
            </Badge>
          </div>
        </DialogHeader>

        {/* Permission Banner */}
        {!loadingPermissions && permissions && (
          <EventPermissionBanner role={permissions.role} action="contribute" />
        )}

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Message
            </TabsTrigger>
            <TabsTrigger value="photo" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photo
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text-message">Your message</Label>
              <Textarea
                id="text-message"
                placeholder={`Write a heartfelt message for ${event.person_name}...`}
                value={textMessage}
                onChange={(e) => setTextMessage(e.target.value)}
                rows={6}
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Share your thoughts, memories, or wishes</span>
                <span>{textMessage.length}/500</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="photo" className="space-y-4">
            <div className="space-y-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label>Select Photo</Label>
                {!selectedFile ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Click to select a photo to share
                    </p>
                    <Input
                      type="file"
                      accept={generateAcceptAttribute(['images'])}
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <img
                        src={previewUrl || ''}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={handleFileRemove}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getFileTypeDescription(selectedFile.type)}
                    </p>
                  </div>
                )}
              </div>

              {/* Optional Message */}
              <div className="space-y-2">
                <Label htmlFor="photo-message">Message (optional)</Label>
                <Textarea
                  id="photo-message"
                  placeholder={`Add a message to go with your photo...`}
                  value={photoMessage}
                  onChange={(e) => setPhotoMessage(e.target.value)}
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {photoMessage.length}/200
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="video" className="space-y-4">
            <div className="space-y-4">
              {/* File Upload */}
              <div className="space-y-2">
                <Label>Select Video</Label>
                {!selectedFile ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Click to select a video to share
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Supports: MP4, WebM, MOV, AVI and more
                    </p>
                    <Input
                      type="file"
                      accept={generateAcceptAttribute(['videos', 'audio'])}
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="cursor-pointer"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Video className="h-8 w-8 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(selectedFile.size)} • {getFileTypeDescription(selectedFile.type)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleFileRemove}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Message */}
              <div className="space-y-2">
                <Label htmlFor="video-message">Message (optional)</Label>
                <Textarea
                  id="video-message"
                  placeholder={`Add a message to go with your video...`}
                  value={videoMessage}
                  onChange={(e) => setVideoMessage(e.target.value)}
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {videoMessage.length}/200
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground mr-2" />
                Contributing...
              </>
            ) : (
              <>
                <Heart className="h-4 w-4 mr-2" />
                Contribute {activeTab === 'text' ? 'Message' : activeTab === 'photo' ? 'Photo' : 'Video'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}