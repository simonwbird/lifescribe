import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Timer, Image, Lightbulb } from 'lucide-react'
import type { RecipeFormData, StepRow } from '@/lib/recipeTypes'

interface RecipeWizardStep4Props {
  data: RecipeFormData
  onChange: (data: Partial<RecipeFormData>) => void
}

export default function RecipeWizardStep4({ data, onChange }: RecipeWizardStep4Props) {
  const addStep = () => {
    const newStep: StepRow = {
      id: crypto.randomUUID(),
      text: '',
      timerSec: undefined,
      imageUrl: undefined,
      optional: false,
      tip: undefined
    }

    onChange({
      steps: [...data.steps, newStep]
    })
  }

  const updateStep = (id: string, updates: Partial<StepRow>) => {
    onChange({
      steps: data.steps.map(step => 
        step.id === id ? { ...step, ...updates } : step
      )
    })
  }

  const removeStep = (id: string) => {
    onChange({
      steps: data.steps.filter(step => step.id !== id)
    })
  }

  const moveStep = (id: string, direction: 'up' | 'down') => {
    const currentIndex = data.steps.findIndex(step => step.id === id)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= data.steps.length) return

    const newSteps = [...data.steps]
    const [movedStep] = newSteps.splice(currentIndex, 1)
    newSteps.splice(newIndex, 0, movedStep)

    onChange({ steps: newSteps })
  }

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (minutes > 0) {
      return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`
    }
    return `${secs}s`
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Instructions</h2>
        <p className="text-muted-foreground">
          Write clear step-by-step instructions. Add timers, photos, and tips as needed.
        </p>
      </div>

      <div className="space-y-4">
        {data.steps.map((step, index) => (
          <Card key={step.id} className="relative">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {/* Step number */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-medium text-sm">
                    {index + 1}
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveStep(step.id, 'up')}
                      disabled={index === 0}
                      className="h-6 w-6 p-0"
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveStep(step.id, 'down')}
                      disabled={index === data.steps.length - 1}
                      className="h-6 w-6 p-0"
                    >
                      ↓
                    </Button>
                  </div>
                </div>

                {/* Step content */}
                <div className="flex-1 space-y-4">
                  {/* Main instruction */}
                  <div>
                    <Textarea
                      placeholder="Describe what to do in this step..."
                      value={step.text}
                      onChange={(e) => updateStep(step.id, { text: e.target.value })}
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* Step options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Timer */}
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        Timer (optional)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="5"
                          value={step.timerSec ? Math.floor(step.timerSec / 60) : ''}
                          onChange={(e) => {
                            const minutes = parseInt(e.target.value) || 0
                            const seconds = (step.timerSec || 0) % 60
                            updateStep(step.id, { 
                              timerSec: minutes * 60 + seconds || undefined 
                            })
                          }}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground self-center">min</span>
                        <Input
                          type="number"
                          placeholder="30"
                          value={step.timerSec ? step.timerSec % 60 : ''}
                          onChange={(e) => {
                            const minutes = Math.floor((step.timerSec || 0) / 60)
                            const seconds = parseInt(e.target.value) || 0
                            updateStep(step.id, { 
                              timerSec: minutes * 60 + seconds || undefined 
                            })
                          }}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground self-center">sec</span>
                      </div>
                      {step.timerSec && (
                        <div className="text-xs text-muted-foreground">
                          Timer: {formatTimer(step.timerSec)}
                        </div>
                      )}
                    </div>

                    {/* Image placeholder */}
                    <div className="space-y-2">
                      <Label className="text-sm flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        Step Photo
                      </Label>
                      <Button variant="outline" className="w-full" disabled>
                        <Image className="h-4 w-4 mr-2" />
                        Add Photo (Coming Soon)
                      </Button>
                    </div>
                  </div>

                  {/* Tip */}
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Tip or Variation (optional)
                    </Label>
                    <Textarea
                      placeholder="Add a helpful tip, variation, or troubleshooting note..."
                      value={step.tip || ''}
                      onChange={(e) => updateStep(step.id, { tip: e.target.value })}
                      className="min-h-[60px]"
                    />
                  </div>

                  {/* Optional step checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`optional-${step.id}`}
                      checked={step.optional || false}
                      onCheckedChange={(checked) => updateStep(step.id, { optional: checked === true })}
                    />
                    <Label htmlFor={`optional-${step.id}`} className="text-sm">
                      This step is optional
                    </Label>
                  </div>
                </div>

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeStep(step.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add step button */}
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <Button onClick={addStep} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </CardContent>
        </Card>

        {/* Recipe notes */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Label htmlFor="notes">Recipe Notes & Story</Label>
              <Textarea
                id="notes"
                placeholder="Share the story behind this recipe, serving suggestions, storage tips, or any other notes..."
                value={data.notes || ''}
                onChange={(e) => onChange({ notes: e.target.value })}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                This is a great place to share the family history or memories connected to this recipe.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}