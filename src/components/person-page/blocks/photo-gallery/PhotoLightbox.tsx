import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  FileText,
  Download,
  MoveHorizontal,
  Tag,
  Users,
  Search
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface FaceTag {
  id: string
  person_id: string
  person_name?: string
  x_percent: number
  y_percent: number
  width_percent: number
  height_percent: number
}

interface PhotoLightboxProps {
  photos: any[]
  initialIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
  canEdit?: boolean
  albums?: any[]
  currentAlbumId?: string
  onMovePhoto?: (photoId: string, targetAlbumId: string) => void
  familyId: string
  personId?: string
}

export function PhotoLightbox({
  photos,
  initialIndex,
  onClose,
  onNavigate,
  canEdit = false,
  albums = [],
  currentAlbumId = 'all',
  onMovePhoto,
  familyId,
  personId
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [showCaption, setShowCaption] = useState(true)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [faceTags, setFaceTags] = useState<FaceTag[]>([])
  const [showTagOverlay, setShowTagOverlay] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [showPersonSelector, setShowPersonSelector] = useState(false)
  const [pendingTag, setPendingTag] = useState<{ x: number, y: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const currentPhoto = photos[currentIndex]
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < photos.length - 1

  // Load face tags for current photo
  useEffect(() => {
    loadFaceTags()
  }, [currentIndex])

  // Load family members for tagging
  useEffect(() => {
    loadFamilyMembers()
  }, [familyId])

  const loadFaceTags = async () => {
    if (!currentPhoto?.id) return
    
    try {
      const { data, error } = await supabase
        .from('face_tags')
        .select('id, person_id, x_percent, y_percent, width_percent, height_percent')
        .eq('media_id', currentPhoto.id)

      if (error) {
        console.error('Error loading face tags:', error)
        return
      }

      // Get person names separately
      const personIds = [...new Set(data.map(tag => tag.person_id))]
      const { data: peopleData } = await supabase
        .from('people')
        .select('id, given_name, surname')
        .in('id', personIds)

      const peopleMap = new Map(
        peopleData?.map(p => [p.id, `${p.given_name} ${p.surname || ''}`.trim()]) || []
      )

      const tags = data.map(tag => ({
        id: tag.id,
        person_id: tag.person_id,
        person_name: peopleMap.get(tag.person_id) || 'Unknown',
        x_percent: tag.x_percent,
        y_percent: tag.y_percent,
        width_percent: tag.width_percent,
        height_percent: tag.height_percent
      }))

      setFaceTags(tags)
    } catch (error) {
      console.error('Failed to load face tags:', error)
    }
  }

  const loadFamilyMembers = async () => {
    if (!familyId) return
    
    try {
      const { data, error } = await supabase
        .from('people')
        .select('id, given_name, surname')
        .eq('family_id', familyId)
        .order('given_name')

      if (error) throw error
      setFamilyMembers(data || [])
    } catch (error) {
      console.error('Error loading family members:', error)
    }
  }

  const handleImageClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!canEdit || !showTagOverlay) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x_percent = ((e.clientX - rect.left) / rect.width) * 100
    const y_percent = ((e.clientY - rect.top) / rect.height) * 100

    // Store the click coordinates and show person selector
    setPendingTag({ x: x_percent, y: y_percent })
    setShowPersonSelector(true)
  }

  const handleSelectPerson = async (selectedPersonId: string) => {
    if (!pendingTag) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('face_tags')
        .insert({
          media_id: currentPhoto.id,
          person_id: selectedPersonId,
          family_id: familyId,
          created_by: user.id,
          x_percent: pendingTag.x,
          y_percent: pendingTag.y,
          width_percent: 10,
          height_percent: 10
        })

      if (error) throw error
      
      toast.success('Person tagged!')
      setShowPersonSelector(false)
      setPendingTag(null)
      setSearchQuery('')
      loadFaceTags()
    } catch (error) {
      console.error('Error creating face tag:', error)
      toast.error('Failed to tag person')
    }
  }

  const filteredMembers = familyMembers.filter(member => {
    const fullName = `${member.given_name} ${member.surname || ''}`.toLowerCase()
    return fullName.includes(searchQuery.toLowerCase())
  })

  const handleDeleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('face_tags')
        .delete()
        .eq('id', tagId)

      if (error) throw error
      
      toast.success('Tag removed')
      loadFaceTags()
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error('Failed to remove tag')
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for arrow keys to avoid page scrolling
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
      }

      if (e.key === 'ArrowLeft' && hasPrev) {
        goToPrevious()
      } else if (e.key === 'ArrowRight' && hasNext) {
        goToNext()
      } else if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'c' || e.key === 'C') {
        // Toggle caption with 'c' key
        setShowCaption(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, hasPrev, hasNext])

  const goToPrevious = () => {
    if (hasPrev) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      onNavigate(newIndex)
    }
  }

  const goToNext = () => {
    if (hasNext) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      onNavigate(newIndex)
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    const href = currentPhoto.url || currentPhoto.file_path
    link.href = href
    link.download = `photo-${currentPhoto.id}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] h-[95vh] p-0 overflow-hidden bg-black/95">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <Badge variant="secondary" className="bg-white/20 text-white">
                {currentIndex + 1} / {photos.length}
              </Badge>
              {currentPhoto.story_title && (
                <span className="text-sm font-medium">
                  {currentPhoto.story_title}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowTagOverlay(!showTagOverlay)}
                  className={cn(
                    "text-white hover:bg-white/20",
                    showTagOverlay && "bg-white/30"
                  )}
                  title="Tag people"
                >
                  <Tag className="h-5 w-5" />
                </Button>
              )}
              {faceTags.length > 0 && (
                <Badge variant="secondary" className="bg-white/20 text-white gap-1">
                  <Users className="h-3 w-3" />
                  {faceTags.length}
                </Badge>
              )}
              {canEdit && albums.length > 0 && onMovePhoto && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowMoveDialog(true)}
                  className="text-white hover:bg-white/20"
                  title="Move to album"
                >
                  <MoveHorizontal className="h-5 w-5" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDownload}
                className="text-white hover:bg-white/20"
              >
                <Download className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Image */}
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={currentPhoto.url || currentPhoto.file_path}
            alt={currentPhoto.caption || currentPhoto.story_title || 'Photo'}
            className="max-w-full max-h-full object-contain cursor-crosshair"
            onClick={handleImageClick}
          />

          {/* Face Tags Overlay */}
          {faceTags.map((tag) => (
            <div
              key={tag.id}
              className="absolute pointer-events-none"
              style={{
                left: `${tag.x_percent}%`,
                top: `${tag.y_percent}%`,
                width: `${tag.width_percent}%`,
                height: `${tag.height_percent}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="relative w-full h-full">
                <div className="absolute inset-0 border-2 border-white rounded-full shadow-lg" />
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
                  {tag.person_name}
                  {canEdit && (
                    <button
                      className="ml-2 pointer-events-auto hover:text-red-400"
                      onClick={() => handleDeleteTag(tag.id)}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Navigation Buttons */}
          {hasPrev && (
            <Button
              size="icon"
              variant="ghost"
              onClick={goToPrevious}
              className="absolute left-4 text-white hover:bg-white/20 h-12 w-12"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}
          {hasNext && (
            <Button
              size="icon"
              variant="ghost"
              onClick={goToNext}
              className="absolute right-4 text-white hover:bg-white/20 h-12 w-12"
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}
        </div>

        {/* Caption Footer */}
        {showCaption && (currentPhoto.caption || currentPhoto.date || currentPhoto.story_title) && (
          <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="max-w-3xl mx-auto space-y-2">
              {currentPhoto.caption && (
                <p className="text-white text-lg leading-relaxed">
                  {currentPhoto.caption}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-white/80">
                {currentPhoto.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(currentPhoto.date), 'MMMM d, yyyy')}
                  </div>
                )}
                {currentPhoto.story_title && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    From: {currentPhoto.story_title}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

          {/* Keyboard hints */}
        <div className="absolute bottom-4 right-4 text-xs text-white/60 space-y-1">
          <div>← → to navigate</div>
          <div>C to toggle caption</div>
          <div>ESC to close</div>
        </div>

        {/* Person Selector Dialog */}
        {showPersonSelector && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background rounded-lg shadow-xl w-full max-w-md mx-4">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Tag Person</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a family member or search for a name
                </p>
              </div>
              <div className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search family members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                </div>
                <div className="max-h-[300px] overflow-y-auto space-y-1">
                  {filteredMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No family members found
                    </p>
                  ) : (
                    filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleSelectPerson(member.id)}
                        className="w-full text-left px-4 py-3 rounded-md hover:bg-accent transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {member.given_name[0]}{member.surname?.[0] || ''}
                        </div>
                        <span className="font-medium">
                          {member.given_name} {member.surname || ''}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="p-4 border-t flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPersonSelector(false)
                    setPendingTag(null)
                    setSearchQuery('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
