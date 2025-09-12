import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, GripVertical, Minus } from 'lucide-react'
import { useState } from 'react'
import type { RecipeFormData, IngredientRow } from '@/lib/recipeTypes'
import { UNITS } from '@/lib/recipeTypes'

interface RecipeWizardStep3Props {
  data: RecipeFormData
  onChange: (data: Partial<RecipeFormData>) => void
}

export default function RecipeWizardStep3({ data, onChange }: RecipeWizardStep3Props) {
  const [unitSystem, setUnitSystem] = useState<'METRIC' | 'US'>('US')
  const [newSection, setNewSection] = useState('')

  const availableUnits = [...UNITS[unitSystem], ...UNITS.UNIVERSAL]
  const sections = [...new Set(data.ingredients.map(ing => ing.section).filter(Boolean))]

  const addIngredient = (section?: string) => {
    const newIngredient: IngredientRow = {
      id: crypto.randomUUID(),
      section: section || undefined,
      item: '',
      qty: { value: undefined, unit: 'cup' },
      notes: ''
    }

    onChange({
      ingredients: [...data.ingredients, newIngredient]
    })
  }

  const updateIngredient = (id: string, updates: Partial<IngredientRow>) => {
    onChange({
      ingredients: data.ingredients.map(ing => 
        ing.id === id ? { ...ing, ...updates } : ing
      )
    })
  }

  const removeIngredient = (id: string) => {
    onChange({
      ingredients: data.ingredients.filter(ing => ing.id !== id)
    })
  }

  const addSection = () => {
    if (newSection.trim() && !sections.includes(newSection.trim())) {
      addIngredient(newSection.trim())
      setNewSection('')
    }
  }

  const removeSection = (section: string) => {
    onChange({
      ingredients: data.ingredients.map(ing => 
        ing.section === section ? { ...ing, section: undefined } : ing
      )
    })
  }

  const groupedIngredients = data.ingredients.reduce((acc, ing) => {
    const section = ing.section || 'Main'
    if (!acc[section]) acc[section] = []
    acc[section].push(ing)
    return acc
  }, {} as Record<string, IngredientRow[]>)

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Ingredients</h2>
        <p className="text-muted-foreground">
          List everything needed to make this recipe.
        </p>
      </div>

      <div className="space-y-6">
        {/* Unit system toggle */}
        <div className="flex items-center justify-center gap-4">
          <Label>Unit System:</Label>
          <div className="flex border rounded-lg p-1">
            <Button
              variant={unitSystem === 'US' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setUnitSystem('US')}
              className="h-8"
            >
              US (cups, tbsp)
            </Button>
            <Button
              variant={unitSystem === 'METRIC' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setUnitSystem('METRIC')}
              className="h-8"
            >
              Metric (g, ml)
            </Button>
          </div>
        </div>

        {/* Add new section */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label htmlFor="newSection">Add Ingredient Section (optional)</Label>
                <Input
                  id="newSection"
                  placeholder="e.g., Dough, Filling, Topping"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSection()
                    }
                  }}
                />
              </div>
              <Button onClick={addSection} disabled={!newSection.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Ingredient sections */}
        {Object.entries(groupedIngredients).map(([section, ingredients]) => (
          <Card key={section}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {section !== 'Main' && <GripVertical className="h-4 w-4 text-muted-foreground" />}
                  {section}
                  {section !== 'Main' && (
                    <Badge variant="outline" className="text-xs">
                      {ingredients.length} items
                    </Badge>
                  )}
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addIngredient(section !== 'Main' ? section : undefined)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                  {section !== 'Main' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(section)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={ingredient.id} className="flex gap-3 items-start">
                    <div className="grid grid-cols-12 gap-2 flex-1">
                      {/* Quantity */}
                      <div className="col-span-2">
                        <Input
                          placeholder="2"
                          type="number"
                          step="0.25"
                          value={ingredient.qty?.value || ''}
                          onChange={(e) => updateIngredient(ingredient.id, {
                            qty: { 
                              ...ingredient.qty, 
                              value: parseFloat(e.target.value) || undefined 
                            }
                          })}
                        />
                      </div>

                      {/* Unit */}
                      <div className="col-span-2">
                        <Select
                          value={ingredient.qty?.unit || ''}
                          onValueChange={(value) => updateIngredient(ingredient.id, {
                            qty: { ...ingredient.qty, unit: value }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableUnits.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Item */}
                      <div className="col-span-5">
                        <Input
                          placeholder="flour, sugar, etc."
                          value={ingredient.item}
                          onChange={(e) => updateIngredient(ingredient.id, {
                            item: e.target.value
                          })}
                        />
                      </div>

                      {/* Notes */}
                      <div className="col-span-3">
                        <Input
                          placeholder="sifted, room temp"
                          value={ingredient.notes || ''}
                          onChange={(e) => updateIngredient(ingredient.id, {
                            notes: e.target.value
                          })}
                        />
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeIngredient(ingredient.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {ingredients.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No ingredients in this section yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {data.ingredients.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                No ingredients added yet. Start by adding your first ingredient.
              </p>
              <Button onClick={() => addIngredient()}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Ingredient
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}