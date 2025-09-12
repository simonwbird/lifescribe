import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Timer,
  X,
  ChefHat
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import AuthGate from '@/components/AuthGate'
import type { Recipe } from '@/lib/recipeTypes'

export default function CookMode() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [activeTimer, setActiveTimer] = useState<{
    stepId: string
    duration: number
    remaining: number
    isRunning: boolean
  } | null>(null)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set())
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!id) return

    const loadRecipe = async () => {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error

        // Transform database recipe to Recipe type
        const transformedRecipe: Recipe = {
          id: data.id,
          title: data.title,
          subtitle: data.subtitle || '',
          source: data.source,
          serves: data.serves,
          prepMin: data.time_prep_minutes,
          cookMin: data.time_cook_minutes,
          totalMin: (data.time_prep_minutes || 0) + (data.time_cook_minutes || 0),
          ingredients: Array.isArray(data.ingredients) ? data.ingredients as any[] : [],
          steps: Array.isArray(data.steps) ? data.steps as any[] : [],
          notes: data.notes,
          tags: Array.isArray(data.dietary_tags) ? data.dietary_tags : [],
          diet: {
            veg: data.dietary_tags?.includes('vegetarian') || false,
            vegan: data.dietary_tags?.includes('vegan') || false,
            glutenFree: data.dietary_tags?.includes('gluten-free') || false,
            dairyFree: data.dietary_tags?.includes('dairy-free') || false
          },
          peopleIds: [],
          place: '',
          year: '',
          coverUrl: '',
          gallery: [],
          visibility: 'family',
          status: 'published',
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          authorId: data.created_by,
          authorName: 'Chef',
          familyId: data.family_id,
          cuisine: undefined,
          occasion: [],
          difficulty: undefined
        }

        setRecipe(transformedRecipe)
      } catch (error) {
        console.error('Error loading recipe:', error)
        toast({
          title: "Error loading recipe",
          description: "Could not load the recipe for cook mode.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadRecipe()
  }, [id, toast])

  // Timer management
  useEffect(() => {
    if (activeTimer?.isRunning && activeTimer.remaining > 0) {
      timerRef.current = setTimeout(() => {
        setActiveTimer(prev => 
          prev ? { ...prev, remaining: prev.remaining - 1 } : null
        )
      }, 1000)
    } else if (activeTimer?.remaining === 0) {
      // Timer finished
      toast({
        title: "Timer finished!",
        description: "Your cooking timer has completed.",
      })
      
      // Play sound if supported
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuH1+/MfCwGKnXB8dyOPAkXYbHu56Ld')
        audio.play().catch(() => {
          // Ignore audio errors
        })
      } catch {
        // Ignore audio errors
      }

      setActiveTimer(null)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [activeTimer, toast])

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const startTimer = (stepId: string, duration: number) => {
    setActiveTimer({
      stepId,
      duration,
      remaining: duration,
      isRunning: true
    })
  }

  const pauseTimer = () => {
    setActiveTimer(prev => prev ? { ...prev, isRunning: false } : null)
  }

  const resumeTimer = () => {
    setActiveTimer(prev => prev ? { ...prev, isRunning: true } : null)
  }

  const resetTimer = () => {
    setActiveTimer(prev => prev ? { 
      ...prev, 
      remaining: prev.duration, 
      isRunning: false 
    } : null)
  }

  const stopTimer = () => {
    setActiveTimer(null)
  }

  const toggleIngredient = (ingredientId: string) => {
    setCheckedIngredients(prev => {
      const newSet = new Set(prev)
      if (newSet.has(ingredientId)) {
        newSet.delete(ingredientId)
      } else {
        newSet.add(ingredientId)
      }
      return newSet
    })
  }

  const nextStep = () => {
    if (recipe && currentStep < recipe.steps.length - 1) {
      setCurrentStep(currentStep + 1)
      stopTimer() // Stop any running timer
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      stopTimer() // Stop any running timer
    }
  }

  const formatQuantity = (qty: any) => {
    if (!qty || (!qty.value && !qty.unit)) return ''
    
    const value = qty.value ? `${qty.value} ` : ''
    const unit = qty.unit || ''
    
    return `${value}${unit}`.trim()
  }

  if (loading) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <ChefHat className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
            <p>Loading cook mode...</p>
          </div>
        </div>
      </AuthGate>
    )
  }

  if (!recipe) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Recipe Not Found</h1>
            <p className="text-muted-foreground">
              The recipe you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate('/collections?tab=recipe')}>
              Back to Recipes
            </Button>
          </div>
        </div>
      </AuthGate>
    )
  }

  const currentStepData = recipe.steps[currentStep]
  const progress = ((currentStep + 1) / recipe.steps.length) * 100

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/recipes/${recipe.id}`)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="font-semibold">{recipe.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    Step {currentStep + 1} of {recipe.steps.length}
                  </p>
                </div>
              </div>
              
              {/* Timer display */}
              {activeTimer && (
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-2xl font-mono font-bold">
                      {formatTimer(activeTimer.remaining)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      of {formatTimer(activeTimer.duration)}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    {activeTimer.isRunning ? (
                      <Button variant="outline" size="sm" onClick={pauseTimer}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={resumeTimer}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm" onClick={resetTimer}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={stopTimer}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Progress bar */}
            <Progress value={progress} className="mt-3 h-1" />
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main step */}
            <div className="lg:col-span-2">
              <Card className="min-h-[400px]">
                <CardContent className="pt-8">
                  <div className="space-y-6">
                    {/* Step number and content */}
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {currentStep + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-xl leading-relaxed">
                          {currentStepData?.text}
                        </div>
                        
                        {currentStepData?.optional && (
                          <Badge variant="outline" className="mt-2">
                            Optional Step
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Timer controls */}
                    {currentStepData?.timerSec && (
                      <Card className="bg-muted/50">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Timer className="h-4 w-4" />
                              <span className="text-sm">
                                Timer: {Math.floor(currentStepData.timerSec / 60)}m {currentStepData.timerSec % 60}s
                              </span>
                            </div>
                            
                            {activeTimer?.stepId === currentStepData.id ? (
                              <div className="flex gap-2">
                                {activeTimer.isRunning ? (
                                  <Button variant="outline" size="sm" onClick={pauseTimer}>
                                    <Pause className="h-4 w-4 mr-1" />
                                    Pause
                                  </Button>
                                ) : (
                                  <Button variant="outline" size="sm" onClick={resumeTimer}>
                                    <Play className="h-4 w-4 mr-1" />
                                    Resume
                                  </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={stopTimer}>
                                  Stop
                                </Button>
                              </div>
                            ) : (
                              <Button 
                                onClick={() => startTimer(currentStepData.id, currentStepData.timerSec!)}
                                className="bg-brand-green hover:bg-brand-green/90"
                              >
                                <Play className="h-4 w-4 mr-2" />
                                Start Timer
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Tip */}
                    {currentStepData?.tip && (
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="pt-4">
                          <div className="flex gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                            <div>
                              <p className="font-medium text-blue-900">Tip</p>
                              <p className="text-blue-800 text-sm mt-1">{currentStepData.tip}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Ingredients checklist */}
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-3">Ingredients</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {recipe.ingredients.map((ingredient) => (
                      <div 
                        key={ingredient.id}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                          checkedIngredients.has(ingredient.id) 
                            ? 'bg-green-50 text-green-800' 
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleIngredient(ingredient.id)}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          checkedIngredients.has(ingredient.id) 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-muted-foreground'
                        }`}>
                          {checkedIngredients.has(ingredient.id) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                        <span className={`text-sm flex-1 ${
                          checkedIngredients.has(ingredient.id) ? 'line-through' : ''
                        }`}>
                          {formatQuantity(ingredient.qty)} {ingredient.item}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Step navigation */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold">All Steps</h3>
                  <div className="space-y-2">
                    {recipe.steps.map((step, index) => (
                      <button
                        key={step.id}
                        onClick={() => {
                          setCurrentStep(index)
                          stopTimer()
                        }}
                        className={`w-full text-left p-2 rounded text-sm transition-colors ${
                          index === currentStep 
                            ? 'bg-accent text-accent-foreground' 
                            : index < currentStep
                            ? 'bg-green-50 text-green-800'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{index + 1}.</span>
                          <span className="truncate">{step.text}</span>
                          {index < currentStep && (
                            <Check className="h-3 w-3 ml-auto text-green-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 py-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous Step
            </Button>

            {currentStep === recipe.steps.length - 1 ? (
              <Button 
                onClick={() => navigate(`/recipes/${recipe.id}`)}
                className="bg-brand-green hover:bg-brand-green/90"
              >
                <Check className="h-4 w-4 mr-2" />
                Finish Cooking
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Next Step
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </AuthGate>
  )
}