import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Video, 
  Star, 
  GripVertical,
  Camera,
  Plus
} from 'lucide-react'
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { type MediaItem } from './StoryWizardTypes'

interface EnhancedMediaUploaderProps {
  media: MediaItem[]
  onChange: (media: MediaItem[]) => void
  maxFiles?: number
}

export default function EnhancedMediaUploader({ 
  media, 
  onChange, 
  maxFiles = 10 
}: EnhancedMediaUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    )

    const newMediaItems: MediaItem[] = validFiles.map((file, index) => ({
      id: generateId(),
      file,
      caption: '',
      isCover: media.length === 0 && index === 0, // First image is cover by default
      order: media.length + index,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }))

    const updatedMedia = [...media, ...newMediaItems].slice(0, maxFiles)
    onChange(updatedMedia)
  }, [media, maxFiles, onChange])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const capturePhoto = async () => {
    try {
      setIsCapturing(true)
      
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        saveToGallery: false
      })

      if (image.dataUrl) {
        // Convert data URL to blob/file
        const response = await fetch(image.dataUrl)
        const blob = await response.blob()
        const fileName = `camera-${Date.now()}.jpg`
        const file = new File([blob], fileName, { type: 'image/jpeg' })
        
        handleFiles([file])
      }
    } catch (error) {
      console.error('Error capturing photo:', error)
      // Fallback to file picker on web or if camera access fails
      fileInputRef.current?.click()
    } finally {
      setIsCapturing(false)
    }
  }

  const removeMedia = (id: string) => {
    const item = media.find(m => m.id === id)
    if (item?.preview) {
      URL.revokeObjectURL(item.preview)
    }
    
    const updatedMedia = media.filter(m => m.id !== id)
    
    // If we removed the cover image, make the first remaining image the cover
    if (item?.isCover && updatedMedia.length > 0) {
      updatedMedia[0].isCover = true
    }
    
    onChange(updatedMedia)
  }

  const updateCaption = (id: string, caption: string) => {
    const updatedMedia = media.map(item => 
      item.id === id ? { ...item, caption } : item
    )
    onChange(updatedMedia)
  }

  const setCover = (id: string) => {
    const updatedMedia = media.map(item => ({
      ...item,
      isCover: item.id === id
    }))
    onChange(updatedMedia)
  }

  const moveMedia = (fromIndex: number, toIndex: number) => {
    const updatedMedia = [...media]
    const [movedItem] = updatedMedia.splice(fromIndex, 1)
    updatedMedia.splice(toIndex, 0, movedItem)
    
    // Update order values
    updatedMedia.forEach((item, index) => {
      item.order = index
    })
    
    onChange(updatedMedia)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive 
            ? 'border-brand-green bg-brand-green/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }
          ${media.length >= maxFiles ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={media.length >= maxFiles}
          aria-label="Upload media files"
        />
        
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="bg-muted rounded-full p-3">
              <Camera className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex items-center gap-3 justify-center">
            <Button
              variant="outline"
              onClick={capturePhoto}
              disabled={media.length >= maxFiles || isCapturing}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              {isCapturing ? 'Opening Camera...' : 'Take Photo'}
            </Button>
            
            <span className="text-xs text-muted-foreground">or</span>
            
            <Button
              variant="link"
              className="h-auto p-0 text-xs underline"
              onClick={() => fileInputRef.current?.click()}
              disabled={media.length >= maxFiles}
            >
              choose files
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Up to {maxFiles} files • Supports JPG, PNG, MP4, MOV
          </p>
        </div>
      </div>

      {/* Media Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((item, index) => (
            <Card key={item.id} className="relative overflow-hidden">
              <div className="aspect-video relative bg-muted">
                {item.file.type.startsWith('image/') ? (
                  <img
                    src={item.preview}
                    alt={item.caption || 'Uploaded image'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                
                {/* Cover Badge */}
                {item.isCover && (
                  <Badge className="absolute top-2 left-2 bg-brand-green text-brand-green-foreground gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Cover
                  </Badge>
                )}
                
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {!item.isCover && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0"
                      onClick={() => setCover(item.id)}
                      title="Set as cover image"
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 w-6 p-0"
                    onClick={() => removeMedia(item.id)}
                    title="Remove media"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Drag Handle */}
                <div className="absolute bottom-2 left-2">
                  <div className="bg-background/80 rounded p-1 cursor-move">
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              </div>
              
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {item.file.type.startsWith('image/') ? (
                      <ImageIcon className="h-3 w-3" />
                    ) : (
                      <Video className="h-3 w-3" />
                    )}
                    <span className="truncate">{item.file.name}</span>
                    <span>({formatFileSize(item.file.size)})</span>
                  </div>
                  
                  <div>
                    <Label htmlFor={`caption-${item.id}`} className="sr-only">
                      Caption for {item.file.name}
                    </Label>
                    <Input
                      id={`caption-${item.id}`}
                      value={item.caption}
                      onChange={(e) => updateCaption(item.id, e.target.value)}
                      placeholder="Add a caption..."
                      className="text-xs h-8"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {media.length > 0 && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Drag images to reorder them</p>
          <p>• Click the star icon to set a cover image</p>
          <p>• Add captions to help family members understand the photos</p>
        </div>
      )}
    </div>
  )
}