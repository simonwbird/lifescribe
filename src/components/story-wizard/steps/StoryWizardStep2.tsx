import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Calendar, MapPin, Hash, X, Plus } from 'lucide-react'
import { type StoryFormData, type SelectedPerson } from '../StoryWizardTypes'
import PeoplePicker from '../PeoplePicker'

interface StoryWizardStep2Props {
  formData: StoryFormData
  onChange: (updates: Partial<StoryFormData>) => void
  onNext: () => void
  onPrevious: () => void
  familyId: string | null
  isPhotoFirst?: boolean
}

export default function StoryWizardStep2({ 
  formData, 
  onChange, 
  onNext, 
  onPrevious, 
  familyId,
  isPhotoFirst = false
}: StoryWizardStep2Props) {
  const [newTag, setNewTag] = useState('')

  // Ensure people is always SelectedPerson[] for type safety
  const selectedPeople: SelectedPerson[] = formData.people || []

  const handlePeopleChange = (people: SelectedPerson[]) => {
    onChange({ people })
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault()
      const tag = newTag.trim().toLowerCase()
      if (!formData.tags.includes(tag)) {
        onChange({ tags: [...formData.tags, tag] })
      }
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onChange({ tags: formData.tags.filter(tag => tag !== tagToRemove) })
  }

  const suggestedTags = ['family', 'childhood', 'tradition', 'wartime', 'school', 'recipe', 'celebration', 'work', 'travel', 'holiday']
  const availableTags = suggestedTags.filter(tag => !formData.tags.includes(tag))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-semibold mb-2">People & Places</h2>
        <p className="text-muted-foreground">
          Add context about when, where, and who was involved in this story.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Date */}
        <div className="space-y-3">
          <Label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            When did this happen?
          </Label>
          <div className="space-y-2">
            <ToggleGroup 
              type="single" 
              value={formData.dateType} 
              onValueChange={(value) => onChange({ dateType: value as 'exact' | 'approximate' })}
              className="justify-start"
            >
              <ToggleGroupItem value="exact" className="text-xs">
                Exact date
              </ToggleGroupItem>
              <ToggleGroupItem value="approximate" className="text-xs">
                Approximate
              </ToggleGroupItem>
            </ToggleGroup>
            <Input
              id="date"
              value={formData.date}
              onChange={(e) => onChange({ date: e.target.value })}
              placeholder={formData.dateType === 'exact' ? 'June 15, 1952' : 'Summer 1952, around age 8'}
              aria-describedby="date-help"
            />
            <p id="date-help" className="text-xs text-muted-foreground">
              {formData.dateType === 'exact' 
                ? 'Enter the specific date if you know it' 
                : 'Best guess is fine - even just the year or season'
              }
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-3">
          <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Where did this happen?
          </Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => onChange({ location: e.target.value })}
            placeholder="Town, state, country"
            aria-describedby="location-help"
          />
          <p id="location-help" className="text-xs text-muted-foreground">
            Be as specific as you remember - even "Gran's kitchen" or "the old farmhouse" works
          </p>
        </div>
      </div>

      {/* People */}
      <PeoplePicker
        selectedPeople={selectedPeople}
        onPeopleChange={handlePeopleChange}
        familyId={familyId}
      />

      {/* Tags */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Tags
        </Label>
        <div className="space-y-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddTag}
            placeholder="Type a tag and press Enter to add..."
            aria-describedby="tags-help"
          />
          <p id="tags-help" className="text-xs text-muted-foreground">
            Tags help organize and find stories later (e.g., childhood, recipe, wartime)
          </p>
          
          {/* Current Tags */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="default" className="gap-1">
                  {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveTag(tag)}
                    aria-label={`Remove ${tag} tag`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
          
          {/* Suggested Tags */}
          {availableTags.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Suggested tags:</p>
              <div className="flex flex-wrap gap-2">
                {availableTags.slice(0, 8).map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs gap-1"
                    onClick={() => onChange({ tags: [...formData.tags, tag] })}
                  >
                    <Plus className="h-3 w-3" />
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Back to Basics
        </Button>
        <Button 
          onClick={onNext}
          className="bg-brand-green hover:bg-brand-green/90 text-brand-green-foreground"
        >
          {isPhotoFirst ? 'Continue to Review' : 'Continue to Media'}
        </Button>
      </div>
    </div>
  )
}