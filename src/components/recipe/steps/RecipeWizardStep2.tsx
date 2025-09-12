import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Plus } from 'lucide-react'
import { useState } from 'react'
import type { RecipeFormData } from '@/lib/recipeTypes'

interface RecipeWizardStep2Props {
  data: RecipeFormData
  onChange: (data: Partial<RecipeFormData>) => void
}

export default function RecipeWizardStep2({ data, onChange }: RecipeWizardStep2Props) {
  const [newTag, setNewTag] = useState('')

  const addTag = (tag: string) => {
    if (tag && !data.tags.includes(tag)) {
      onChange({
        tags: [...data.tags, tag]
      })
    }
    setNewTag('')
  }

  const removeTag = (tag: string) => {
    onChange({
      tags: data.tags.filter(t => t !== tag)
    })
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">People & Context</h2>
        <p className="text-muted-foreground">
          Add context about when, where, and who this recipe is connected to.
        </p>
      </div>

      <div className="space-y-6">
        {/* People - Simplified for now */}
        <div className="space-y-2">
          <Label>People Connected to This Recipe</Label>
          <p className="text-sm text-muted-foreground">
            People will be connected when you publish the recipe.
          </p>
          <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
            People selector coming soon
          </div>
        </div>

        {/* Place */}
        <div className="space-y-2">
          <Label htmlFor="place">Place or Location</Label>
          <Input
            id="place"
            placeholder="Kitchen at Gran's house, Sicily, etc."
            value={data.place || ''}
            onChange={(e) => onChange({ place: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Where did this recipe come from or where do you make it?
          </p>
        </div>

        {/* Year */}
        <div className="space-y-2">
          <Label htmlFor="year">Year or Time Period</Label>
          <Input
            id="year"
            placeholder="1950s, 2020, circa 1980, etc."
            value={data.year || ''}
            onChange={(e) => onChange({ year: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            When did you learn this recipe or when is it from?
          </p>
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <Label>Tags</Label>
          <p className="text-sm text-muted-foreground">
            Add tags to help organize and find this recipe later.
          </p>
          
          {/* Display existing tags */}
          {data.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}

          {/* Add new tag */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag(newTag.trim())
                }
              }}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => addTag(newTag.trim())}
              disabled={!newTag.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Suggested tags */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Suggested tags:</p>
            <div className="flex flex-wrap gap-1">
              {['family favorite', 'comfort food', 'holiday', 'quick meal', 'dessert', 'appetizer', 'main course', 'side dish', 'breakfast'].filter(tag => !data.tags.includes(tag)).map((tag) => (
                <Button
                  key={tag}
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => addTag(tag)}
                >
                  + {tag}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}