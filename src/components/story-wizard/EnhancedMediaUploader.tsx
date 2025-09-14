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
  Plus,
  RotateCcw
} from 'lucide-react'
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
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
  const [showCamera, setShowCamera] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingMode, setRecordingMode] = useState<'photo' | 'video'>('photo')
  const [currentCamera, setCurrentCamera] = useState<'user' | 'environment'>('environment') // Start with rear camera
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const generateId = () => Math.random().toString(36).substr(2, 9)

  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = true
      
      video.onloadedmetadata = () => {
        // Seek to 1 second or 10% of video duration, whichever is shorter
        const seekTime = Math.min(1, video.duration * 0.1)
        video.currentTime = seekTime
      }
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(video, 0, 0)
        
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob)
            resolve(thumbnailUrl)
          } else {
            reject(new Error('Failed to generate thumbnail'))
          }
        }, 'image/jpeg', 0.8)
      }
      
      video.onerror = () => reject(new Error('Video load error'))
      video.src = URL.createObjectURL(file)
    })
  }

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    )

    const newMediaItems: MediaItem[] = await Promise.all(
      validFiles.map(async (file, index) => {
        let preview: string | undefined

        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file)
        } else if (file.type.startsWith('video/')) {
          try {
            preview = await generateVideoThumbnail(file)
          } catch (error) {
            console.error('Failed to generate video thumbnail:', error)
            preview = undefined
          }
        }

        return {
          id: generateId(),
          file,
          caption: '',
          isCover: media.length === 0 && index === 0, // First item is cover by default
          order: media.length + index,
          preview
        }
      })
    )

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
      setRecordingMode('photo')
      
      // Check if we're on a mobile device or web
      const isNative = Capacitor.isNativePlatform()
      
      if (isNative) {
        // Use native camera on mobile
        const image = await CapacitorCamera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          saveToGallery: false
        })

        if (image.dataUrl) {
          const response = await fetch(image.dataUrl)
          const blob = await response.blob()
          const fileName = `camera-${Date.now()}.jpg`
          const file = new File([blob], fileName, { type: 'image/jpeg' })
          
          handleFiles([file])
        }
      } else {
        // Open camera interface for web
        await openCameraInterface()
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      // Fallback to file picker if camera fails
      fileInputRef.current?.click()
    } finally {
      setIsCapturing(false)
    }
  }

  const captureVideo = async () => {
    try {
      setIsCapturing(true)
      setRecordingMode('video')
      
      // For now, always use web interface for video recording
      await openCameraInterface()
    } catch (error) {
      console.error('Error accessing camera for video:', error)
      // Fallback to file picker if camera fails
      fileInputRef.current?.click()
    } finally {
      setIsCapturing(false)
    }
  }

  const openCameraInterface = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: { 
          facingMode: currentCamera, // Use selected camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }

      // Add audio for video recording
      if (recordingMode === 'video') {
        constraints.audio = true
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      setStream(mediaStream)
      setShowCamera(true)
      
      // Set video source when component renders
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          videoRef.current.srcObject = mediaStream
        }
      }, 100)
      
    } catch (error) {
      console.error('Error accessing camera:', error)
      fileInputRef.current?.click()
    }
  }

  const switchCamera = async () => {
    const newCamera = currentCamera === 'user' ? 'environment' : 'user'
    setCurrentCamera(newCamera)
    
    // Stop current stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    
    // Start new stream with different camera
    try {
      const constraints: MediaStreamConstraints = {
        video: { 
          facingMode: newCamera,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      }

      if (recordingMode === 'video') {
        constraints.audio = true
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error('Error switching camera:', error)
    }
  }

  const takePicture = () => {
    if (!videoRef.current || !stream) return

    // Create canvas and capture frame
    const canvas = document.createElement('canvas')
    const video = videoRef.current
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    
    // Always flip the canvas horizontally to match the mirrored preview
    ctx?.scale(-1, 1)
    ctx?.drawImage(video, -canvas.width, 0)
    
    // Convert to blob and file
    canvas.toBlob((blob) => {
      if (blob) {
        const fileName = `camera-${Date.now()}.jpg`
        const file = new File([blob], fileName, { type: 'image/jpeg' })
        handleFiles([file])
        closeCameraInterface()
      }
    }, 'image/jpeg', 0.9)
  }

  const startVideoRecording = () => {
    if (!stream) return

    try {
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm'
      })
      
      const chunks: BlobPart[] = []
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const fileName = `video-${Date.now()}.webm`
        const file = new File([blob], fileName, { type: 'video/webm' })
        handleFiles([file])
        closeCameraInterface()
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting video recording:', error)
    }
  }

  const stopVideoRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setMediaRecorder(null)
      setIsRecording(false)
    }
  }

  const closeCameraInterface = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    
    setShowCamera(false)
    setIsRecording(false)
    setMediaRecorder(null)
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
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
          disabled={media.length >= maxFiles}
          aria-label="Upload media files"
        />
        
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <div className="bg-muted rounded-full p-3">
              <Camera className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <Button
              variant="outline"
              onClick={capturePhoto}
              disabled={media.length >= maxFiles || isCapturing}
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              {isCapturing && recordingMode === 'photo' ? 'Opening Camera...' : 'Take Photo'}
            </Button>

            <Button
              variant="outline"
              onClick={captureVideo}
              disabled={media.length >= maxFiles || isCapturing}
              className="gap-2"
            >
              <Video className="h-4 w-4" />
              {isCapturing && recordingMode === 'video' ? 'Opening Camera...' : 'Record Video'}
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
                {item.preview ? (
                  <img
                    src={item.preview}
                    alt={item.caption || (item.file.type.startsWith('video/') ? 'Video thumbnail' : 'Uploaded image')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {item.file.type.startsWith('video/') ? (
                      <Video className="h-8 w-8 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                )}
                
                {/* Video indicator overlay */}
                {item.file.type.startsWith('video/') && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/50 rounded-full p-2">
                      <Video className="h-6 w-6 text-white" />
                    </div>
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

      {/* Camera Interface Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-black/90 text-white shrink-0">
            <h3 className="text-base font-semibold">
              {recordingMode === 'photo' ? 'Take Photo' : 'Record Video'}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={switchCamera}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title={`Switch to ${currentCamera === 'user' ? 'rear' : 'front'} camera`}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeCameraInterface}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Camera Preview - Limited height to ensure controls are visible */}
          <div className="flex-1 flex items-center justify-center bg-black min-h-0 max-h-[calc(100vh-8rem)]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          </div>

          {/* Controls - Always visible at bottom */}
          <div className="p-4 bg-black/90 flex justify-center shrink-0">
            {recordingMode === 'photo' ? (
              <Button
                onClick={takePicture}
                size="lg"
                className="bg-white text-black hover:bg-gray-200 rounded-full h-14 w-14 p-0"
                title="Take Photo"
              >
                <Camera className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                onClick={isRecording ? stopVideoRecording : startVideoRecording}
                size="lg"
                className={`rounded-full h-14 w-14 p-0 ${
                  isRecording 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-white text-black hover:bg-gray-200'
                }`}
                title={isRecording ? 'Stop Recording' : 'Start Recording'}
              >
                {isRecording ? (
                  <div className="w-3 h-3 bg-white rounded-sm" />
                ) : (
                  <div className="w-3 h-3 bg-red-600 rounded-full" />
                )}
              </Button>
            )}
          </div>
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