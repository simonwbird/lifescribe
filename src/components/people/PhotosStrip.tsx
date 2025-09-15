import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, Eye } from 'lucide-react'
import { Person } from '@/utils/personUtils'

interface PhotosStripProps {
  person: Person
}

export function PhotosStrip({ person }: PhotosStripProps) {
  // TODO: Fetch actual photos for this person
  const photos: any[] = []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Photos
        </CardTitle>
        {photos.length > 0 && (
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View all
          </Button>
        )}
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