import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, X, Plus, Tags } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagSelectorProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  familyId: string | null
}

export default function TagSelector({ selectedTags, onTagsChange, familyId }: TagSelectorProps) {
  const [open, setOpen] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (familyId) {
      fetchExistingTags()
    }
  }, [familyId])

  const fetchExistingTags = async () => {
    if (!familyId) return
    
    setIsLoading(true)
    try {
      // Get all unique tags from stories in this family
      const { data: stories, error } = await supabase
        .from('stories')
        .select('tags')
        .eq('family_id', familyId)
        .not('tags', 'is', null)

      if (error) throw error

      // Extract unique tags
      const allTags = new Set<string>()
      stories?.forEach(story => {
        if (story.tags && Array.isArray(story.tags)) {
          story.tags.forEach(tag => allTags.add(tag))
        }
      })

      setAvailableTags(Array.from(allTags).sort())
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase()
    if (normalizedTag && !selectedTags.includes(normalizedTag)) {
      onTagsChange([...selectedTags, normalizedTag])
    }
    setInputValue('')
    setOpen(false)
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagToRemove))
  }

  const handleCreateNew = () => {
    if (inputValue.trim()) {
      handleAddTag(inputValue.trim())
    }
  }

  const filteredTags = availableTags.filter(tag => 
    tag.toLowerCase().includes(inputValue.toLowerCase()) &&
    !selectedTags.includes(tag)
  )

  const suggestedTags = [
    'childhood', 'family-tradition', 'holiday', 'vacation', 'school', 
    'work', 'milestone', 'funny', 'heartwarming', 'recipe', 'advice'
  ].filter(tag => 
    !selectedTags.includes(tag) && 
    !availableTags.includes(tag) &&
    tag.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <div className="space-y-2">
      <Label>Tags</Label>
      <div className="space-y-3">
        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1 pr-1">
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Tag Input/Selector */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between text-muted-foreground"
            >
              <div className="flex items-center">
                <Tags className="mr-2 h-4 w-4" />
                Add tags to help organize your story...
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-background border shadow-lg" align="start">
            <Command>
              <CommandInput 
                placeholder="Search tags or type to create new..." 
                value={inputValue}
                onValueChange={setInputValue}
              />
              <CommandList>
                {filteredTags.length === 0 && suggestedTags.length === 0 && inputValue.trim() === '' && (
                  <CommandEmpty>
                    {isLoading ? 'Loading tags...' : 'No tags found. Start typing to create one.'}
                  </CommandEmpty>
                )}

                {/* Existing Family Tags */}
                {filteredTags.length > 0 && (
                  <CommandGroup heading="Family Tags">
                    {filteredTags.map((tag) => (
                      <CommandItem
                        key={tag}
                        value={tag}
                        onSelect={() => handleAddTag(tag)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTags.includes(tag) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <Tags className="mr-2 h-3 w-3 text-muted-foreground" />
                        {tag}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Suggested Tags */}
                {suggestedTags.length > 0 && (
                  <CommandGroup heading="Suggested Tags">
                    {suggestedTags.map((tag) => (
                      <CommandItem
                        key={tag}
                        value={tag}
                        onSelect={() => handleAddTag(tag)}
                        className="cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
                        <Tags className="mr-2 h-3 w-3 text-muted-foreground" />
                        {tag}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Create New Tag */}
                {inputValue.trim() && !availableTags.includes(inputValue.trim().toLowerCase()) && (
                  <CommandGroup heading="Create New">
                    <CommandItem
                      value={`create-${inputValue}`}
                      onSelect={handleCreateNew}
                      className="cursor-pointer"
                    >
                      <Plus className="mr-2 h-4 w-4 text-green-500" />
                      <Tags className="mr-2 h-3 w-3 text-muted-foreground" />
                      Create "{inputValue.trim()}"
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <p className="text-sm text-muted-foreground">
          Tags help family members find related stories and memories
        </p>
      </div>
    </div>
  )
}
