import { useState, useEffect } from 'react'
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
import { Tag, X, Check } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useWriteProtection } from '@/hooks/useWriteProtection'

interface Person {
  id: string
  full_name: string
  preferred_name: string | null
}

interface PhotoTaggerProps {
  mediaId: string
  familyId: string
  existingTags?: string[]
  onTagsUpdated?: () => void
}

export function PhotoTagger({ mediaId, familyId, existingTags = [], onTagsUpdated }: PhotoTaggerProps) {
  const [people, setPeople] = useState<Person[]>([])
  const [taggedPeople, setTaggedPeople] = useState<Person[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { checkWritePermission } = useWriteProtection()

  useEffect(() => {
    fetchPeople()
    fetchTaggedPeople()
  }, [familyId, mediaId])

  const fetchPeople = async () => {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('id, full_name')
        .eq('family_id', familyId)
        .order('full_name', { ascending: true })

      if (error) throw error
      setPeople((data || []).map(p => ({ ...p, preferred_name: null })))
    } catch (error) {
      console.error('Error fetching people:', error)
    }
  }

  const fetchTaggedPeople = async () => {
    try {
      const { data, error } = await supabase
        .from('entity_links')
        .select('entity_id')
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
        setTaggedPeople((peopleData || []).map(p => ({ ...p, preferred_name: null })))
      } else {
        setTaggedPeople([])
      }
    } catch (error) {
      console.error('Error fetching tagged people:', error)
    }
  }

  const handleTag = async (personId: string) => {
    if (!checkWritePermission('tag_person')) return

    setLoading(true)
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
          created_by: user.id
        })

      if (error) throw error

      await fetchTaggedPeople()
      onTagsUpdated?.()
      
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
    } finally {
      setLoading(false)
    }
  }

  const handleUntag = async (personId: string) => {
    if (!checkWritePermission('untag_person')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('entity_links')
        .delete()
        .eq('source_type', 'media')
        .eq('source_id', mediaId)
        .eq('entity_type', 'person')
        .eq('entity_id', personId)

      if (error) throw error

      await fetchTaggedPeople()
      onTagsUpdated?.()
      
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
    } finally {
      setLoading(false)
    }
  }

  const isPersonTagged = (personId: string) => {
    return taggedPeople.some(p => p.id === personId)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {taggedPeople.map(person => (
          <Badge key={person.id} variant="secondary" className="gap-1">
            {person.preferred_name || person.full_name}
            <button
              onClick={() => handleUntag(person.id)}
              className="ml-1 hover:text-destructive"
              disabled={loading}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 gap-1">
              <Tag className="h-3 w-3" />
              Tag People
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search people..." />
              <CommandList>
                <CommandEmpty>No people found.</CommandEmpty>
                <CommandGroup>
                  {people.map(person => {
                    const tagged = isPersonTagged(person.id)
                    return (
                      <CommandItem
                        key={person.id}
                        onSelect={() => {
                          if (tagged) {
                            handleUntag(person.id)
                          } else {
                            handleTag(person.id)
                          }
                        }}
                        disabled={loading}
                      >
                        <Check 
                          className={`mr-2 h-4 w-4 ${tagged ? 'opacity-100' : 'opacity-0'}`}
                        />
                        {person.preferred_name || person.full_name}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
