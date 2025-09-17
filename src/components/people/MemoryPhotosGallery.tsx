import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Camera, Upload, Calendar, X, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Person } from '@/utils/personUtils'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { uploadMediaFile, getSignedMediaUrl } from '@/lib/media'
import { format } from 'date-fns'

interface MemoryPhotosGalleryProps {
  person: Person
}

interface MemoryPhoto {
  id: string
  file_name: string
  file_path: string
  mime_type: string
  file_size: number
  created_at: string
  profile_id: string
  story_id: string
  story?: {
    id: string
    title: string
    content: string
    occurred_on: string | null
  }
}

export function MemoryPhotosGallery({ person }: MemoryPhotosGalleryProps) {
  const [uploading, setUploading] = useState(false)
  const [photos, setPhotos] = useState<MemoryPhoto[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [photoTitle, setPhotoTitle] = useState('')
  const [photoDescription, setPhotoDescription] = useState('')
  const [photoDate, setPhotoDate] = useState('')
  const [showLightbox, setShowLightbox] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const { toast } = useToast()

  // Fetch photos on component mount
  useEffect(() => {
    fetchPhotos()
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Check file types - allow images only
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ]

    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported image format.`,
          variant: "destructive"
        })
        return false
      }

      // Check file size (5MB limit for images)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large", 
          description: `${file.name} must be under 5MB.`,
          variant: "destructive"
        })
        return false
      }

      return true
    })

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles)
      setShowUploadModal(true)
    }

    // Reset input
    event.target.value = ''
  }

  const handleUploadWithStory = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create a story for this memory  
      const occurred_on = photoDate ? format(new Date(photoDate), 'yyyy-MM-dd') : null
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: photoTitle.trim() || `Memory photos - ${new Date().toLocaleDateString()}`,
          content: photoDescription.trim() || `Memory photos shared for ${person.full_name}`,
          occurred_on,
          occurred_precision: occurred_on ? 'day' : null,
          family_id: (person as any).family_id,
          profile_id: user.id
        })
        .select()
        .single()

      if (storyError || !story) throw storyError || new Error('Failed to create story')

      // Link story to this person
      const { error: linkError } = await supabase
        .from('person_story_links')
        .insert({
          person_id: person.id,
          story_id: story.id,
          family_id: (person as any).family_id
        })
      if (linkError) throw linkError

      // Upload all files and create media records
      let uploadedCount = 0
      for (const file of selectedFiles) {
        try {
          const { path, error: uploadError } = await uploadMediaFile(
            file,
            (person as any).family_id,
            user.id
          )

          if (uploadError) {
            console.error('Failed to upload file:', uploadError)
            continue
          }

          // Create media record
          const { error: mediaError } = await supabase
            .from('media')
            .insert({
              file_path: path,
              file_name: file.name,
              mime_type: file.type,
              file_size: file.size,
              family_id: (person as any).family_id,
              profile_id: user.id,
              story_id: story.id
            })

          if (mediaError) {
            console.error('Failed to create media record:', mediaError)
            continue
          }

          uploadedCount++
        } catch (error) {
          console.error('Error uploading file:', file.name, error)
        }
      }

      if (uploadedCount > 0) {
        toast({
          title: "Photos uploaded",
          description: `${uploadedCount} photo${uploadedCount > 1 ? 's' : ''} uploaded successfully.`
        })

        // Reset modal state
        setShowUploadModal(false)
        setSelectedFiles([])
        setPhotoTitle('')
        setPhotoDescription('')
        setPhotoDate('')
        
        // Refresh photos
        fetchPhotos()
      } else {
        throw new Error('No photos were uploaded successfully')
      }

    } catch (error) {
      console.error('Upload failed:', error)
      toast({
        title: "Upload failed",
        description: "Could not upload the photos. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('media')
        .select(`
          *,
          story:stories(id, title, content, occurred_on)
        `)
        .eq('family_id', (person as any).family_id)
        .in('mime_type', [
          'image/jpeg',
          'image/jpg', 
          'image/png',
          'image/webp',
          'image/gif'
        ])
        .not('story_id', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Filter to only show photos linked to this person
      const { data: personStories } = await supabase
        .from('person_story_links')
        .select('story_id')
        .eq('person_id', person.id)

      const personStoryIds = personStories?.map(link => link.story_id) || []
      const filteredPhotos = (data || []).filter(photo => 
        photo.story_id && personStoryIds.includes(photo.story_id)
      )

      setPhotos(filteredPhotos)
    } catch (error) {
      console.error('Failed to fetch photos:', error)
    }
  }

  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})

  const loadPhotoUrl = async (photo: MemoryPhoto) => {
    try {
      const signedUrl = await getSignedMediaUrl(photo.file_path, (person as any).family_id)
      if (signedUrl) {
        setPhotoUrls(prev => ({
          ...prev,
          [photo.id]: signedUrl
        }))
      }
    } catch (error) {
      console.error('Failed to load photo URL:', error)
    }
  }

  const openLightbox = (photoIndex: number) => {
    setCurrentPhotoIndex(photoIndex)
    setShowLightbox(true)
  }

  const navigatePrevious = () => {
    setCurrentPhotoIndex(prev => prev > 0 ? prev - 1 : photos.length - 1)
  }

  const navigateNext = () => {
    setCurrentPhotoIndex(prev => prev < photos.length - 1 ? prev + 1 : 0)
  }

  const currentPhoto = photos[currentPhotoIndex]

  useEffect(() => {
    photos.forEach(photo => {
      if (!photoUrls[photo.id]) {
        loadPhotoUrl(photo)
      }
    })
  }, [photos])

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Camera className="h-5 w-5" />
            <div>
              <CardTitle className="text-base">Memory Photos</CardTitle>
              <p className="text-xs text-muted-foreground">Share photos and memories</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={uploading} className="relative">
              <Plus className="h-4 w-4 mr-1" />
              {uploading ? 'Uploading...' : 'Add Photos'}
              <Input
                type="file"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No memory photos yet
              </p>
              <div className="relative inline-block">
                <Button variant="outline" disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Photos'}
                </Button>
                <Input
                  type="file"
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share photos and memories of {person.given_name || person.full_name}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div key={photo.id} className="group relative cursor-pointer" onClick={() => openLightbox(index)}>
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    {photoUrls[photo.id] ? (
                      <img
                        src={photoUrls[photo.id]}
                        alt={photo.story?.title || photo.file_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted animate-pulse" />
                    )}
                  </div>
                  
                  <div className="mt-2">
                    {photo.story?.title && (
                      <p className="text-sm font-medium truncate">
                        {photo.story.title}
                      </p>
                    )}
                    {photo.story?.occurred_on && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(photo.story.occurred_on), 'MMM d, yyyy')}
                      </p>
                    )}
                    {photo.story?.content && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {photo.story.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal with Story Details */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Memory Photos</DialogTitle>
            <DialogDescription>
              Share photos and tell the story behind this memory.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedFiles.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedFiles.map((file, index) => (
                    <span key={index} className="text-xs bg-background px-2 py-1 rounded">
                      {file.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                What's this memory about? <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                placeholder="e.g., Family vacation at the beach, Christmas morning 1995..."
                value={photoTitle}
                onChange={(e) => setPhotoTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                When was this taken? <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                type="date"
                value={photoDate}
                onChange={(e) => setPhotoDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Tell us more about this memory <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                placeholder="Share the story behind these photos - where you were, what was happening, who was there..."
                value={photoDescription}
                onChange={(e) => setPhotoDescription(e.target.value)}
                rows={3}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {photoDescription.length}/1000 characters
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowUploadModal(false)
                setSelectedFiles([])
                setPhotoTitle('')
                setPhotoDescription('')
                setPhotoDate('')
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadWithStory}
              disabled={uploading || selectedFiles.length === 0}
            >
              {uploading ? 'Uploading...' : 'Share Memory'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          {currentPhoto && (
            <div className="flex flex-col h-full">
              {/* Photo Display Area */}
              <div className="relative h-[60vh] bg-black">
                {photoUrls[currentPhoto.id] && (
                  <img
                    src={photoUrls[currentPhoto.id]}
                    alt={currentPhoto.story?.title || currentPhoto.file_name}
                    className="w-full h-full object-contain"
                  />
                )}
                
                {/* Navigation Buttons */}
                {photos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                      onClick={navigatePrevious}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white"
                      onClick={navigateNext}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white"
                  onClick={() => setShowLightbox(false)}
                >
                  <X className="h-6 w-6" />
                </Button>

                {/* Photo Counter */}
                {photos.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 text-white px-3 py-1 rounded-full text-sm">
                    {currentPhotoIndex + 1} of {photos.length}
                  </div>
                )}
              </div>

              {/* Story Details */}
              <div className="p-6 bg-background flex-shrink-0">
                <div className="space-y-3">
                  {currentPhoto.story?.title && (
                    <h3 className="text-lg font-semibold">
                      {currentPhoto.story.title}
                    </h3>
                  )}
                  
                  {currentPhoto.story?.occurred_on && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {format(new Date(currentPhoto.story.occurred_on), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  
                  {currentPhoto.story?.content && (
                    <p className="text-muted-foreground leading-relaxed">
                      {currentPhoto.story.content}
                    </p>
                  )}

                  {!currentPhoto.story?.title && !currentPhoto.story?.content && !currentPhoto.story?.occurred_on && (
                    <p className="text-muted-foreground italic">
                      No story details available for this photo
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}