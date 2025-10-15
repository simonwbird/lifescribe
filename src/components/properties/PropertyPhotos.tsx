import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, Star, Trash2, Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'

interface PropertyPhoto {
  id: string
  file_path: string
  property_media_role: string | null
  created_at: string
}

interface PropertyPhotosProps {
  propertyId: string
  familyId: string
  coverId?: string | null
  onCoverChange?: (mediaId: string) => void
}

export function PropertyPhotos({ propertyId, familyId, coverId, onCoverChange }: PropertyPhotosProps) {
  const [photos, setPhotos] = useState<PropertyPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletePhotoId, setDeletePhotoId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchPhotos()
  }, [propertyId])

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('id, file_path, property_media_role, created_at')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPhotos(data || [])
    } catch (error) {
      console.error('Error fetching photos:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load property photos'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      for (const file of Array.from(files)) {
        // Upload to storage
        const fileExt = file.name.split('.').pop()
        const filePath = `${familyId}/${crypto.randomUUID()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Create media record
        const { error: insertError } = await supabase
          .from('media')
          .insert({
            file_path: filePath,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            family_id: familyId,
            profile_id: user.id,
            property_id: propertyId,
            property_media_role: photos.length === 0 && !coverId ? 'cover' : null
          })

        if (insertError) throw insertError
      }

      toast({
        title: 'Success',
        description: `${files.length} photo${files.length > 1 ? 's' : ''} uploaded`
      })
      
      fetchPhotos()
    } catch (error) {
      console.error('Error uploading photos:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to upload photos'
      })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSetCover = async (mediaId: string) => {
    try {
      // Update the property's cover_media_id
      const { error: propError } = await supabase
        .from('properties')
        .update({ cover_media_id: mediaId })
        .eq('id', propertyId)

      if (propError) throw propError

      // Update the media role
      const { error: mediaError } = await supabase
        .from('media')
        .update({ property_media_role: 'cover' })
        .eq('id', mediaId)

      if (mediaError) throw mediaError

      // Remove cover role from other photos
      await supabase
        .from('media')
        .update({ property_media_role: null })
        .eq('property_id', propertyId)
        .neq('id', mediaId)
        .eq('property_media_role', 'cover')

      toast({
        title: 'Cover photo updated',
        description: 'This photo is now the property thumbnail'
      })

      if (onCoverChange) onCoverChange(mediaId)
      fetchPhotos()
    } catch (error) {
      console.error('Error setting cover:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to set cover photo'
      })
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const photo = photos.find(p => p.id === photoId)
      if (!photo) return

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([photo.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('media')
        .delete()
        .eq('id', photoId)

      if (dbError) throw dbError

      toast({
        title: 'Photo deleted',
        description: 'Photo removed from property'
      })
      
      fetchPhotos()
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete photo'
      })
    } finally {
      setDeletePhotoId(null)
    }
  }

  const getPhotoUrl = (filePath: string) => {
    const { data } = supabase.storage.from('media').getPublicUrl(filePath)
    return data.publicUrl
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading photos...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Property Photos</CardTitle>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="absolute inset-0 opacity-0 cursor-pointer"
              id="photo-upload"
            />
            <Button size="sm" disabled={uploading}>
              {uploading ? (
                'Uploading...'
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Add Photos
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {photos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No photos yet</p>
              <p className="text-sm">Upload photos to create a gallery for this property</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={getPhotoUrl(photo.file_path)}
                    alt="Property photo"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  
                  {/* Cover badge */}
                  {photo.id === coverId && (
                    <Badge className="absolute top-2 left-2" variant="default">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Cover
                    </Badge>
                  )}

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    {photo.id !== coverId && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSetCover(photo.id)}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Set Cover
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeletePhotoId(photo.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletePhotoId} onOpenChange={() => setDeletePhotoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this photo? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePhotoId && handleDeletePhoto(deletePhotoId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
