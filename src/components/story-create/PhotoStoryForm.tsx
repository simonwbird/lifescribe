import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { DatePrecisionPicker, DatePrecisionValue } from '@/components/DatePrecisionPicker'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { uploadMediaFile } from '@/lib/media'
import { MultiImageLayout } from './MultiImageLayout'
import { useEventTracking } from '@/hooks/useEventTracking'

interface PhotoStoryFormProps {
  familyId: string
}

export default function PhotoStoryForm({ familyId }: PhotoStoryFormProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { trackCustomEvent } = useEventTracking()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [dateValue, setDateValue] = useState<DatePrecisionValue>({ date: null, precision: 'exact', yearOnly: false })
  const [files, setFiles] = useState<File[]>([])
  const [imageData, setImageData] = useState<Array<{ id: string; url: string; file: File }>>([])

  function generateId() {
    return Math.random().toString(36).substr(2, 9)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    
    // Validate files
    const validFiles: File[] = []
    const newImageData: Array<{ id: string; url: string; file: File }> = []
    
    for (const file of selected) {
      // Check file type
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.type.toLowerCase())) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a supported image format.`,
          variant: 'destructive'
        })
        continue
      }
      
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 10MB limit.`,
          variant: 'destructive'
        })
        continue
      }
      
      validFiles.push(file)
      newImageData.push({
        id: generateId(),
        url: URL.createObjectURL(file),
        file
      })
    }
    
    setFiles(prev => [...prev, ...validFiles])
    setImageData(prev => [...prev, ...newImageData])
  }

  function handleReorder(newImages: Array<{ id: string; url: string; file: File }>) {
    setImageData(newImages)
    setFiles(newImages.map(img => img.file))
    
    // Track reorder action
    trackCustomEvent('story.images_reordered', {
      image_count: newImages.length,
      story_type: 'photo',
      timestamp: new Date().toISOString(),
    })
  }

  function removeFile(id: string) {
    const imageToRemove = imageData.find(img => img.id === id)
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url)
    }
    
    setImageData(prev => prev.filter(img => img.id !== id))
    setFiles(prev => {
      const newFiles = [...prev]
      const index = imageData.findIndex(img => img.id === id)
      if (index !== -1) {
        newFiles.splice(index, 1)
      }
      return newFiles
    })
  }

  async function handleSubmit(e: React.FormEvent, asDraft = false) {
    e.preventDefault()
    
    // Validation - Title always required
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please provide a title for your story.',
        variant: 'destructive'
      })
      return
    }

    // For non-draft submissions, require at least one photo
    if (!asDraft && files.length === 0) {
      toast({
        title: 'No photos',
        description: 'Please add at least one photo or save as draft.',
        variant: 'destructive'
      })
      return
    }

    // Content is optional for photo-only stories

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Step 1: Insert story (get id)
      const occurredDate = dateValue.date ? dateValue.date.toISOString().split('T')[0] : null
      
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          family_id: familyId,
          profile_id: user.id,
          title: title.trim(),
          content: content.trim() || null,
          occurred_on: occurredDate,
          is_approx: dateValue.yearOnly,
          status: asDraft ? 'draft' : 'published'
        })
        .select()
        .single()

      if (storyError) throw storyError

      // Step 2: Upload images in order and insert media records
      let successCount = 0
      let failCount = 0
      const errors: string[] = []

      for (const file of files) {
        try {
          // Upload file to storage
          const { path, error: uploadError } = await uploadMediaFile(file, familyId, user.id)
          
          if (uploadError || !path) {
            failCount++
            errors.push(`${file.name}: ${uploadError || 'Upload failed'}`)
            continue
          }

          // Insert media record - respect media_single_parent (only story_id set)
          const { error: mediaError } = await supabase
            .from('media')
            .insert({
              story_id: story.id,         // Only parent reference
              profile_id: user.id,
              family_id: familyId,
              file_path: path,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type
              // No answer_id, recipe_id, etc - respects single parent constraint
            })

          if (mediaError) {
            failCount++
            errors.push(`${file.name}: ${mediaError.message}`)
          } else {
            successCount++
          }
        } catch (fileError: any) {
          failCount++
          errors.push(`${file.name}: ${fileError.message}`)
        }
      }

      // Show appropriate feedback based on results
      if (failCount > 0 && successCount === 0) {
        // All uploads failed - keep as draft
        await supabase
          .from('stories')
          .update({ status: 'draft' })
          .eq('id', story.id)

        toast({
          title: 'Media upload failed',
          description: `Story saved as draft. ${failCount} photo(s) failed to upload. Please try uploading again.`,
          variant: 'destructive'
        })
      } else if (failCount > 0) {
        // Partial success
        toast({
          title: asDraft ? 'Draft saved with warnings' : 'Story created with warnings',
          description: `${successCount} photo(s) uploaded successfully, but ${failCount} failed. Check console for details.`,
        })
        console.error('Upload errors:', errors)
      } else {
        // Complete success
        toast({
          title: asDraft ? 'Draft saved!' : 'Story created!',
          description: asDraft 
            ? `Your draft has been saved with ${successCount} photo(s).` 
            : `Your photo story has been published with ${successCount} photo(s).`
        })
        
        // Track multi-image layout usage
        if (successCount >= 2) {
          trackCustomEvent('story.multi_image_layout_used', {
            image_count: successCount,
            layout_type: getLayoutType(successCount),
            story_id: story.id,
            is_draft: asDraft,
            timestamp: new Date().toISOString(),
          })
        }
      }

      navigate('/feed')
    } catch (error: any) {
      console.error('Error creating photo story:', error)
      
      // Actionable error message
      let errorMessage = 'Failed to create story. '
      if (error.message.includes('family_id')) {
        errorMessage += 'Please make sure you have selected a family.'
      } else if (error.message.includes('profile_id')) {
        errorMessage += 'Please make sure you are logged in.'
      } else {
        errorMessage += error.message || 'Please try again.'
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function getLayoutType(count: number): string {
    switch (count) {
      case 2: return '2-grid';
      case 3: return '3-masonry';
      case 4: return '4-grid';
      case 5: return '5-collage';
      case 6: return '6-collage';
      default: return 'multi-grid';
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Photo Story</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Photos <span className="text-destructive">*</span>
            </label>
            <input
              type="file"
              data-testid="photo-input"
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {imageData.length > 0 && (
              <div className="mt-4">
                <MultiImageLayout
                  images={imageData}
                  onReorder={handleReorder}
                  onRemove={removeFile}
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              data-testid="story-title-input"
              placeholder="Give your story a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Story <span className="text-muted-foreground">(Optional for photo-only)</span>
            </label>
            <Textarea
              id="content"
              data-testid="story-content-input"
              placeholder="Tell the story behind these photos..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              When was this? (Optional)
            </label>
            <DatePrecisionPicker value={dateValue} onChange={setDateValue} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            {(files.length === 0 || !content.trim()) && (
              <Button 
                type="button"
                data-testid="save-draft-button"
                variant="secondary"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save as Draft'}
              </Button>
            )}
            <Button 
              type="submit"
              data-testid="publish-button"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Story'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
