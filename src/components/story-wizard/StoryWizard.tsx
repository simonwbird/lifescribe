import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { uploadMediaFile } from '@/lib/media'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { 
  type StoryFormData, 
  type WizardStep, 
  type AutosaveStatus, 
  type AIAssist,
  WIZARD_STEPS,
  PHOTO_FIRST_STEPS,
  AUDIO_FIRST_STEPS,
  VIDEO_FIRST_STEPS
} from './StoryWizardTypes'
import { MediaService } from '@/lib/mediaService'
import StoryWizardProgress from './StoryWizardProgress'
import StoryWizardSidebar from './StoryWizardSidebar'
import StoryWizardStep0 from './steps/StoryWizardStep0'
import StoryWizardStep1 from './steps/StoryWizardStep1'
import StoryWizardStep2 from './steps/StoryWizardStep2'
import StoryWizardStep3 from './steps/StoryWizardStep3'
import StoryWizardStep4 from './steps/StoryWizardStep4'
import StoryWizardStep5 from './steps/StoryWizardStep5'
import StoryWizardStep6 from './steps/StoryWizardStep6'

// Mock modals for AI assists
import VoiceToTextModal from './modals/VoiceToTextModal'
import PhoneImportModal from './modals/PhoneImportModal'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useDraftManager } from '@/hooks/useDraftManager'
import { DraftRecovery } from './DraftRecovery'
import { AutosaveIndicator } from './AutosaveIndicator'

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
  const { id: storyId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const isEditing = location.pathname.includes('/edit')
  
  const [currentStep, setCurrentStep] = useState<WizardStep>(0)
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
  const [showDraftRecovery, setShowDraftRecovery] = useState(false)
  
  // Check workflow type
  const workflowType = searchParams.get('type')
  const isPhotoFirst = workflowType === 'photo'
  const isAudioFirst = workflowType === 'audio'
  const isVideoFirst = workflowType === 'video'
  const isTextOnly = workflowType === 'text'
  
  // Draft management
  const draftKey = `story-${storyId || 'new'}-${workflowType || 'default'}`
  const { 
    autosaveStatus: draftAutosaveStatus, 
    hasDraft, 
    loadDraft, 
    clearDraft, 
    startAutosave, 
    stopAutosave 
  } = useDraftManager(draftKey)
  
  // Check workflow type - now moved above
  const currentStepOrder = isPhotoFirst ? PHOTO_FIRST_STEPS : 
                          isAudioFirst ? AUDIO_FIRST_STEPS :
                          isVideoFirst ? VIDEO_FIRST_STEPS :
                          WIZARD_STEPS

  // Mock AI assist data
  const [aiAssist] = useState<AIAssist>({
    titleSuggestions: [],
    tagSuggestions: [],
    peopleSuggestions: []
  })

  // Initialize form data from URL params and check for drafts
  useEffect(() => {
    // Check for existing draft first if not editing
    if (!storyId && !isEditing) {
      const existingDraft = loadDraft()
      if (existingDraft) {
        setShowDraftRecovery(true)
        return
      }
    }

    const personId = searchParams.get('person')
    const personName = searchParams.get('personName')
    const promptTitle = searchParams.get('prompt')
    const promptDescription = searchParams.get('description')
    const storyType = searchParams.get('type')

    // Set starting step based on workflow type
    if (storyType === 'photo') {
      setCurrentStep(3) // Start with Photos & Video step
      setCompletedSteps([])
    } else if (storyType === 'audio') {
      setCurrentStep(5) // Start with Audio Recording step  
      setCompletedSteps([])
    } else if (storyType === 'video') {
      setCurrentStep(6) // Start with Video Recording step
      setCompletedSteps([])
    } else if (storyType === 'text') {
      setCurrentStep(1) // Start with Basics step
      setCompletedSteps([])
    } else {
      // Default to input selection
      setCurrentStep(0)
      setCompletedSteps([])
    }

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
  }, [searchParams, storyId, isEditing, loadDraft])

  // Load existing story when editing
  useEffect(() => {
    if (!storyId || !isEditing) return
    const load = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('id', storyId)
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

          // Load existing media for this story
          const { data: mediaRows } = await supabase
            .from('media')
            .select('id, file_path, file_name, mime_type, file_size')
            .eq('story_id', storyId)
            .order('created_at', { ascending: true })

          if (mediaRows && mediaRows.length > 0) {
            const mediaItems = await Promise.all(mediaRows.map(async (row, index) => {
              const url = await MediaService.getMediaUrl(row.file_path)
              let file: File
              if (url) {
                const resp = await fetch(url)
                const blob = await resp.blob()
                file = new File([blob], row.file_name, { type: row.mime_type || 'application/octet-stream' })
              } else {
                file = new File([new Blob()], row.file_name, { type: row.mime_type || 'application/octet-stream' })
              }
              return {
                id: row.id,
                file,
                caption: '',
                isCover: index === 0,
                order: index,
                preview: url || undefined
              }
            }))

            setFormData(prev => ({ ...prev, media: mediaItems }))
          }
        }
      } catch (e) {
        console.error('Error loading story for edit:', e)
        toast({ title: 'Error', description: 'Failed to load story for editing', variant: 'destructive' })
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [storyId, isEditing, toast])

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

  // Start autosave when form data changes
  useEffect(() => {
    const getFormData = () => ({
      title: formData.title,
      content: formData.content,
      media: formData.media,
      date: formData.date,
      people: formData.people,
      tags: formData.tags,
      workflowType,
      currentStep,
      visibility: formData.visibility,
      collection: formData.collection
    })

    // Only start autosave if there's meaningful content and we're not showing draft recovery
    if ((formData.title || formData.content || formData.media.length > 0) && !showDraftRecovery) {
      startAutosave(getFormData)
    }

    return () => stopAutosave()
  }, [formData, workflowType, currentStep, startAutosave, stopAutosave, showDraftRecovery])

  const handleDraftRecovery = (draft: any) => {
    setFormData(prev => ({
      ...prev,
      title: draft.content.title || '',
      content: draft.content.content || '',
      media: draft.content.media || [],
      date: draft.content.date || prev.date,
      people: draft.content.people || [],
      tags: draft.content.tags || [],
      visibility: draft.content.visibility || prev.visibility,
      collection: draft.content.collection || prev.collection
    }))
    
    if (draft.content.currentStep !== undefined) {
      setCurrentStep(draft.content.currentStep)
    }
    
    setShowDraftRecovery(false)
    
    toast({
      title: "Draft Recovered",
      description: "Your previous work has been restored.",
    })
  }

  const handleDiscardDraft = () => {
    clearDraft()
    setShowDraftRecovery(false)
    
    toast({
      title: "Draft Discarded",
      description: "Starting with a fresh story.",
    })
  }

  const updateFormData = (updates: Partial<StoryFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const goToStep = (step: WizardStep) => {
    setCurrentStep(step)
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep])
    }
  }
  
  // Navigation functions that respect the current step order
  const goToNextStep = () => {
    const currentIndex = currentStepOrder.findIndex(s => s.id === currentStep)
    if (currentIndex < currentStepOrder.length - 1) {
      const nextStep = currentStepOrder[currentIndex + 1].id as WizardStep
      goToStep(nextStep)
    }
  }
  
  const goToPreviousStep = () => {
    const currentIndex = currentStepOrder.findIndex(s => s.id === currentStep)
    if (currentIndex > 0) {
      const previousStep = currentStepOrder[currentIndex - 1].id as WizardStep
      setCurrentStep(previousStep)
    }
  }

  // Helper function to parse various date formats into ISO format
  const parseDate = (dateString: string): string | null => {
    if (!dateString || dateString.trim() === '') return null
    
    try {
      // Handle various formats like "14th Sept 2025", "September 14, 2025", "2025-09-14", etc.
      const date = new Date(dateString)
      
      // If the date is invalid, try to clean up the string
      if (isNaN(date.getTime())) {
        // Remove ordinal suffixes (st, nd, rd, th)
        const cleanedString = dateString.replace(/(\d+)(st|nd|rd|th)/g, '$1')
        const cleanedDate = new Date(cleanedString)
        
        if (isNaN(cleanedDate.getTime())) {
          console.warn('Could not parse date:', dateString)
          return null
        }
        
        return cleanedDate.toISOString().split('T')[0] // Return YYYY-MM-DD format
      }
      
      return date.toISOString().split('T')[0] // Return YYYY-MM-DD format
    } catch (error) {
      console.warn('Error parsing date:', dateString, error)
      return null
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
      if (storyId && isEditing) {
        const parsedDate = parseDate(formData.date)
        
        const { data: updated, error: updateError } = await supabase
          .from('stories')
          .update({
            title: formData.title.trim(),
            content: formData.content.trim(),
            tags: formData.tags.length > 0 ? formData.tags : null,
            occurred_on: parsedDate,
            is_approx: formData.dateType === 'approximate'
          })
          .eq('id', storyId)
          .select()
          .single()

        if (updateError) throw updateError

        toast({ title: 'Story updated!', description: 'Your changes have been saved.' })
        navigate(`/stories/${storyId}`)
        return
      }

      // Create story first
      const parsedDate = parseDate(formData.date)
      
      // Add workflow-specific tags
      let tagsToUse = [...formData.tags]
      if (isAudioFirst && !tagsToUse.includes('audio-recording')) {
        tagsToUse.push('audio-recording')
      }
      if (isVideoFirst && !tagsToUse.includes('video-story')) {
        tagsToUse.push('video-story')
      }
      if (isPhotoFirst && !tagsToUse.includes('photo-story')) {
        tagsToUse.push('photo-story')
      }
      
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          family_id: familyId,
          profile_id: user.id,
          title: formData.title.trim(),
          content: formData.content.trim(),
          tags: tagsToUse.length > 0 ? tagsToUse : null,
          occurred_on: parsedDate,
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

      // Upload media using family/user path: familyId/profileId/filename
      if (formData.media.length > 0 && story) {
        for (const mediaItem of formData.media) {
          const { path, error: uploadErr } = await uploadMediaFile(
            mediaItem.file,
            familyId,
            user.id
          )

          if (!path || uploadErr) {
            throw new Error(uploadErr || 'Upload failed')
          }

          const { error: dbErr } = await supabase
            .from('media')
            .insert({
              story_id: story.id,
              profile_id: user.id,
              family_id: familyId,
              file_path: path,
              file_name: mediaItem.file.name,
              file_size: mediaItem.file.size,
              mime_type: mediaItem.file.type
            })

          if (dbErr) throw dbErr
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
    try {
      const draftData = {
        title: formData.title,
        content: formData.content,
        media: formData.media,
        date: formData.date,
        people: formData.people,
        tags: formData.tags,
        workflowType,
        currentStep,
        visibility: formData.visibility,
        collection: formData.collection
      }
      
      // Force save the draft
      startAutosave(() => draftData)
      
      toast({
        title: "Draft saved",
        description: "Your story has been saved as a draft.",
      })
    } catch (error) {
      console.error('Error saving draft:', error)
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive"
      })
    }
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
      case 0:
        return (
          <StoryWizardStep0
            formData={formData}
            onChange={updateFormData}
            onNext={goToNextStep}
          />
        )
      case 1:
        return (
          <StoryWizardStep1
            formData={formData}
            onChange={updateFormData}
            onNext={goToNextStep}
            onPrevious={isPhotoFirst || isAudioFirst ? goToPreviousStep : undefined}
            isPhotoFirst={isPhotoFirst}
          />
        )
      case 2:
        return (
        <StoryWizardStep2
          formData={formData}
          onChange={updateFormData}
          onNext={goToNextStep}
          onPrevious={goToPreviousStep}
          familyId={familyId}
          isPhotoFirst={isPhotoFirst}
        />
        )
      case 3:
        return (
          <StoryWizardStep3
            formData={formData}
            onChange={updateFormData}
            onNext={goToNextStep}
            onPrevious={goToPreviousStep}
            isPhotoFirst={isPhotoFirst}
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
            onPrevious={goToPreviousStep}
            isLoading={isLoading}
          />
        )
      case 5:
        return (
          <StoryWizardStep5
            formData={formData}
            onChange={updateFormData}
            onNext={goToNextStep}
            onPrevious={isAudioFirst ? undefined : goToPreviousStep}
          />
        )
      case 6:
        return (
          <StoryWizardStep6
            formData={formData}
            onChange={updateFormData}
            onNext={goToNextStep}
            onPrevious={isVideoFirst ? undefined : goToPreviousStep}
            isVideoFirst={isVideoFirst}
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
          autosaveStatus={draftAutosaveStatus.status !== 'idle' ? draftAutosaveStatus : autosaveStatus}
          isPhotoFirst={isPhotoFirst}
          isAudioFirst={isAudioFirst}
          isVideoFirst={isVideoFirst}
        />

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="shadow-sm">
              <CardContent className="p-6 lg:p-8">
                {/* Draft Recovery Modal */}
                {showDraftRecovery && (
                  <div className="mb-6">
                    <DraftRecovery
                      draft={loadDraft()!}
                      onRecover={handleDraftRecovery}
                      onDiscard={handleDiscardDraft}
                      onCancel={() => setShowDraftRecovery(false)}
                    />
                  </div>
                )}
                
                {/* Autosave Indicator */}
                {!showDraftRecovery && draftAutosaveStatus.status !== 'idle' && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center">
                      <AutosaveIndicator status={draftAutosaveStatus} />
                      <div className="text-xs text-muted-foreground">
                        Your progress is automatically saved
                      </div>
                    </div>
                  </div>
                )}
                
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
            Step {currentStepOrder.findIndex(s => s.id === currentStep) + 1} of {currentStepOrder.length}
          </div>
          <div className="flex gap-2">
            {currentStepOrder.findIndex(s => s.id === currentStep) < currentStepOrder.length - 1 ? (
              <button
                onClick={goToNextStep}
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
                  {isLoading ? (storyId && isEditing ? 'Saving...' : 'Publishing...') : (storyId && isEditing ? 'Save changes' : 'Publish')}
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