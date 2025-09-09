import { useState, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Upload, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { getSignedMediaUrl, uploadMediaFile } from '@/lib/media'

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-20 w-20',
    lg: 'h-32 w-32'
  }

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
          <AvatarImage src={currentPhotoUrl} alt="Profile" />
          <AvatarFallback className="text-lg font-semibold">
            {fallbackText}
          </AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full">
          <Camera className="h-6 w-6 text-white" />
        </div>
      </div>

      <div className="flex flex-col items-center space-y-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {currentPhotoUrl ? 'Change Photo' : 'Upload Photo'}
        </Button>
        
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
    </div>
  )
}