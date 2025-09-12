import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { 
  type StoryFormData, 
  type WizardStep, 
  type AutosaveStatus, 
  type AIAssist,
  WIZARD_STEPS 
} from './StoryWizardTypes'
import StoryWizardProgress from './StoryWizardProgress'
import StoryWizardSidebar from './StoryWizardSidebar'
import StoryWizardStep1 from './steps/StoryWizardStep1'
import StoryWizardStep2 from './steps/StoryWizardStep2'
import StoryWizardStep3 from './steps/StoryWizardStep3'
import StoryWizardStep4 from './steps/StoryWizardStep4'

// Mock modals for AI assists
import VoiceToTextModal from './modals/VoiceToTextModal'
import PhoneImportModal from './modals/PhoneImportModal'

const initialFormData: StoryFormData = {
  title: '',
  content: '',
  date: '',
  dateType: 'approximate',
  location: '',
  people: [],
  tags: [],
  media: [],
  visibility: 'family',
  collection: 'none'
}

export default function StoryWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([])
  const [formData, setFormData] = useState<StoryFormData>(initialFormData)
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>({
    status: 'idle',
    message: 'Not saved'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [voiceModalOpen, setVoiceModalOpen] = useState(false)
  const [phoneModalOpen, setPhoneModalOpen] = useState(false)
  
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  // Mock AI assist data
  const [aiAssist] = useState<AIAssist>({
    titleSuggestions: [],
    tagSuggestions: [],
    peopleSuggestions: []
  })

  // Initialize form data from URL params
  useEffect(() => {
    const personId = searchParams.get('person')
    const personName = searchParams.get('personName')
    const promptTitle = searchParams.get('prompt')
    const promptDescription = searchParams.get('description')

    if (personId && personName) {
      setFormData(prev => ({
        ...prev,
        title: `Story about ${decodeURIComponent(personName)}`,
        people: [decodeURIComponent(personName)]
      }))
    }

    if (promptTitle) {
      setFormData(prev => ({
        ...prev,
        title: decodeURIComponent(promptTitle),
        content: promptDescription ? `${decodeURIComponent(promptDescription)}\n\n` : '',
        tags: ['memory-prompt']
      }))
    }
  }, [searchParams])

  // Get family ID
  useEffect(() => {
    const getFamilyId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: member } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .single()
        
        if (member) {
          setFamilyId(member.family_id)
        }
      }
    }
    getFamilyId()
  }, [])

  // Autosave logic
  const autosave = useCallback(async () => {
    if (!familyId || (!formData.title.trim() && !formData.content.trim())) {
      return
    }

    setAutosaveStatus({ status: 'saving', message: 'Saving...' })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Save as draft
      const draftKey = `story_draft_${user.id}`
      localStorage.setItem(draftKey, JSON.stringify({
        ...formData,
        lastSaved: new Date().toISOString(),
        currentStep
      }))

      setAutosaveStatus({
        status: 'saved',
        lastSaved: new Date(),
        message: 'Saved just now'
      })
    } catch (error) {
      console.error('Autosave error:', error)
      setAutosaveStatus({
        status: 'error',
        message: 'Save failed'
      })
    }
  }, [formData, familyId, currentStep])

  // Autosave on form changes
  useEffect(() => {
    const timeoutId = setTimeout(autosave, 2000)
    return () => clearTimeout(timeoutId)
  }, [autosave])

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const draftKey = `story_draft_${user.id}`
      const saved = localStorage.getItem(draftKey)
      
      if (saved && !searchParams.get('person') && !searchParams.get('prompt')) {
        try {
          const draft = JSON.parse(saved)
          setFormData(draft)
          setCurrentStep(draft.currentStep || 1)
          setAutosaveStatus({
            status: 'saved',
            lastSaved: new Date(draft.lastSaved),
            message: `Restored from ${new Date(draft.lastSaved).toLocaleTimeString()}`
          })
        } catch (error) {
          console.error('Error loading draft:', error)
        }
      }
    }
    loadDraft()
  }, [searchParams])

  const updateFormData = (updates: Partial<StoryFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step)
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep])
    }
  }

  const handlePublish = async () => {
    if (!familyId || !formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Story incomplete",
        description: "Please fill in at least the title and story content.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Prepare tags including people (store as tags for now since we don't have a people table)
      // In production, this would link to actual person records
      const updatedTags = [...formData.tags]
      if (formData.people.length > 0) {
        const peopleWithPrefix = formData.people.map(person => `person:${person}`)
        updatedTags.push(...peopleWithPrefix)
      }

      // Create story
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          family_id: familyId,
          profile_id: user.id,
          title: formData.title.trim(),
          content: formData.content.trim(),
          tags: updatedTags.length > 0 ? updatedTags : null,
          date: formData.date || null,
          location: formData.location || null,
          visibility: formData.visibility,
          collection_type: formData.collection !== 'none' ? formData.collection : null
        })
        .select()
        .single()

      if (storyError) throw storyError

      // Upload media
      if (formData.media.length > 0 && story) {
        for (const mediaItem of formData.media) {
          const fileExt = mediaItem.file.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `${user.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('media')
            .upload(filePath, mediaItem.file)

          if (uploadError) throw uploadError

          await supabase
            .from('media')
            .insert({
              story_id: story.id,
              profile_id: user.id,
              family_id: familyId,
              file_path: filePath,
              file_name: mediaItem.file.name,
              file_size: mediaItem.file.size,
              mime_type: mediaItem.file.type,
              caption: mediaItem.caption || null,
              is_cover: mediaItem.isCover,
              display_order: mediaItem.order
            })
        }
      }

      // Clear draft
      const draftKey = `story_draft_${user.id}`
      localStorage.removeItem(draftKey)

      toast({
        title: "Story published!",
        description: "Your story has been shared with your family.",
      })

      navigate('/home')
    } catch (error) {
      console.error('Error publishing story:', error)
      toast({
        title: "Publishing failed",
        description: "There was an error publishing your story. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    await autosave()
    toast({
      title: "Draft saved",
      description: "Your story has been saved as a draft.",
    })
  }

  const handlePreview = () => {
    // TODO: Implement preview modal
    toast({
      title: "Preview",
      description: "Preview functionality coming soon!",
    })
  }

  const handleTitleSuggestion = (title: string) => {
    updateFormData({ title })
    toast({
      title: "Title suggestion applied",
      description: "You can edit it further if needed.",
    })
  }

  const handleTagSuggestions = (tags: string[]) => {
    const newTags = [...new Set([...formData.tags, ...tags])]
    updateFormData({ tags: newTags })
    toast({
      title: "Tags suggested",
      description: `Added ${tags.length} suggested tags.`,
    })
  }

  const handlePeopleSuggestions = (people: string[]) => {
    const newPeople = [...new Set([...formData.people, ...people])]
    updateFormData({ people: newPeople })
    toast({
      title: "People suggested",
      description: `Added ${people.length} suggested people.`,
    })
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StoryWizardStep1
            formData={formData}
            onChange={updateFormData}
            onNext={() => goToStep(2)}
          />
        )
      case 2:
        return (
          <StoryWizardStep2
            formData={formData}
            onChange={updateFormData}
            onNext={() => goToStep(3)}
            onPrevious={() => goToStep(1)}
          />
        )
      case 3:
        return (
          <StoryWizardStep3
            formData={formData}
            onChange={updateFormData}
            onNext={() => goToStep(4)}
            onPrevious={() => goToStep(2)}
          />
        )
      case 4:
        return (
          <StoryWizardStep4
            formData={formData}
            onChange={updateFormData}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
            onPreview={handlePreview}
            onPrevious={() => goToStep(3)}
            isLoading={isLoading}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <StoryWizardProgress
          currentStep={currentStep}
          completedSteps={completedSteps}
          autosaveStatus={autosaveStatus}
        />

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="shadow-sm">
              <CardContent className="p-6 lg:p-8">
                {renderCurrentStep()}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <StoryWizardSidebar
              formData={formData}
              onTitleSuggestion={handleTitleSuggestion}
              onTagSuggestions={handleTagSuggestions}
              onPeopleSuggestions={handlePeopleSuggestions}
              onVoiceToText={() => setVoiceModalOpen(true)}
              onPhoneImport={() => setPhoneModalOpen(true)}
              aiAssist={aiAssist}
            />
          </div>
        </div>
      </div>

      {/* Mobile Sticky Actions */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur sm:hidden">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center gap-3">
          <div className="text-xs text-muted-foreground">
            Step {currentStep} of {WIZARD_STEPS.length}
          </div>
          <div className="flex gap-2">
            {currentStep < WIZARD_STEPS.length ? (
              <button
                onClick={() => goToStep((currentStep + 1) as WizardStep)}
                className="bg-brand-green hover:bg-brand-green/90 text-brand-green-foreground px-4 py-2 rounded-lg text-sm font-medium"
                disabled={
                  (currentStep === 1 && (!formData.title.trim() || !formData.content.trim())) ||
                  isLoading
                }
              >
                Continue
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveDraft}
                  className="border border-border px-3 py-2 rounded-lg text-sm"
                  disabled={isLoading}
                >
                  Draft
                </button>
                <button
                  onClick={handlePublish}
                  className="bg-brand-green hover:bg-brand-green/90 text-brand-green-foreground px-4 py-2 rounded-lg text-sm font-medium"
                  disabled={!formData.title.trim() || !formData.content.trim() || isLoading}
                >
                  {isLoading ? 'Publishing...' : 'Publish'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Assist Modals */}
      <VoiceToTextModal
        open={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onTextReceived={(text) => updateFormData({ content: formData.content + ' ' + text })}
      />
      
      <PhoneImportModal
        open={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
      />
    </div>
  )
}