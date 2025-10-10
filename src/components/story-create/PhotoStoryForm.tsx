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
import { X } from 'lucide-react'

interface PhotoStoryFormProps {
  familyId: string
}

export default function PhotoStoryForm({ familyId }: PhotoStoryFormProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [dateValue, setDateValue] = useState<DatePrecisionValue>({ date: null, yearOnly: false })
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    
    // Validate files
    const validFiles: File[] = []
    const newPreviews: string[] = []
    
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
      newPreviews.push(URL.createObjectURL(file))
    }
    
    setFiles(prev => [...prev, ...validFiles])
    setPreviews(prev => [...prev, ...newPreviews])
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index])
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validation
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Required fields',
        description: 'Please fill in title and content.',
        variant: 'destructive'
      })
      return
    }

    if (files.length === 0) {
      toast({
        title: 'No photos',
        description: 'Please add at least one photo.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create story
      const occurredDate = dateValue.date ? dateValue.date.toISOString().split('T')[0] : null
      
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          family_id: familyId,
          profile_id: user.id,
          title: title.trim(),
          content: content.trim(),
          occurred_on: occurredDate,
          is_approx: dateValue.yearOnly
        })
        .select()
        .single()

      if (storyError) throw storyError

      // Upload each image and create media record
      for (const file of files) {
        const { path, error: uploadError } = await uploadMediaFile(file, familyId, user.id)
        
        if (uploadError || !path) {
          console.error('Upload error:', uploadError)
          continue // Skip this file, but don't fail the whole upload
        }

        // Insert media record - story_id is the only parent reference
        const { error: mediaError } = await supabase
          .from('media')
          .insert({
            story_id: story.id,
            profile_id: user.id,
            family_id: familyId,
            file_path: path,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type
          })

        if (mediaError) {
          console.error('Media record error:', mediaError)
        }
      }

      toast({
        title: 'Story created!',
        description: 'Your photo story has been published.'
      })

      navigate('/feed')
    } catch (error: any) {
      console.error('Error creating photo story:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to create story. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
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
              accept="image/jpeg,image/png,image/webp,image/heic"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              placeholder="Give your story a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Story <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="content"
              placeholder="Tell the story behind these photos..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="resize-none"
              required
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
            <Button 
              type="submit" 
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
