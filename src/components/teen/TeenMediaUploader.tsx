import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Upload, 
  Image, 
  Video, 
  FileImage, 
  X, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Camera,
  Film
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface MediaItem {
  id: string
  file: File
  caption: string
  isCover: boolean
  order: number
  preview?: string
}

interface TeenMediaUploaderProps {
  media: MediaItem[]
  onMediaChange: (media: MediaItem[]) => void
  acceptedTypes?: string[]
  maxFiles?: number
  className?: string
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mp3', 'audio/wav', 'audio/ogg'
]

export default function TeenMediaUploader({ 
  media, 
  onMediaChange, 
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxFiles = 10,
  className 
}: TeenMediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return

    const newMediaItems: MediaItem[] = []
    
    for (let i = 0; i < files.length && media.length + newMediaItems.length < maxFiles; i++) {
      const file = files[i]
      
      if (!acceptedTypes.includes(file.type)) {
        toast({
          title: "File type not supported",
          description: `${file.name} is not a supported file type`,
          variant: "destructive"
        })
        continue
      }
      
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large", 
          description: `${file.name} is larger than 50MB`,
          variant: "destructive"
        })
        continue
      }

      let preview: string | undefined
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        preview = URL.createObjectURL(file)
      }

      const mediaItem: MediaItem = {
        id: `${Date.now()}-${i}`,
        file,
        caption: '',
        isCover: media.length === 0 && newMediaItems.length === 0,
        order: media.length + newMediaItems.length,
        preview
      }

      newMediaItems.push(mediaItem)
    }

    if (newMediaItems.length > 0) {
      onMediaChange([...media, ...newMediaItems])
      
      toast({
        title: `${newMediaItems.length} file${newMediaItems.length > 1 ? 's' : ''} added! ✨`,
        description: "Ready to share with your family!",
      })
    }
  }, [media, onMediaChange, acceptedTypes, maxFiles, toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const removeMedia = (id: string) => {
    const updatedMedia = media.filter(item => item.id !== id)
    const removedItem = media.find(item => item.id === id)
    if (removedItem?.preview) {
      URL.revokeObjectURL(removedItem.preview)
    }
    onMediaChange(updatedMedia)
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          isDragging 
            ? "border-pink-400 bg-gradient-to-br from-pink-50 to-purple-50 scale-105" 
            : "border-gray-300 hover:border-pink-300"
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Upload className="w-12 h-12 text-pink-400 mx-auto" />
            <Sparkles className="w-4 h-4 text-purple-400 absolute -top-1 -right-1" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Add Photos, Videos & GIFs! 
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop your files here, or click to browse
            </p>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-pink-300 text-pink-600 hover:bg-pink-50"
            >
              Choose Files
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              accept={acceptedTypes.join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
        </div>
      </div>

      {media.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {media.map((item) => (
            <Card key={item.id} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                  {item.file.type.startsWith('image/') && (
                    <img
                      src={item.preview}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 w-6 h-6 p-0 rounded-full"
                    onClick={() => removeMedia(item.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <Input
                  placeholder="Add a caption..."
                  className="text-sm"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}