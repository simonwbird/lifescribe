import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import RecipeWizardProgress from './RecipeWizardProgress'
import RecipeWizardStep1 from './steps/RecipeWizardStep1'
import RecipeWizardStep2 from './steps/RecipeWizardStep2'
import RecipeWizardStep3 from './steps/RecipeWizardStep3'
import RecipeWizardStep4 from './steps/RecipeWizardStep4'
import RecipeWizardStep5 from './steps/RecipeWizardStep5'
import type { RecipeFormData, RecipeWizardStep, AutosaveStatus, IngredientRow, StepRow } from '@/lib/recipeTypes'

export default function RecipeWizard() {
  const { id: recipeId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isEditing = location.pathname.includes('/edit')
  
  const [currentStep, setCurrentStep] = useState<RecipeWizardStep>(1)
  const [completedSteps, setCompletedSteps] = useState<RecipeWizardStep[]>([])
  const [autosave, setAutosave] = useState<AutosaveStatus>({
    status: 'idle',
    message: ''
  })
  
  const [formData, setFormData] = useState<RecipeFormData>({
    title: '',
    subtitle: '',
    source: '',
    cuisine: '',
    occasion: [],
    difficulty: undefined,
    serves: '',
    prepMin: undefined,
    cookMin: undefined,
    diet: {
      veg: false,
      vegan: false,
      glutenFree: false,
      dairyFree: false
    },
    peopleIds: [],
    place: '',
    year: '',
    tags: [],
    ingredients: [],
    steps: [],
    notes: '',
    coverUrl: '',
    gallery: [],
    visibility: 'family',
    status: 'draft'
  })

  const [familyId, setFamilyId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Load existing recipe when editing
  useEffect(() => {
    if (!recipeId || !isEditing) return
    const loadRecipe = async () => {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', recipeId)
          .single()
        
        if (error) throw error
        
        if (data) {
          setFormData(prev => ({
            ...prev,
            title: data.title || '',
            serves: data.serves || '4',
            prepMin: data.time_prep_minutes || 15,
            cookMin: data.time_cook_minutes || 30,
            ingredients: Array.isArray(data.ingredients) ? data.ingredients as IngredientRow[] : [],
            steps: Array.isArray(data.steps) ? data.steps as StepRow[] : [],
            notes: data.notes || '',
            source: data.source || '',
            diet: {
              veg: data.dietary_tags?.includes('vegetarian') || false,
              vegan: data.dietary_tags?.includes('vegan') || false,
              glutenFree: data.dietary_tags?.includes('gluten-free') || false,
              dairyFree: data.dietary_tags?.includes('dairy-free') || false
            }
          }))
        }
      } catch (error) {
        console.error('Error loading recipe:', error)
        toast({
          title: 'Error',
          description: 'Failed to load recipe for editing',
          variant: 'destructive'
        })
      }
    }
    
    loadRecipe()
  }, [recipeId, isEditing, toast])

  // Get user and family info
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          navigate('/login')
          return
        }

        setUserId(user.id)

        const { data: member } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .single()

        if (member) {
          setFamilyId(member.family_id)
        }
      } catch (error) {
        console.error('Error getting user:', error)
        toast({
          title: "Error",
          description: "Could not load user information.",
          variant: "destructive"
        })
      }
    }

    getUser()
  }, [navigate, toast])

  const updateFormData = (updates: Partial<RecipeFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    
    // Mark step as touched/completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep])
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim().length > 0
      case 2:
        return true // All fields optional
      case 3:
        return formData.ingredients.length > 0
      case 4:
        return formData.steps.length > 0
      case 5:
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (canProceed() && currentStep < 5) {
      setCurrentStep((currentStep + 1) as RecipeWizardStep)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as RecipeWizardStep)
    }
  }

  const saveDraft = async () => {
    if (!familyId || !userId) return

    setAutosave({ status: 'saving', message: 'Saving draft...' })

    try {
      const recipeData = {
        title: formData.title,
        subtitle: formData.subtitle,
        source: formData.source,
        serves: formData.serves,
        time_prep_minutes: formData.prepMin,
        time_cook_minutes: formData.cookMin,
        ingredients: formData.ingredients,
        steps: formData.steps,
        notes: formData.notes,
        dietary_tags: [
          ...(formData.diet.veg ? ['vegetarian'] : []),
          ...(formData.diet.vegan ? ['vegan'] : []),
          ...(formData.diet.glutenFree ? ['gluten-free'] : []),
          ...(formData.diet.dairyFree ? ['dairy-free'] : []),
          ...formData.tags
        ],
        family_id: familyId,
        created_by: userId
      }

      const { error } = await supabase
        .from('recipes')
        .insert([recipeData])

      if (error) throw error

      setAutosave({ 
        status: 'saved', 
        message: 'Draft saved',
        lastSaved: new Date()
      })

      toast({
        title: "Recipe saved",
        description: "Your recipe has been saved as a draft."
      })

    } catch (error) {
      console.error('Error saving draft:', error)
      setAutosave({ status: 'error', message: 'Error saving' })
      toast({
        title: "Error saving recipe",
        description: "There was an issue saving your recipe draft.",
        variant: "destructive"
      })
    }
  }

  const publishRecipe = async () => {
    if (!familyId || !userId) return

    try {
      const recipeData = {
        title: formData.title,
        subtitle: formData.subtitle,
        source: formData.source,
        serves: formData.serves,
        time_prep_minutes: formData.prepMin,
        time_cook_minutes: formData.cookMin,
        ingredients: formData.ingredients,
        steps: formData.steps,
        notes: formData.notes,
        dietary_tags: [
          ...(formData.diet.veg ? ['vegetarian'] : []),
          ...(formData.diet.vegan ? ['vegan'] : []),
          ...(formData.diet.glutenFree ? ['gluten-free'] : []),
          ...(formData.diet.dairyFree ? ['dairy-free'] : []),
          ...formData.tags
        ],
        family_id: familyId,
        created_by: userId
      }

      const { data, error } = await supabase
        .from('recipes')
        .insert([recipeData])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Recipe published!",
        description: "Your recipe has been published to your family's collection."
      })

      navigate(`/recipes/${data.id}`)

    } catch (error) {
      console.error('Error publishing recipe:', error)
      toast({
        title: "Error publishing recipe",
        description: "There was an issue publishing your recipe.",
        variant: "destructive"
      })
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <RecipeWizardStep1 data={formData} onChange={updateFormData} />
      case 2:
        return <RecipeWizardStep2 data={formData} onChange={updateFormData} />
      case 3:
        return <RecipeWizardStep3 data={formData} onChange={updateFormData} />
      case 4:
        return <RecipeWizardStep4 data={formData} onChange={updateFormData} />
      case 5:
        return (
          <RecipeWizardStep5 
            data={formData} 
            onChange={updateFormData}
            onPublish={publishRecipe}
            onSaveDraft={saveDraft}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/collections?tab=recipe')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Recipes
              </Button>
              <div>
                <h1 className="text-xl font-semibold">New Recipe</h1>
                {formData.title && (
                  <p className="text-sm text-muted-foreground">{formData.title}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Autosave status */}
              {autosave.status !== 'idle' && (
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={autosave.status === 'error' ? 'destructive' : 'outline'}
                    className="text-xs"
                  >
                    {autosave.message}
                  </Badge>
                  {autosave.lastSaved && (
                    <span className="text-xs text-muted-foreground">
                      {autosave.lastSaved.toLocaleTimeString()}
                    </span>
                  )}
                </div>
              )}

              <Button 
                variant="outline"
                onClick={saveDraft}
                disabled={!formData.title.trim()}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="container mx-auto px-4 py-8">
        <RecipeWizardProgress 
          currentStep={currentStep} 
          completedSteps={completedSteps}
        />

        {/* Step content */}
        <div className="pb-24">
          {renderCurrentStep()}
        </div>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
          <div className="container mx-auto flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Step {currentStep} of 5
            </div>

            <Button
              onClick={nextStep}
              disabled={!canProceed() || currentStep === 5}
              className="gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}