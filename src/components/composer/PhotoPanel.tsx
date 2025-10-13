import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MultiImageLayout } from '@/components/story-create/MultiImageLayout'
import { useToast } from '@/hooks/use-toast'
import { SaveStatusBadge } from './SaveStatusBadge'
import { useSaveStatus } from '@/hooks/useSaveStatus'

interface PhotoPanelProps {
  title: string
  content: string
  photos: File[]
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onPhotosChange: (files: File[]) => void
}

export function PhotoPanel({
  title,
  content,
  photos,
  onTitleChange,
  onContentChange,
  onPhotosChange
}: PhotoPanelProps) {
  const { toast } = useToast()
  const [imageData, setImageData] = useState<Array<{ id: string; url: string; file: File }>>([])
  const saveStatus = useSaveStatus([title, content, photos.length], 500)

  function generateId() {
    return Math.random().toString(36).substr(2, 9)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    
    const validFiles: File[] = []
    const newImageData: Array<{ id: string; url: string; file: File }> = []
    
    for (const file of selected) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(file.type.toLowerCase())) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a supported image format.`,
          variant: 'destructive'
        })
        continue
      }
      
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
    
    const allPhotos = [...photos, ...validFiles]
    const allImageData = [...imageData, ...newImageData]
    
    onPhotosChange(allPhotos)
    setImageData(allImageData)
  }

  function handleReorder(newImages: Array<{ id: string; url: string; file: File }>) {
    setImageData(newImages)
    onPhotosChange(newImages.map(img => img.file))
  }

  function removeFile(id: string) {
    const imageToRemove = imageData.find(img => img.id === id)
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url)
    }
    
    const newImageData = imageData.filter(img => img.id !== id)
    setImageData(newImageData)
    onPhotosChange(newImageData.map(img => img.file))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Photo Story</h2>
        <SaveStatusBadge status={saveStatus} />
      </div>

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
          placeholder="Give your story a title..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={200}
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          Story <span className="text-muted-foreground">(Optional)</span>
        </label>
        <Textarea
          id="content"
          placeholder="Tell the story behind these photos..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={10}
          className="resize-none"
        />
      </div>
    </div>
  )
}
