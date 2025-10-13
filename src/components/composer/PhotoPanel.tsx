import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MultiImageLayout } from '@/components/story-create/MultiImageLayout'
import { useToast } from '@/hooks/use-toast'
import { SaveStatusBadge } from './SaveStatusBadge'
import { useSaveStatus } from '@/hooks/useSaveStatus'
import { PhotoEditorModal } from './photo/PhotoEditorModal'
import { extractExifDate, hasExifSupport } from '@/utils/exifUtils'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PhotoPanelProps {
  title: string
  content: string
  photos: File[]
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onPhotosChange: (files: File[]) => void
  onDateChange?: (date: Date) => void
  familyId: string
}

export function PhotoPanel({
  title,
  content,
  photos,
  onTitleChange,
  onContentChange,
  onPhotosChange,
  onDateChange,
  familyId
}: PhotoPanelProps) {
  const { toast } = useToast()
  const [imageData, setImageData] = useState<Array<{ id: string; url: string; file: File }>>([])
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [exifDate, setExifDate] = useState<Date | null>(null)
  const [showExifPrompt, setShowExifPrompt] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const saveStatus = useSaveStatus([title, content, photos.length], 500)

  function generateId() {
    return Math.random().toString(36).substr(2, 9)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    
    const validFiles: File[] = []
    const newImageData: Array<{ id: string; url: string; file: File }> = []
    
    setUploadProgress(0)
    
    for (let i = 0; i < selected.length; i++) {
      const file = selected[i]
      
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
      
      // Extract EXIF date from first image
      if (i === 0 && imageData.length === 0 && hasExifSupport(file)) {
        const date = await extractExifDate(file)
        if (date) {
          setExifDate(date)
          setShowExifPrompt(true)
        }
      }
      
      validFiles.push(file)
      newImageData.push({
        id: generateId(),
        url: URL.createObjectURL(file),
        file
      })
      
      setUploadProgress(((i + 1) / selected.length) * 100)
    }
    
    const allPhotos = [...photos, ...validFiles]
    const allImageData = [...imageData, ...newImageData]
    
    onPhotosChange(allPhotos)
    setImageData(allImageData)
    
    setUploadProgress(0)
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

  const selectedImage = imageData.find(img => img.id === selectedImageId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Photo Story</h2>
        <SaveStatusBadge status={saveStatus} />
      </div>

      {showExifPrompt && exifDate && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Use photo date: {exifDate.toLocaleDateString()}?</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onDateChange?.(exifDate)
                  setShowExifPrompt(false)
                  toast({ title: 'Date applied from photo' })
                }}
              >
                Yes
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowExifPrompt(false)}
              >
                No
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
        {imageData.length > 0 && (
          <div className="mt-4">
            <MultiImageLayout
              images={imageData}
              onReorder={handleReorder}
              onRemove={removeFile}
              onImageClick={(id) => setSelectedImageId(id)}
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

      {selectedImage && (
        <PhotoEditorModal
          isOpen={!!selectedImageId}
          onClose={() => setSelectedImageId(null)}
          imageUrl={selectedImage.url}
          imageId={selectedImage.id}
          familyId={familyId}
          onDelete={() => {
            removeFile(selectedImage.id)
            setSelectedImageId(null)
          }}
        />
      )}
    </div>
  )
}
