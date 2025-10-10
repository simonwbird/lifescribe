import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FolderOpen, 
  Plus, 
  Edit2, 
  Trash2,
  Save,
  X
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AlbumManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  albums: any[]
  personId: string
  familyId: string
  onUpdate: () => void
}

export function AlbumManager({
  open,
  onOpenChange,
  albums,
  personId,
  familyId,
  onUpdate
}: AlbumManagerProps) {
  const { toast } = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [newAlbumName, setNewAlbumName] = useState('')

  const handleStartEdit = (album: any) => {
    setEditingId(album.id)
    setEditingName(album.name)
  }

  const handleSaveEdit = (albumId: string) => {
    // TODO: Save album name to database
    toast({
      title: "Album renamed",
      description: `Album renamed to "${editingName}"`
    })
    setEditingId(null)
    onUpdate()
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleCreateAlbum = () => {
    if (!newAlbumName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter an album name",
        variant: "destructive"
      })
      return
    }

    // TODO: Create custom album in database
    toast({
      title: "Album created",
      description: `Created album "${newAlbumName}"`
    })
    setNewAlbumName('')
    onUpdate()
  }

  const handleDeleteAlbum = (albumId: string, albumName: string) => {
    if (!confirm(`Delete album "${albumName}"? Photos will not be deleted.`)) {
      return
    }

    // TODO: Delete custom album from database
    toast({
      title: "Album deleted",
      description: `Deleted album "${albumName}"`
    })
    onUpdate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center gap-2">
            <FolderOpen className="h-6 w-6" />
            Manage Albums
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Album */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="New album name (e.g., 'Family Gatherings')"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateAlbum()
                    }
                  }}
                />
                <Button onClick={handleCreateAlbum} className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" />
                  Create
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Create custom albums to organize photos beyond decades
              </p>
            </CardContent>
          </Card>

          {/* Existing Albums */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Existing Albums</h3>
              <Badge variant="secondary">
                {albums.length} {albums.length === 1 ? 'album' : 'albums'}
              </Badge>
            </div>

            <div className="space-y-2">
              {albums.map((album) => (
                <Card key={album.id}>
                  <CardContent className="p-3">
                    {editingId === album.id ? (
                      // Edit Mode
                      <div className="flex items-center gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveEdit(album.id)
                            } else if (e.key === 'Escape') {
                              handleCancelEdit()
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSaveEdit(album.id)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      // View Mode
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {album.cover && (
                            <div className="w-12 h-12 rounded overflow-hidden bg-muted shrink-0">
                              <img
                                src={album.cover.file_path}
                                alt={album.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{album.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {album.count} {album.count === 1 ? 'photo' : 'photos'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleStartEdit(album)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {!album.id.endsWith('s') && ( // Don't allow deleting decade albums
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteAlbum(album.id, album.name)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-4 border-t">
            <p className="font-semibold mb-2">About Albums:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Decade albums are created automatically from photo dates</li>
              <li>Custom albums can be created for specific themes or events</li>
              <li>Deleting an album doesn't delete the photos themselves</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
