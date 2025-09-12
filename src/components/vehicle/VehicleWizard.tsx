import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import VehicleWizardProgress from './VehicleWizardProgress'
import VehicleWizardStep1 from './steps/VehicleWizardStep1'
import VehicleWizardStep2 from './steps/VehicleWizardStep2'
import VehicleWizardStep3 from './steps/VehicleWizardStep3'
import VehicleWizardStep4 from './steps/VehicleWizardStep4'
import VehicleWizardStep5 from './steps/VehicleWizardStep5'
import type { 
  VehicleFormData, 
  VehicleWizardStep, 
  VehicleData,
  AutosaveStatus 
} from '@/lib/vehicleTypes'

export default function VehicleWizard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [currentStep, setCurrentStep] = useState<VehicleWizardStep>(1)
  const [completedSteps, setCompletedSteps] = useState<VehicleWizardStep[]>([])
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>({
    status: 'idle',
    message: ''
  })

  const [formData, setFormData] = useState<VehicleFormData>({
    title: '',
    vehicleData: {
      specs: { type: 'car' },
      identifiers: {},
      ownership: {},
      metrics: {},
      documents: {},
      maintenance: {},
      reminders: {},
      location: {}
    },
    visibility: 'family',
    photos: [],
    documents: []
  })

  const [userProfile, setUserProfile] = useState<any>(null)
  const [familyId, setFamilyId] = useState<string | null>(null)

  // Load user and family data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          navigate('/login')
          return
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setUserProfile(profile)

        // Get family membership
        const { data: member } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .single()

        if (member) {
          setFamilyId(member.family_id)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        toast({
          title: "Error",
          description: "Failed to load user data. Please try again.",
          variant: "destructive"
        })
      }
    }

    loadUserData()
  }, [navigate, toast])

  const updateFormData = (updates: Partial<VehicleFormData>) => {
    setFormData(prev => {
      const updated = { ...prev, ...updates }
      return updated
    })
    
    // Mark current step as completed if it has required data
    if (!completedSteps.includes(currentStep) && canProceed()) {
      setCompletedSteps(prev => [...prev, currentStep])
    }
  }

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.title && formData.vehicleData.specs.type)
      case 2:
        return true // Optional fields
      case 3:
        return true // Photos optional
      case 4:
        return true // All optional
      case 5:
        return true // Review step
      default:
        return false
    }
  }

  const nextStep = () => {
    if (canProceed() && currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as VehicleWizardStep)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as VehicleWizardStep)
    }
  }

  const saveDraft = async () => {
    if (!familyId || !userProfile) return

    setAutosaveStatus({ status: 'saving', message: 'Saving draft...' })

    try {
      // Create the basic thing record
      const { data: thing, error: thingError } = await supabase
        .from('things')
        .insert({
          family_id: familyId,
          created_by: userProfile.id,
          title: formData.title || 'Untitled Vehicle',
          object_type: 'vehicle',
          description: `${formData.vehicleData.specs.make || ''} ${formData.vehicleData.specs.model || ''} ${formData.vehicleData.specs.year || ''}`.trim(),
          tags: ['vehicle', formData.vehicleData.specs.type || 'car']
        })
        .select()
        .single()

      if (thingError) throw thingError

      setAutosaveStatus({ 
        status: 'saved', 
        message: 'Draft saved',
        lastSaved: new Date()
      })

      setTimeout(() => {
        setAutosaveStatus({ status: 'idle', message: '' })
      }, 2000)

    } catch (error) {
      console.error('Error saving draft:', error)
      setAutosaveStatus({ 
        status: 'error', 
        message: 'Failed to save draft'
      })
    }
  }

  const publishVehicle = async () => {
    if (!familyId || !userProfile) return

    try {
      // Upload photos first
      const photoUrls: string[] = []
      for (const photo of formData.photos) {
        const fileExt = photo.file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${familyId}/${userProfile.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, photo.file)

        if (!uploadError) {
          photoUrls.push(filePath)
        }
      }

      // Create the vehicle record
      const { data: thing, error: thingError } = await supabase
        .from('things')
        .insert({
          family_id: familyId,
          created_by: userProfile.id,
          title: formData.title,
          object_type: 'vehicle',
          description: `${formData.vehicleData.specs.make || ''} ${formData.vehicleData.specs.model || ''} ${formData.vehicleData.specs.year || ''}`.trim(),
          tags: [
            'vehicle', 
            formData.vehicleData.specs.type || 'car',
            ...(formData.vehicleData.specs.make ? [formData.vehicleData.specs.make.toLowerCase()] : []),
            ...(formData.vehicleData.specs.fuel ? [formData.vehicleData.specs.fuel] : [])
          ]
        })
        .select()
        .single()

      if (thingError) throw thingError

      // Create media records
      for (const photoUrl of photoUrls) {
        await supabase
          .from('media')
          .insert({
            family_id: familyId,
            profile_id: userProfile.id,
            thing_id: thing.id,
            file_path: photoUrl,
            file_name: photoUrl.split('/').pop() || '',
            file_size: 0, // We don't have size here
            mime_type: 'image/jpeg'
          })
      }

      toast({
        title: "Vehicle Published!",
        description: "Your vehicle has been added to the family archive.",
      })

      navigate('/collections?tab=object')

    } catch (error) {
      console.error('Error publishing vehicle:', error)
      toast({
        title: "Error",
        description: "Failed to publish vehicle. Please try again.",
        variant: "destructive"
      })
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <VehicleWizardStep1
            formData={formData}
            onUpdate={updateFormData}
          />
        )
      case 2:
        return (
          <VehicleWizardStep2
            formData={formData}
            onUpdate={updateFormData}
          />
        )
      case 3:
        return (
          <VehicleWizardStep3
            formData={formData}
            onUpdate={updateFormData}
          />
        )
      case 4:
        return (
          <VehicleWizardStep4
            formData={formData}
            onUpdate={updateFormData}
          />
        )
      case 5:
        return (
          <VehicleWizardStep5
            formData={formData}
            onUpdate={updateFormData}
            onPublish={publishVehicle}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/collections?tab=object')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Objects
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Add Vehicle</h1>
                <p className="text-sm text-muted-foreground">
                  Step {currentStep} of 5
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {autosaveStatus.status !== 'idle' && (
                <span className={`text-sm ${
                  autosaveStatus.status === 'error' 
                    ? 'text-destructive' 
                    : 'text-muted-foreground'
                }`}>
                  {autosaveStatus.message}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={saveDraft}
                disabled={autosaveStatus.status === 'saving'}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress */}
        <div className="mb-8">
          <VehicleWizardProgress
            currentStep={currentStep}
            completedSteps={completedSteps}
          />
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderCurrentStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < 5 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={publishVehicle}
              disabled={!formData.title}
            >
              Publish Vehicle
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}