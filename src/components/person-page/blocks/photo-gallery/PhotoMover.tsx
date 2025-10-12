import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { FolderOpen, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PhotoMoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  photo: any
  albums: any[]
  currentAlbumId: string
  onMove: (photoId: string, targetAlbumId: string) => void
}

export function PhotoMover({
  open,
  onOpenChange,
  photo,
  albums,
  currentAlbumId,
  onMove
}: PhotoMoverProps) {
  const { toast } = useToast()
  const [selectedAlbumId, setSelectedAlbumId] = useState(currentAlbumId)

  const handleMove = () => {
    if (selectedAlbumId === currentAlbumId) {
      toast({
        title: "No change",
        description: "Photo is already in this album",
        variant: "destructive"
      })
      return
    }

    onMove(photo.id, selectedAlbumId)
    toast({
      title: "Photo moved",
      description: `Moved to ${albums.find(a => a.id === selectedAlbumId)?.name}`
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Move Photo to Album
          </DialogTitle>
          <DialogDescription>
            Select the album you want to move this photo to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo Preview */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="w-16 h-16 rounded overflow-hidden bg-background shrink-0">
              <img
                src={photo.file_path}
                alt={photo.caption || 'Photo'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {photo.caption || photo.story_title || 'Photo'}
              </p>
              <p className="text-xs text-muted-foreground">
                Current album: {albums.find(a => a.id === currentAlbumId)?.name}
              </p>
            </div>
          </div>

          {/* Album Selection */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {albums.map((album) => (
              <Card
                key={album.id}
                className={`cursor-pointer transition-all ${
                  selectedAlbumId === album.id
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedAlbumId(album.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {album.cover && (
                        <div className="w-10 h-10 rounded overflow-hidden bg-muted shrink-0">
                          <img
                            src={album.cover.file_path}
                            alt={album.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{album.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {album.count} {album.count === 1 ? 'photo' : 'photos'}
                        </p>
                      </div>
                    </div>
                    {selectedAlbumId === album.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMove}
              disabled={selectedAlbumId === currentAlbumId}
              className="flex-1"
            >
              Move Photo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
