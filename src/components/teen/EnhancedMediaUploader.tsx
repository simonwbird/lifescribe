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

interface EnhancedMediaUploaderProps {
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

export function TeenMediaUploader({ 
  media, 
  onMediaChange, 
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  maxFiles = 10,
  className 
}: EnhancedMediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return

    const newMediaItems: MediaItem[] = []
    
    for (let i = 0; i < files.length && media.length + newMediaItems.length < maxFiles; i++) {
      const file = files[i]
      
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        toast({
          title: "File type not supported",
          description: `${file.name} is not a supported file type`,
          variant: "destructive"
        })
        continue
      }
      
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 50MB`,
          variant: "destructive"
        })
        continue
      }

      // Create preview URL
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
        title: `${newMediaItems.length} file${newMediaItems.length > 1 ? 's' : ''} added!`,
        description: "Your media has been uploaded successfully! ✨",
      })
    }
  }, [media, onMediaChange, acceptedTypes, maxFiles, toast])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const removeMedia = (id: string) => {
    const updatedMedia = media.filter(item => item.id !== id)
    
    // Clean up preview URLs
    const removedItem = media.find(item => item.id === id)
    if (removedItem?.preview) {
      URL.revokeObjectURL(removedItem.preview)
    }
    
    // If removed item was cover, make first item cover
    if (removedItem?.isCover && updatedMedia.length > 0) {
      updatedMedia[0].isCover = true
    }
    
    onMediaChange(updatedMedia)
    
    toast({
      title: "Media removed",
      description: "File has been removed from your story",
    })
  }

  const updateCaption = (id: string, caption: string) => {
    const updatedMedia = media.map(item =>
      item.id === id ? { ...item, caption } : item
    )
    onMediaChange(updatedMedia)
  }

  const setCover = (id: string) => {
    const updatedMedia = media.map(item => ({
      ...item,
      isCover: item.id === id
    }))
    onMediaChange(updatedMedia)
    
    toast({
      title: "Cover photo set! 📸",
      description: "This will be the main image for your story",
    })
  }

  const toggleVideoPlay = (id: string) => {
    setPlayingVideo(playingVideo === id ? null : id)
  }

  const toggleAudioPlay = (id: string) => {
    setPlayingAudio(playingAudio === id ? null : id)
  }

  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />
    if (file.type.startsWith('video/')) return <Video className="w-4 h-4" />
    if (file.type.startsWith('audio/')) return <Volume2 className="w-4 h-4" />
    return <FileImage className="w-4 h-4" />
  }

  const isGif = (file: File) => file.type === 'image/gif'

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          isDragging 
            ? "border-pink-400 bg-gradient-to-br from-pink-50 to-purple-50 scale-105" 
            : "border-gray-300 hover:border-pink-300 hover:bg-gradient-to-br hover:from-pink-25 hover:to-purple-25"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
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
            
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <Badge variant="secondary" className="bg-pink-100 text-pink-600">
                <Camera className="w-3 h-3 mr-1" />
                Photos
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-600">
                <Film className="w-3 h-3 mr-1" />
                Videos
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-600">
                <Sparkles className="w-3 h-3 mr-1" />
                GIFs
              </Badge>
            </div>
            
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
          
          <p className="text-xs text-gray-400">
            Up to {maxFiles} files, 50MB each • JPG, PNG, GIF, MP4, WebM supported
          </p>
        </div>
      </div>

      {/* Media Preview Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {media.map((item) => (
            <Card key={item.id} className={cn(
              "relative overflow-hidden transition-all hover:shadow-lg",
              item.isCover && "ring-2 ring-pink-400 shadow-lg"
            )}>
              <CardContent className="p-4 space-y-3">
                {/* Media Preview */}
                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {item.file.type.startsWith('image/') && (
                    <div className="relative w-full h-full">
                      <img
                        src={item.preview}
                        alt={item.file.name}
                        className="w-full h-full object-cover"
                      />
                      {isGif(item.file) && (
                        <Badge className="absolute top-2 left-2 bg-purple-600 text-white">
                          <Sparkles className="w-3 h-3 mr-1" />
                          GIF
                        </Badge>
                      )}
                      {item.isCover && (
                        <Badge className="absolute top-2 right-2 bg-pink-600 text-white">
                          Cover
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {item.file.type.startsWith('video/') && (
                    <div className="relative w-full h-full">
                      <video
                        src={item.preview}
                        className="w-full h-full object-cover"
                        controls={false}
                        playsInline
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute inset-0 bg-black/20 hover:bg-black/30 text-white"
                        onClick={() => toggleVideoPlay(item.id)}
                      >
                        {playingVideo === item.id ? 
                          <Pause className="w-8 h-8" /> : 
                          <Play className="w-8 h-8" />
export { TeenMediaUploader as default }
                      </Button>
                      {item.isCover && (
                        <Badge className="absolute top-2 right-2 bg-pink-600 text-white">
                          Cover
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {item.file.type.startsWith('audio/') && (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-100 to-pink-100">
                      <div className="text-center">
                        <Button
                          variant="ghost"
                          size="lg"
                          onClick={() => toggleAudioPlay(item.id)}
                          className="mb-2"
                        >
                          {playingAudio === item.id ? 
                            <VolumeX className="w-8 h-8 text-purple-600" /> : 
                            <Volume2 className="w-8 h-8 text-purple-600" />
                          }
                        </Button>
                        <p className="text-sm text-gray-600 font-medium">Audio File</p>
                        <p className="text-xs text-gray-500">{item.file.name}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Remove button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 w-6 h-6 p-0 rounded-full"
                    onClick={() => removeMedia(item.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>

                {/* File Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {getFileTypeIcon(item.file)}
                    <span className="font-medium truncate max-w-32">
                      {item.file.name}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    {(item.file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>

                {/* Caption Input */}
                <div className="space-y-2">
                  <Label htmlFor={`caption-${item.id}`} className="text-sm font-medium">
                    Caption (optional)
                  </Label>
                  <Input
                    id={`caption-${item.id}`}
                    placeholder="Add a fun caption..."
                    value={item.caption}
                    onChange={(e) => updateCaption(item.id, e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Actions */}
                {item.file.type.startsWith('image/') && !item.isCover && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCover(item.id)}
                    className="w-full border-pink-300 text-pink-600 hover:bg-pink-50"
                  >
                    Set as Cover Photo
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}