import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { X, Tag as TagIcon } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useWriteProtection } from '@/hooks/useWriteProtection'

interface Person {
  id: string
  full_name: string
}

interface PhotoTag {
  id: string
  person_id: string
  person_name: string
  position_x: number
  position_y: number
  position_width?: number
  position_height?: number
}

interface VisualPhotoTaggerProps {
  mediaId: string
  familyId: string
  imageUrl: string
  className?: string
}

export function VisualPhotoTagger({ mediaId, familyId, imageUrl, className }: VisualPhotoTaggerProps) {
  const [people, setPeople] = useState<Person[]>([])
  const [tags, setTags] = useState<PhotoTag[]>([])
  const [isTagging, setIsTagging] = useState(false)
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null)
  const [open, setOpen] = useState(false)
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const { checkWritePermission } = useWriteProtection()

  useEffect(() => {
    fetchPeople()
    fetchTags()
  }, [familyId, mediaId])

  const fetchPeople = async () => {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('id, full_name')
        .eq('family_id', familyId)
        .order('full_name', { ascending: true })

      if (error) throw error
      setPeople(data || [])
    } catch (error) {
      console.error('Error fetching people:', error)
    }
  }

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('entity_links')
        .select(`
          id,
          entity_id,
          position_x,
          position_y,
          position_width,
          position_height
        `)
        .eq('source_type', 'media')
        .eq('source_id', mediaId)
        .eq('entity_type', 'person')

      if (error) throw error

      if (data && data.length > 0) {
        const personIds = data.map(link => link.entity_id)
        const { data: peopleData, error: peopleError } = await supabase
          .from('people')
          .select('id, full_name')
          .in('id', personIds)

        if (peopleError) throw peopleError

        const peopleMap = new Map(peopleData?.map(p => [p.id, p.full_name]))

        setTags(data.map(link => ({
          id: link.id,
          person_id: link.entity_id,
          person_name: peopleMap.get(link.entity_id) || 'Unknown',
          position_x: link.position_x || 0,
          position_y: link.position_y || 0,
          position_width: link.position_width,
          position_height: link.position_height
        })).filter(tag => tag.position_x !== null && tag.position_y !== null))
      } else {
        setTags([])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTagging || !imageRef.current) return
    if (!checkWritePermission('tag_person')) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setPendingPosition({ x, y })
    setOpen(true)
  }

  const handleTagPerson = async (personId: string) => {
    if (!pendingPosition) return
    if (!checkWritePermission('tag_person')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('entity_links')
        .insert({
          source_type: 'media',
          source_id: mediaId,
          entity_type: 'person',
          entity_id: personId,
          family_id: familyId,
          created_by: user.id,
          position_x: pendingPosition.x,
          position_y: pendingPosition.y,
          position_width: 15,
          position_height: 20
        })

      if (error) throw error

      await fetchTags()
      setPendingPosition(null)
      setOpen(false)
      setIsTagging(false)
      
      toast({
        title: 'Person tagged',
        description: 'Tag has been added to this photo'
      })
    } catch (error) {
      console.error('Error tagging person:', error)
      toast({
        title: 'Error',
        description: 'Failed to tag person',
        variant: 'destructive'
      })
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    if (!checkWritePermission('untag_person')) return

    try {
      const { error } = await supabase
        .from('entity_links')
        .delete()
        .eq('id', tagId)

      if (error) throw error

      await fetchTags()
      
      toast({
        title: 'Tag removed',
        description: 'Person has been untagged from this photo'
      })
    } catch (error) {
      console.error('Error removing tag:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove tag',
        variant: 'destructive'
      })
    }
  }

  const isPersonTagged = (personId: string) => {
    return tags.some(tag => tag.person_id === personId)
  }

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">
          {tags.length > 0 ? `${tags.length} ${tags.length === 1 ? 'person' : 'people'} tagged` : 'No tags yet'}
        </div>
        <Button
          variant={isTagging ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setIsTagging(!isTagging)
            setPendingPosition(null)
          }}
        >
          <TagIcon className="h-4 w-4 mr-2" />
          {isTagging ? 'Cancel Tagging' : 'Tag People'}
        </Button>
      </div>

      <div 
        ref={imageRef}
        className={`relative overflow-hidden rounded-lg ${isTagging ? 'cursor-crosshair' : ''}`}
        onClick={handleImageClick}
      >
        <img 
          src={imageUrl} 
          alt="Photo" 
          className="w-full h-auto"
          draggable={false}
        />

        {/* Existing tags */}
        {tags.map(tag => (
          <div
            key={tag.id}
            className="absolute transition-opacity"
            style={{
              left: `${tag.position_x}%`,
              top: `${tag.position_y}%`,
              width: tag.position_width ? `${tag.position_width}%` : 'auto',
              height: tag.position_height ? `${tag.position_height}%` : 'auto',
              transform: 'translate(-50%, -50%)'
            }}
            onMouseEnter={() => setHoveredTag(tag.id)}
            onMouseLeave={() => setHoveredTag(null)}
          >
            {/* Tag box */}
            <div 
              className="absolute inset-0 border-2 border-white rounded shadow-lg"
              style={{
                boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
              }}
            />
            
            {/* Tag label */}
            <div 
              className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 transition-opacity ${
                hoveredTag === tag.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <Badge 
                variant="secondary" 
                className="shadow-lg whitespace-nowrap flex items-center gap-1 pr-1"
              >
                {tag.person_name}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveTag(tag.id)
                  }}
                  className="hover:bg-destructive/20 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          </div>
        ))}

        {/* Pending tag position */}
        {pendingPosition && (
          <div
            className="absolute w-4 h-4 bg-white border-2 border-primary rounded-full"
            style={{
              left: `${pendingPosition.x}%`,
              top: `${pendingPosition.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
          />
        )}

        {/* Tagging instruction overlay */}
        {isTagging && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 px-4 py-2 rounded-lg text-sm font-medium">
              Click on a face to tag someone
            </div>
          </div>
        )}
      </div>

      {/* Person selection popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="hidden" />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Search people..." />
            <CommandList>
              <CommandEmpty>No people found.</CommandEmpty>
              <CommandGroup>
                {people.map(person => (
                  <CommandItem
                    key={person.id}
                    onSelect={() => handleTagPerson(person.id)}
                    disabled={isPersonTagged(person.id)}
                  >
                    {person.full_name}
                    {isPersonTagged(person.id) && (
                      <span className="ml-2 text-xs text-muted-foreground">(already tagged)</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
