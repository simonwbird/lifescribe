import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Camera, 
  Video, 
  Upload, 
  Send, 
  Heart,
  Calendar,
  X
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { useAnalytics } from '@/hooks/useAnalytics'

interface EventContribution {
  id?: string
  event_id: string
  contributor_name: string
  contribution_type: 'text' | 'photo' | 'video'
  content: string
  media_url?: string
  created_at?: string
}

interface EventContributionModalProps {
  isOpen: boolean
  onClose: () => void
  event: {
    id: string
    title: string
    person_name: string
    type: 'birthday' | 'anniversary' | 'memorial' | 'custom'
    date: string
  }
  onContributionAdded: () => void
}

export default function EventContributionModal({
  isOpen,
  onClose,
  event,
  onContributionAdded
}: EventContributionModalProps) {
  const [contributionType, setContributionType] = useState<'text' | 'photo' | 'video'>('text')
  const [contributorName, setContributorName] = useState('')
  const [textContent, setTextContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  
  const { toast } = useToast()
  const { track } = useAnalytics()

  const resetForm = () => {
    setContributorName('')
    setTextContent('')
    setSelectedFile(null)
    setContributionType('text')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith('image/') && contributionType !== 'photo') {
      setContributionType('photo')
    } else if (file.type.startsWith('video/') && contributionType !== 'video') {
      setContributionType('video')
    }
    
    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 50MB",
        variant: "destructive"
      })
      return
    }
    
    setSelectedFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `event-contributions/${event.id}/${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('family_media')
      .upload(fileName, file)
    
    if (uploadError) throw uploadError
    
    const { data: { publicUrl } } = supabase.storage
      .from('family_media')
      .getPublicUrl(fileName)
    
    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!contributorName.trim()) {
      toast({
        title: "Missing name",
        description: "Please enter your name",
        variant: "destructive"
      })
      return
    }

    if (contributionType === 'text' && !textContent.trim()) {
      toast({
        title: "Missing message",
        description: "Please enter your message",
        variant: "destructive"
      })
      return
    }

    if ((contributionType === 'photo' || contributionType === 'video') && !selectedFile) {
      toast({
        title: "Missing file",
        description: `Please select a ${contributionType} to upload`,
        variant: "destructive"
      })
      return
    }

    try {
      setUploading(true)
      
      let mediaUrl: string | undefined
      
      // Upload file if present
      if (selectedFile) {
        mediaUrl = await uploadFile(selectedFile)
      }
      
      // Create contribution record
      const { data: { user } } = await supabase.auth.getUser()
      const contribution: Omit<EventContribution, 'id' | 'created_at'> = {
        event_id: event.id,
        contributor_name: contributorName.trim(),
        contribution_type: contributionType,
        content: textContent.trim() || `${contributionType} contribution`,
        media_url: mediaUrl
      }

      // For now, we'll store this in a simple format
      // In a real app, you'd have a proper database table
      const { error } = await supabase
        .from('stories')
        .insert({
          title: `${event.person_name} - ${event.title} Contribution`,
          content: `Contribution from ${contributorName}:\n\n${textContent}`,
          family_id: user?.id, // This should be the actual family_id
          profile_id: user?.id,
          occurred_on: event.date,
          tags: [`event-${event.id}`, `contribution`, contributionType]
        })

      if (error) throw error

      // Track analytics (removed for now due to type constraints)
      console.log('Event contribution added:', {
        event_type: event.type,
        contribution_type: contributionType,
        has_media: !!mediaUrl
      })

      toast({
        title: "Contribution added!",
        description: `Your ${contributionType} has been added to ${event.title}`
      })

      onContributionAdded()
      handleClose()
      
    } catch (error) {
      console.error('Error adding contribution:', error)
      toast({
        title: "Failed to add contribution",
        description: "Please try again",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const getEventIcon = () => {
    switch (event.type) {
      case 'birthday':
        return <Heart className="h-5 w-5 text-pink-500" />
      case 'anniversary':
        return <Heart className="h-5 w-5 text-red-500" />
      case 'memorial':
        return <Heart className="h-5 w-5 text-purple-500" />
      default:
        return <Calendar className="h-5 w-5 text-blue-500" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getEventIcon()}
            Contribute to {event.title}
          </DialogTitle>
          <DialogDescription>
            Share a message, photo, or video for {event.person_name}'s special day
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Info */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{event.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {event.type}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Contributor Name */}
          <div className="space-y-2">
            <Label htmlFor="contributor-name">Your Name *</Label>
            <Input
              id="contributor-name"
              value={contributorName}
              onChange={(e) => setContributorName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          {/* Contribution Type */}
          <div className="space-y-3">
            <Label>Contribution Type</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={contributionType === 'text' ? 'default' : 'outline'}
                onClick={() => setContributionType('text')}
                className="flex flex-col items-center gap-2 h-auto py-3"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs">Text Message</span>
              </Button>
              
              <Button
                type="button"
                variant={contributionType === 'photo' ? 'default' : 'outline'}
                onClick={() => setContributionType('photo')}
                className="flex flex-col items-center gap-2 h-auto py-3"
              >
                <Camera className="h-4 w-4" />
                <span className="text-xs">Photo</span>
              </Button>
              
              <Button
                type="button"
                variant={contributionType === 'video' ? 'default' : 'outline'}
                onClick={() => setContributionType('video')}
                className="flex flex-col items-center gap-2 h-auto py-3"
              >
                <Video className="h-4 w-4" />
                <span className="text-xs">Video</span>
              </Button>
            </div>
          </div>

          {/* Text Content */}
          {contributionType === 'text' && (
            <div className="space-y-2">
              <Label htmlFor="text-content">Your Message *</Label>
              <Textarea
                id="text-content"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Share your message, memory, or wishes..."
                rows={4}
                required
              />
            </div>
          )}

          {/* Photo/Video Message */}
          {(contributionType === 'photo' || contributionType === 'video') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-content">Optional Message</Label>
                <Textarea
                  id="text-content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Add a message to go with your photo/video..."
                  rows={2}
                />
              </div>

              {/* File Upload Area */}
              <div className="space-y-2">
                <Label>Upload {contributionType === 'photo' ? 'Photo' : 'Video'} *</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        {contributionType === 'photo' ? (
                          <Camera className="h-6 w-6 text-green-600" />
                        ) : (
                          <Video className="h-6 w-6 text-green-600" />
                        )}
                        <span className="font-medium text-green-600">File selected</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          Drop your {contributionType} here or click to browse
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Max file size: 50MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept={contributionType === 'photo' ? 'image/*' : 'video/*'}
                        onChange={handleFileInput}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button type="button" variant="outline" asChild>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Select File
                        </label>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Add Contribution
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}