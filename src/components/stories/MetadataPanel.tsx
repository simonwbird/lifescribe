import { useState, useEffect } from 'react'
import { X, Check, Users, Calendar, MapPin, Tag, FileAudio, Image, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useAnalytics } from '@/hooks/useAnalytics'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface MetadataSuggestion {
  people: string[]
  dates: string[]
  places: string[]
  tags: string[]
}

interface MetadataPanelProps {
  isOpen: boolean
  onClose: () => void
  storyId?: string
  transcript?: string
  promptId?: string
  familyId: string
}

export function MetadataPanel({
  isOpen,
  onClose,
  storyId,
  transcript,
  promptId,
  familyId
}: MetadataPanelProps) {
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [date, setDate] = useState<string>('')
  const [place, setPlace] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])
  const [source, setSource] = useState<'audio' | 'photo' | null>('audio')
  const [suggestions, setSuggestions] = useState<MetadataSuggestion>({ people: [], dates: [], places: [], tags: [] })
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [availablePeople, setAvailablePeople] = useState<Array<{ id: string; full_name: string }>>([])
  const [showPeoplePopover, setShowPeoplePopover] = useState(false)
  const [peopleSearch, setPeopleSearch] = useState('')
  
  const { track } = useAnalytics()
  const { toast } = useToast()

  // Load available people from family
  useEffect(() => {
    if (isOpen && familyId) {
      loadFamilyPeople()
    }
  }, [isOpen, familyId])

  // Extract metadata suggestions from transcript
  useEffect(() => {
    if (isOpen && transcript && transcript.length > 0) {
      extractMetadata()
    }
  }, [isOpen, transcript])

  const loadFamilyPeople = async () => {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('id, given_name, surname')
        .eq('family_id', familyId)
        .order('given_name')

      if (error) throw error

      const formatted = data?.map(p => ({
        id: p.id,
        full_name: `${p.given_name} ${p.surname || ''}`.trim()
      })) || []

      setAvailablePeople(formatted)
    } catch (error) {
      console.error('Error loading people:', error)
    }
  }

  const extractMetadata = async () => {
    if (!transcript) return
    
    setIsExtracting(true)
    track({
      event_name: 'metadata_extraction_start',
      properties: {
        prompt_id: promptId,
        transcript_length: transcript.length
      }
    } as any)

    try {
      // Call edge function to extract metadata using AI
      const { data, error } = await supabase.functions.invoke('extract-metadata', {
        body: {
          transcript,
          familyId
        }
      })

      if (error) throw error

      if (data?.suggestions) {
        setSuggestions(data.suggestions)
        
        // Auto-populate if high confidence
        if (data.suggestions.dates?.length > 0) {
          setDate(data.suggestions.dates[0])
        }
        if (data.suggestions.places?.length > 0) {
          setPlace(data.suggestions.places[0])
        }
        if (data.suggestions.tags?.length > 0) {
          setTags(data.suggestions.tags.slice(0, 3))
        }

        track({
          event_name: 'metadata_extraction_complete',
          properties: {
            prompt_id: promptId,
            suggestions_count: Object.keys(data.suggestions).reduce((acc, key) => 
              acc + (data.suggestions[key]?.length || 0), 0
            )
          }
        } as any)
      }
    } catch (error) {
      console.error('Error extracting metadata:', error)
      toast({
        title: 'Extraction failed',
        description: 'Could not auto-extract metadata. You can still add it manually.',
        variant: 'destructive'
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleAcceptSuggestion = (type: keyof MetadataSuggestion, value: string) => {
    track({
      event_name: 'metadata_suggestion_accepted',
      properties: {
        type,
        value
      }
    } as any)

    switch (type) {
      case 'dates':
        setDate(value)
        break
      case 'places':
        setPlace(value)
        break
      case 'tags':
        if (!tags.includes(value)) {
          setTags([...tags, value])
        }
        break
      case 'people':
        // Try to find matching person
        const match = availablePeople.find(p => 
          p.full_name.toLowerCase().includes(value.toLowerCase())
        )
        if (match && !selectedPeople.includes(match.id)) {
          setSelectedPeople([...selectedPeople, match.id])
        }
        break
    }
  }

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      const metadata = {
        people_ids: selectedPeople,
        date_occurred: date || null,
        place: place || null,
        tags: tags,
        source: source,
        extracted_at: new Date().toISOString()
      }

      // Save metadata to story
      if (storyId) {
        const { error } = await supabase
          .from('stories')
          .update({
            metadata: metadata,
            updated_at: new Date().toISOString()
          })
          .eq('id', storyId)

        if (error) throw error

        // Create entity links for people
        for (const personId of selectedPeople) {
          await supabase.from('entity_links').insert({
            source_type: 'story',
            source_id: storyId,
            entity_type: 'person',
            entity_id: personId,
            family_id: familyId,
            created_by: (await supabase.auth.getUser()).data.user?.id
          })
        }
      }

      track({
        event_name: 'metadata_saved',
        properties: {
          prompt_id: promptId,
          people_count: selectedPeople.length,
          has_date: !!date,
          has_place: !!place,
          tags_count: tags.length,
          source
        }
      } as any)

      toast({
        title: 'Metadata saved',
        description: 'Story details have been updated.'
      })

      onClose()
    } catch (error) {
      console.error('Error saving metadata:', error)
      toast({
        title: 'Save failed',
        description: 'Could not save metadata. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-background border-l shadow-2xl z-50 animate-slide-in-right">
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Add Story Details</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enrich your story with context
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Extraction Status */}
          {isExtracting && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
              <Sparkles className="h-4 w-4 animate-pulse text-primary" />
              <span className="text-sm text-muted-foreground">
                Auto-extracting details from your story...
              </span>
            </div>
          )}

          <Separator />

          {/* People Field */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              People Mentioned
            </Label>
            
            <Popover open={showPeoplePopover} onOpenChange={setShowPeoplePopover}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {selectedPeople.length === 0 ? (
                    <span className="text-muted-foreground">Select people...</span>
                  ) : (
                    <span>{selectedPeople.length} selected</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search people..." value={peopleSearch} onValueChange={setPeopleSearch} />
                  <CommandEmpty>No person found.</CommandEmpty>
                  <CommandGroup>
                    {availablePeople.map((person) => (
                      <CommandItem
                        key={person.id}
                        onSelect={() => {
                          if (selectedPeople.includes(person.id)) {
                            setSelectedPeople(selectedPeople.filter(p => p !== person.id))
                          } else {
                            setSelectedPeople([...selectedPeople, person.id])
                          }
                        }}
                      >
                        <div className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          selectedPeople.includes(person.id)
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50"
                        )}>
                          {selectedPeople.includes(person.id) && <Check className="h-3 w-3" />}
                        </div>
                        {person.full_name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {/* AI Suggestions for People */}
            {suggestions.people.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Detected names:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.people.map((person, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcceptSuggestion('people', person)}
                      className="h-7 text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {person}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected People */}
            {selectedPeople.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedPeople.map((personId) => {
                  const person = availablePeople.find(p => p.id === personId)
                  return person ? (
                    <Badge key={personId} variant="secondary">
                      {person.full_name}
                      <button
                        onClick={() => setSelectedPeople(selectedPeople.filter(p => p !== personId))}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null
                })}
              </div>
            )}
          </div>

          {/* Date Field */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="When did this happen?"
            />
            
            {/* AI Suggestions for Dates */}
            {suggestions.dates.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Detected dates:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.dates.map((detectedDate, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcceptSuggestion('dates', detectedDate)}
                      className="h-7 text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {detectedDate}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Place Field */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Place
            </Label>
            <Input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Where did this happen?"
            />
            
            {/* AI Suggestions for Places */}
            {suggestions.places.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Detected locations:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.places.map((detectedPlace, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcceptSuggestion('places', detectedPlace)}
                      className="h-7 text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {detectedPlace}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags Field */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </Label>
            <Input
              placeholder="Add a tag and press Enter"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
            />
            
            {/* AI Suggestions for Tags */}
            {suggestions.tags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Suggested tags:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.tags.map((tag, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcceptSuggestion('tags', tag)}
                      className="h-7 text-xs"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Source Field */}
          <div className="space-y-3">
            <Label>Source Type</Label>
            <div className="flex gap-2">
              <Button
                variant={source === 'audio' ? 'default' : 'outline'}
                onClick={() => setSource('audio')}
                className="flex-1"
              >
                <FileAudio className="h-4 w-4 mr-2" />
                Audio
              </Button>
              <Button
                variant={source === 'photo' ? 'default' : 'outline'}
                onClick={() => setSource('photo')}
                className="flex-1"
              >
                <Image className="h-4 w-4 mr-2" />
                Photo
              </Button>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save Details'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Skip
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            GEDCOM-compatible formatting for genealogy exports
          </p>
        </div>
      </ScrollArea>
    </div>
  )
}
