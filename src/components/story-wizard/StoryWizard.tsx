import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
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
  const { id: editingIdParam } = useParams<{ id?: string }>()
  const [editingId, setEditingId] = useState<string | null>(null)

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
        people: [{ name: decodeURIComponent(personName), isExisting: false }]
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

  // Load existing story when editing
  useEffect(() => {
    if (!editingIdParam) return
    setEditingId(editingIdParam)
    const load = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('id', editingIdParam)
          .single()
        if (error) throw error
        if (data) {
          setFormData(prev => ({
            ...prev,
            title: data.title || '',
            content: data.content || '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            date: data.occurred_on || '',
            dateType: data.is_approx ? 'approximate' : 'exact'
          }))
        }
      } catch (e) {
        console.error('Error loading story for edit:', e)
        toast({ title: 'Error', description: 'Failed to load story for editing', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [editingIdParam, toast])

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
          
          // Convert legacy people format if needed
          if (draft.people && Array.isArray(draft.people) && draft.people.length > 0) {
            if (typeof draft.people[0] === 'string') {
              draft.people = draft.people.map((name: string) => ({
                name,
                isExisting: false
              }))
            }
          }
          
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

      // If editing, update existing story
      if (editingId) {
        const { data: updated, error: updateError } = await supabase
          .from('stories')
          .update({
            title: formData.title.trim(),
            content: formData.content.trim(),
            tags: formData.tags.length > 0 ? formData.tags : null,
            occurred_on: formData.date || null,
            is_approx: formData.dateType === 'approximate'
          })
          .eq('id', editingId)
          .select()
          .single()

        if (updateError) throw updateError

        toast({ title: 'Story updated!', description: 'Your changes have been saved.' })
        navigate(`/stories/${editingId}`)
        return
      }

      // Create story first
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          family_id: familyId,
          profile_id: user.id,
          title: formData.title.trim(),
          content: formData.content.trim(),
          tags: formData.tags.length > 0 ? formData.tags : null,
          occurred_on: null,
          is_approx: formData.dateType === 'approximate'
        })
        .select()
        .single()

      if (storyError) throw storyError

      // Handle people - create new people records and link to story
      if (formData.people.length > 0 && story) {
        for (const person of formData.people) {
          let personId = person.id

          // Create new person record if they don't exist
          if (!person.isExisting && !personId) {
            const { data: newPerson, error: personError } = await supabase
              .from('people')
              .insert({
                family_id: familyId,
                full_name: person.name,
                created_by: user.id
              })
              .select('id')
              .single()

            if (personError) {
              console.error('Error creating person:', personError)
              continue // Skip this person if creation fails
            }

            personId = newPerson.id
          }

          // Link person to story
          if (personId) {
            await supabase
              .from('person_story_links')
              .insert({
                person_id: personId,
                story_id: story.id,
                family_id: familyId
              })
          }
        }
      }

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
              mime_type: mediaItem.file.type
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
    const existingNames = formData.people.map(p => typeof p === 'string' ? p : p.name)
    const newPeopleObjects = people
      .filter(name => !existingNames.includes(name))
      .map(name => ({ name, isExisting: false }))
    
    updateFormData({ 
      people: [...formData.people, ...newPeopleObjects]
    })
    toast({
      title: "People suggested",
      description: `Added ${newPeopleObjects.length} suggested people.`,
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
          familyId={familyId}
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
                  {isLoading ? (editingId ? 'Saving...' : 'Publishing...') : (editingId ? 'Save changes' : 'Publish')}
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