import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Camera, Upload, Loader2, ChevronDown, Crop as CropIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getSignedMediaUrl, uploadMediaFile } from '@/lib/media'
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop, convertToPixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface ProfilePhotoUploaderProps {
  currentPhotoUrl?: string
  fallbackText: string
  onPhotoUploaded: (newPhotoUrl: string) => void
  personId?: string // For family tree people
  isUserProfile?: boolean // For user profiles
  size?: 'sm' | 'md' | 'lg'
}

export default function ProfilePhotoUploader({
  currentPhotoUrl,
  fallbackText,
  onPhotoUploaded,
  personId,
  isUserProfile = false,
  size = 'md'
}: ProfilePhotoUploaderProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [imgSrc, setImgSrc] = useState('')
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { toast } = useToast()

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-20 w-20',
    lg: 'h-32 w-32'
  }

  // Resolve and refresh signed URLs so expired links still display
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(currentPhotoUrl)
  useEffect(() => {
    let isMounted = true
    async function resolve() {
      if (!currentPhotoUrl) { setResolvedUrl(undefined); return }
      let url = currentPhotoUrl
      // If it's a Supabase signed URL, re-sign it to ensure freshness
      const m = url.match(/object\/sign\/([^/]+)\/([^?]+)/)
      if (m) {
        const bucket = m[1]
        const objectPath = decodeURIComponent(m[2])
        const { data } = await supabase.storage.from(bucket).createSignedUrl(objectPath, 3600)
        if (data?.signedUrl) url = data.signedUrl
      }
      if (!isMounted) return
      setResolvedUrl(url)
    }
    resolve()
    return () => { isMounted = false }
  }, [currentPhotoUrl])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      })
      return
    }

    await uploadPhoto(file)
  }

  const capturePhoto = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // Open in-app camera for web
        setCameraOpen(true)
        return
      }

      // For native platforms, use Capacitor Camera
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      })

      if (image.dataUrl) {
        // Convert data URL to File
        const response = await fetch(image.dataUrl)
        const blob = await response.blob()
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' })
        await uploadPhoto(file)
      }
    } catch (error) {
      console.error('Error capturing photo:', error)
      toast({
        title: "Camera error",
        description: "Failed to capture photo. Please try again.",
        variant: "destructive"
      })
    }
  }

  const selectFromGallery = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        // For web, fallback to file input
        fileInputRef.current?.click()
        return
      }

      // For native platforms, use gallery
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
      })

      if (image.dataUrl) {
        // Convert data URL to File
        const response = await fetch(image.dataUrl)
        const blob = await response.blob()
        const file = new File([blob], 'gallery-photo.jpg', { type: 'image/jpeg' })
        await uploadPhoto(file)
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error)
      toast({
        title: "Gallery error",
        description: "Failed to select photo. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Web camera control (for desktop/mobile web)
  const openFileCamera = () => {
    // Fallback to file input with camera hint (mobile browsers)
    const input = fileInputRef.current
    if (input) {
      try {
        input.setAttribute('capture', 'environment')
      } catch {}
      input.click()
    }
  }

  const startWebCamera = async () => {
    try {
      if (!('mediaDevices' in navigator) || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser')
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (video) {
        ;(video as any).srcObject = stream
        await (video as HTMLVideoElement).play().catch(() => {})
      }
    } catch (err) {
      console.error('Error starting camera', err)
      toast({
        title: 'Camera error',
        description: 'Unable to access your camera. Please check permissions.',
        variant: 'destructive'
      })
      setCameraOpen(false)
    }
  }

  const stopWebCamera = () => {
    const stream = streamRef.current
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    const video = videoRef.current
    if (video) {
      ;(video as any).srcObject = null
    }
  }

  const handleCapture = async () => {
    try {
      const video = videoRef.current
      if (!video) return
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 720
      canvas.height = video.videoHeight || 960
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Capture failed'))), 'image/jpeg', 0.9)
      )
      const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' })
      await uploadPhoto(file)
      setCameraOpen(false)
    } catch (error) {
      console.error('Capture error', error)
      toast({ title: 'Capture failed', description: 'Please try again.', variant: 'destructive' })
    } finally {
      stopWebCamera()
    }
  }

  useEffect(() => {
    if (cameraOpen) {
      startWebCamera()
    } else {
      stopWebCamera()
    }
    // Cleanup on unmount
    return () => stopWebCamera()
  }, [cameraOpen])

  const handleCrop = async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      toast({
        title: "Crop error",
        description: "Please adjust the crop area before applying",
        variant: "destructive"
      })
      return
    }

    const canvas = canvasRef.current
    const image = imgRef.current
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = completedCrop.width
    canvas.height = completedCrop.height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      toast({
        title: "Error",
        description: "Could not get canvas context",
        variant: "destructive"
      })
      return
    }

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    )

    canvas.toBlob((blob) => {
      if (!blob) {
        toast({
          title: "Error",
          description: "Failed to create cropped image",
          variant: "destructive"
        })
        return
      }
      const file = new File([blob], 'cropped-photo.jpg', { type: 'image/jpeg' })
      uploadPhoto(file)
      setEditDialogOpen(false)
    }, 'image/jpeg', 0.9)
  }

  const openEditDialog = () => {
    const src = resolvedUrl || currentPhotoUrl || ''
    if (!src) return
    setImgSrc(src)
    setEditDialogOpen(true)
  }

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    const pctCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1,
        width,
        height,
      ),
      width,
      height,
    )
    setCrop(pctCrop)
    // Also compute initial pixel crop so Apply works without manual adjustment
    const pxCrop = convertToPixelCrop(pctCrop, width, height)
    setCompletedCrop(pxCrop)
  }

  const uploadPhoto = async (file: File) => {
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Get family ID
      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (!member) throw new Error('No family membership found')

      // Upload file using the media utility
      const { path, error } = await uploadMediaFile(file, member.family_id, user.id)
      if (error) throw new Error(error)

      // Get signed URL for the uploaded file
      const signedUrl = await getSignedMediaUrl(path, member.family_id)
      if (!signedUrl) throw new Error('Failed to get signed URL')

      // Update the appropriate table with the new avatar URL
      if (isUserProfile) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: signedUrl })
          .eq('id', user.id)
        
        if (updateError) throw updateError
      } else if (personId) {
        const { error: updateError } = await supabase
          .from('people')
          .update({ avatar_url: signedUrl })
          .eq('id', personId)
          .eq('family_id', member.family_id)
        
        if (updateError) throw updateError
      }

      // Create media record for the uploaded file
      await supabase
        .from('media')
        .insert({
          profile_id: user.id,
          family_id: member.family_id,
          file_path: path,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          // Don't link to story/answer since this is a profile photo
        })

      onPhotoUploaded(signedUrl)
      
      toast({
        title: "Photo uploaded!",
        description: "Your profile photo has been updated successfully.",
      })

    } catch (error) {
      console.error('Error uploading photo:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload photo",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} cursor-pointer transition-opacity group-hover:opacity-75`}>
          <AvatarImage src={resolvedUrl} alt="Profile" />
          <AvatarFallback className="text-lg font-semibold">
            {fallbackText}
          </AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
        
        <div 
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full cursor-pointer"
          onClick={capturePhoto}
        >
          <Camera className="h-6 w-6 text-white" />
        </div>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              {currentPhotoUrl ? 'Change Photo' : 'Add Photo'}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-48">
            <DropdownMenuItem onClick={capturePhoto} className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Take Photo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={selectFromGallery} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Choose from Gallery
            </DropdownMenuItem>
            {currentPhotoUrl && (
              <DropdownMenuItem onClick={openEditDialog} className="flex items-center gap-2">
                <CropIcon className="h-4 w-4" />
                Edit Photo
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <p className="text-xs text-muted-foreground text-center">
          JPG, PNG or GIF (max 5MB)
        </p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* In-app camera for web */}
      <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Take a photo</DialogTitle>
            <DialogDescription>
              Allow camera access to capture a profile photo.
            </DialogDescription>
          </DialogHeader>
          <div className="relative w-full aspect-[3/4] bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCameraOpen(false)}>Cancel</Button>
            <Button onClick={handleCapture}>
              <Camera className="h-4 w-4 mr-2" />
              Capture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Photo crop editor */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
            <DialogDescription>
              Adjust the crop to recenter your photo. Square crop fits best.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
              {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                className="max-h-[400px] mx-auto"
              >
                <img
                  ref={imgRef}
                  alt="Crop"
                  src={imgSrc}
                  crossOrigin="anonymous"
                  style={{ maxHeight: 400 }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCrop} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply Crop'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}