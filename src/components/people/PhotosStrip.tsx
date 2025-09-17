import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, Eye, Upload, Plus } from 'lucide-react'
import { Person } from '@/utils/personUtils'
import ProfilePhotoUploader from '@/components/ProfilePhotoUploader'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface PhotosStripProps {
  person: Person
}

export function PhotosStrip({ person }: PhotosStripProps) {
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()
  
  // TODO: Fetch actual photos for this person
  const photos: any[] = []

  const handlePhotoUploaded = async (newPhotoUrl: string) => {
    try {
      // TODO: Add photo to person's photo collection in database
      toast({
        title: "Photo uploaded",
        description: "The photo has been added to the collection."
      })
    } catch (error) {
      console.error('Failed to save photo:', error)
      toast({
        title: "Upload failed", 
        description: "Could not save the photo.",
        variant: "destructive"
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-dashed border-muted-foreground/20 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <Camera className="h-5 w-5" />
          <div>
            <CardTitle className="text-base">Photos</CardTitle>
            <p className="text-xs text-muted-foreground">Click to add photos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {photos.length > 0 && (
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View all ({photos.length})
            </Button>
          )}
          
          <ProfilePhotoUploader
            currentPhotoUrl=""
            fallbackText="+"
            onPhotoUploaded={handlePhotoUploaded}
            personId={person.id}
            size="sm"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-8">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No photos yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {/* TODO: Render photo thumbnails */}
            {photos.slice(0, 4).map((photo, index) => (
              <div key={index} className="aspect-square bg-muted rounded-lg" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}