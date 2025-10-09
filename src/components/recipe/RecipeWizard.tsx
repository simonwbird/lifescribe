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
import { useDraftManager } from '@/hooks/useDraftManager'
import { AutosaveIndicator } from '../story-wizard/AutosaveIndicator'

export default function RecipeWizard() {
  const { id: recipeId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const isEditing = location.pathname.includes('/edit')
  
  const [currentStep, setCurrentStep] = useState<RecipeWizardStep>(1)
  const [completedSteps, setCompletedSteps] = useState<RecipeWizardStep[]>([])
  const [showDraftRecovery, setShowDraftRecovery] = useState(false)
  
  // Draft management
  const draftKey = `recipe-${recipeId || 'new'}`
  const { 
    autosaveStatus, 
    hasDraft, 
    loadDraft, 
    clearDraft, 
    startAutosave, 
    stopAutosave 
  } = useDraftManager(draftKey, 5000) // Autosave every 5 seconds
  
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

  // Check for existing draft on mount
  useEffect(() => {
    if (!recipeId && !isEditing) {
      const existingDraft = loadDraft()
      if (existingDraft && existingDraft.content) {
        setShowDraftRecovery(true)
      }
    }
  }, [recipeId, isEditing, loadDraft])

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

  // Start autosave when form data changes
  useEffect(() => {
    const getFormData = () => ({
      ...formData,
      currentStep
    })

    if ((formData.title || formData.ingredients.length > 0 || formData.steps.length > 0) && !showDraftRecovery) {
      startAutosave(getFormData)
    }

    return () => stopAutosave()
  }, [formData, currentStep, startAutosave, stopAutosave, showDraftRecovery])

  const handleDraftRecovery = () => {
    const draft = loadDraft()
    if (draft && draft.content) {
      setFormData(prev => ({
        ...prev,
        ...draft.content,
        // Preserve arrays properly
        ingredients: Array.isArray(draft.content.ingredients) ? draft.content.ingredients : prev.ingredients,
        steps: Array.isArray(draft.content.steps) ? draft.content.steps : prev.steps,
        gallery: Array.isArray(draft.content.gallery) ? draft.content.gallery : prev.gallery,
        peopleIds: Array.isArray(draft.content.peopleIds) ? draft.content.peopleIds : prev.peopleIds,
        occasion: Array.isArray(draft.content.occasion) ? draft.content.occasion : prev.occasion,
        tags: Array.isArray(draft.content.tags) ? draft.content.tags : prev.tags,
      }))
      
      if (draft.content.currentStep) {
        setCurrentStep(draft.content.currentStep)
      }
      
      setShowDraftRecovery(false)
      
      toast({
        title: "Draft Recovered",
        description: "Your previous recipe work has been restored.",
      })
    }
  }

  const handleDiscardDraft = () => {
    clearDraft()
    setShowDraftRecovery(false)
    
    toast({
      title: "Draft Discarded",
      description: "Starting with a fresh recipe.",
    })
  }

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

      toast({
        title: "Recipe saved",
        description: "Your recipe has been saved as a draft."
      })

    } catch (error) {
      console.error('Error saving draft:', error)
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

      // Clear draft on successful publish
      clearDraft()

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
              <AutosaveIndicator status={autosaveStatus} />

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

        {/* Draft Recovery Banner */}
        {showDraftRecovery && (
          <div className="container mx-auto px-4 mt-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">Resume your draft?</h4>
                  <p className="text-xs text-muted-foreground">You have an unsaved recipe in progress.</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleDraftRecovery}>Resume</Button>
                  <Button size="sm" variant="outline" onClick={handleDiscardDraft}>Discard</Button>
                </div>
              </div>
            </div>
          </div>
        )}
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