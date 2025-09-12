import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, Save, Check } from 'lucide-react'
import { getCategorySpec, type ArtifactBase, type CategorySpec } from '@/lib/artifactTypes'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import ArtifactWizardStepRenderer from './ArtifactWizardStepRenderer'
import VehicleWizard from '../vehicle/VehicleWizard'

interface ArtifactWizardProps {
  categoryId: string
  onComplete?: (artifact: ArtifactBase) => void
  onCancel?: () => void
}

export default function ArtifactWizard({ categoryId, onComplete, onCancel }: ArtifactWizardProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  // Special case: Use existing VehicleWizard for vehicles
  if (categoryId === 'vehicle') {
    return <VehicleWizard />
  }
  
  const categorySpec = getCategorySpec(categoryId)
  
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [formData, setFormData] = useState<Partial<ArtifactBase>>({
    category: categoryId,
    title: '',
    description: '',
    tags: [],
    peopleIds: [],
    media: [],
    visibility: 'family',
    status: 'draft',
    categorySpecific: {}
  })
  const [userProfile, setUserProfile] = useState<any>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const { data: membership } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      setUserProfile(profile)
      setFamilyId(membership?.family_id || null)
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const updateFormData = (updates: Partial<ArtifactBase>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    
    // Mark current step as completed if it has required data
    if (updates.title || Object.keys(updates.categorySpecific || {}).length > 0) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
    }
    
    // Auto-save draft
    setAutosaveStatus('saving')
    setTimeout(() => {
      saveDraft(updates)
    }, 1000)
  }

  const saveDraft = async (updates?: Partial<ArtifactBase>) => {
    try {
      const dataToSave = { ...formData, ...updates }
      
      if (!dataToSave.title) {
        setAutosaveStatus('saved')
        return
      }

      // Implementation would save to Supabase here
      console.log('Saving draft:', dataToSave)
      setAutosaveStatus('saved')
    } catch (error) {
      console.error('Error saving draft:', error)
      setAutosaveStatus('error')
    }
  }

  const canProceed = () => {
    if (!categorySpec) return false
    
    // Check required fields for current step
    const currentStepSpec = categorySpec.steps[currentStep]
    const requiredFields = currentStepSpec.fields.filter(field => 
      'required' in field && field.required
    )
    
    for (const field of requiredFields) {
      const value = getFieldValue(field.id)
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return false
      }
    }
    
    return true
  }

  const getFieldValue = (fieldId: string) => {
    if (['title', 'description', 'tags', 'peopleIds', 'propertyId', 'room'].includes(fieldId)) {
      return formData[fieldId as keyof ArtifactBase] || ''
    }
    return formData.categorySpecific?.[fieldId] || ''
  }

  const nextStep = () => {
    if (!categorySpec || currentStep >= categorySpec.steps.length - 1) return
    
    if (canProceed()) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const publishArtifact = async () => {
    try {
      if (!userProfile || !familyId) {
        toast({
          title: "Error",
          description: "User profile or family not found",
          variant: "destructive",
        })
        return
      }

      const artifactData = {
        ...formData,
        id: crypto.randomUUID(),
        status: 'published',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userProfile.id,
        familyId: familyId
      } as ArtifactBase

      // Implementation would save to Supabase here
      console.log('Publishing artifact:', artifactData)
      
      toast({
        title: "Artifact published",
        description: `Your ${categorySpec?.label.toLowerCase()} has been added to the family collection.`,
      })

      onComplete?.(artifactData)
      navigate('/collections?tab=object')
      
    } catch (error) {
      console.error('Error publishing artifact:', error)
      toast({
        title: "Error",
        description: "Failed to publish artifact. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!categorySpec) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Category not found</CardTitle>
            <CardDescription>The selected category could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/collections?tab=object')}>
              Back to Collections
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentStepSpec = categorySpec.steps[currentStep]
  const progress = ((currentStep + 1) / categorySpec.steps.length) * 100
  const isLastStep = currentStep === categorySpec.steps.length - 1

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onCancel || (() => navigate('/collections?tab=object'))}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Add {categorySpec.label}</h1>
                <p className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {categorySpec.steps.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {autosaveStatus === 'saving' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full" />
                  Saving...
                </div>
              )}
              {autosaveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4" />
                  Saved
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => saveDraft()}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              {categorySpec.steps.map((step, index) => (
                <span 
                  key={step.id}
                  className={index <= currentStep ? 'text-primary' : ''}
                >
                  {step.title}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-6 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{currentStepSpec.title}</CardTitle>
                {currentStepSpec.description && (
                  <CardDescription>{currentStepSpec.description}</CardDescription>
                )}
              </div>
              <Badge variant="outline">
                {currentStep + 1} / {categorySpec.steps.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ArtifactWizardStepRenderer
              step={currentStepSpec}
              formData={formData}
              onUpdate={updateFormData}
            />
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky bottom-0 z-50">
        <div className="container max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex gap-3">
              {isLastStep ? (
                <Button
                  onClick={publishArtifact}
                  disabled={!formData.title || !getFieldValue('type')}
                  className="bg-brand-green hover:bg-brand-green/90 text-brand-green-foreground"
                >
                  Publish {categorySpec.label}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}