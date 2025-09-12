import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { X, Plus } from 'lucide-react'
import { useState } from 'react'
import type { RecipeFormData } from '@/lib/recipeTypes'
import { CUISINES, OCCASIONS } from '@/lib/recipeTypes'
import FamilyMemberSelector from '../FamilyMemberSelector'

interface RecipeWizardStep1Props {
  data: RecipeFormData
  onChange: (data: Partial<RecipeFormData>) => void
}

export default function RecipeWizardStep1({ data, onChange }: RecipeWizardStep1Props) {
  const [newOccasion, setNewOccasion] = useState('')

  const addOccasion = (occasion: string) => {
    if (occasion && !data.occasion.includes(occasion)) {
      onChange({
        occasion: [...data.occasion, occasion]
      })
    }
    setNewOccasion('')
  }

  const removeOccasion = (occasion: string) => {
    onChange({
      occasion: data.occasion.filter(o => o !== occasion)
    })
  }

  const updateDiet = (key: keyof typeof data.diet, value: boolean) => {
    onChange({
      diet: { ...data.diet, [key]: value }
    })
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Recipe Details</h2>
        <p className="text-muted-foreground">
          Tell us about this recipe - the basics, timing, and dietary info.
        </p>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Recipe Title *
          </Label>
          <Input
            id="title"
            placeholder="Grandma's Apple Pie"
            value={data.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="text-lg"
          />
        </div>

        {/* Subtitle */}
        <div className="space-y-2">
          <Label htmlFor="subtitle">Alternative Title</Label>
          <Input
            id="subtitle"
            placeholder="The Best Apple Pie Ever"
            value={data.subtitle || ''}
            onChange={(e) => onChange({ subtitle: e.target.value })}
          />
        </div>

        {/* Source - Family Member Selector */}
        <FamilyMemberSelector
          value={data.source || ''}
          onChange={(value) => onChange({ source: value })}
          label="Recipe Source"
          placeholder="Select family member or add custom source"
          allowCustom={true}
        />

        {/* Cuisine and Difficulty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cuisine</Label>
            <Select 
              value={data.cuisine || ''} 
              onValueChange={(value) => onChange({ cuisine: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cuisine" />
              </SelectTrigger>
              <SelectContent>
                {CUISINES.map((cuisine) => (
                  <SelectItem key={cuisine} value={cuisine}>
                    {cuisine}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select 
              value={data.difficulty || ''} 
              onValueChange={(value: 'easy' | 'medium' | 'hard') => onChange({ difficulty: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Occasions */}
        <div className="space-y-3">
          <Label>Occasions</Label>
          <div className="flex flex-wrap gap-2">
            {data.occasion.map((occasion) => (
              <Badge key={occasion} variant="secondary" className="gap-1">
                {occasion}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => removeOccasion(occasion)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Select value="" onValueChange={addOccasion}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Add occasion" />
              </SelectTrigger>
              <SelectContent>
                {OCCASIONS.filter(o => !data.occasion.includes(o)).map((occasion) => (
                  <SelectItem key={occasion} value={occasion}>
                    {occasion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Input
                placeholder="Custom occasion"
                value={newOccasion}
                onChange={(e) => setNewOccasion(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addOccasion(newOccasion)
                  }
                }}
                className="w-32"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => addOccasion(newOccasion)}
                disabled={!newOccasion.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Timing and Serves */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="serves">Serves</Label>
            <Input
              id="serves"
              placeholder="4-6 people"
              value={data.serves || ''}
              onChange={(e) => onChange({ serves: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prep">Prep Time (min)</Label>
            <Input
              id="prep"
              type="number"
              placeholder="30"
              value={data.prepMin || ''}
              onChange={(e) => onChange({ prepMin: parseInt(e.target.value) || undefined })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cook">Cook Time (min)</Label>
            <Input
              id="cook"
              type="number"
              placeholder="45"
              value={data.cookMin || ''}
              onChange={(e) => onChange({ cookMin: parseInt(e.target.value) || undefined })}
            />
          </div>
        </div>

        {/* Total time display */}
        {(data.prepMin || data.cookMin) && (
          <div className="text-sm text-muted-foreground">
            Total time: {(data.prepMin || 0) + (data.cookMin || 0)} minutes
          </div>
        )}

        {/* Dietary flags */}
        <div className="space-y-3">
          <Label>Dietary Information</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="veg"
                checked={data.diet.veg}
                onCheckedChange={(checked) => updateDiet('veg', checked === true)}
              />
              <Label htmlFor="veg">Vegetarian</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="vegan"
                checked={data.diet.vegan}
                onCheckedChange={(checked) => updateDiet('vegan', checked === true)}
              />
              <Label htmlFor="vegan">Vegan</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="glutenFree"
                checked={data.diet.glutenFree}
                onCheckedChange={(checked) => updateDiet('glutenFree', checked === true)}
              />
              <Label htmlFor="glutenFree">Gluten Free</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="dairyFree"
                checked={data.diet.dairyFree}
                onCheckedChange={(checked) => updateDiet('dairyFree', checked === true)}
              />
              <Label htmlFor="dairyFree">Dairy Free</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}