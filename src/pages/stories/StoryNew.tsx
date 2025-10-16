import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Header from '@/components/Header'
import ComposeText from '@/pages/compose/ComposeText'
import ComposePhotos from '@/pages/compose/ComposePhotos'
import ComposeVoice from '@/pages/compose/ComposeVoice'
import ComposeVideo from '@/pages/compose/ComposeVideo'
import ComposeMixed from '@/pages/compose/ComposeMixed'
import { supabase } from '@/integrations/supabase/client'
import { useComposerState, ComposerMode } from '@/hooks/useComposerState'
import { useToast } from '@/hooks/use-toast'
import { useStoryAutosave } from '@/hooks/useStoryAutosave'
import { useAnalytics } from '@/hooks/useAnalytics'

type ComposerTab = 'text' | 'photo' | 'voice' | 'video' | 'mixed'

export interface ComposerPrefillData {
  promptId?: string
  personId?: string
  children?: string[] // comma-separated in URL, parsed to array
  circle?: string
  album?: string
  source?: string
  propertyId?: string
}

export default function StoryNew() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { track } = useAnalytics()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const tabParam = (searchParams.get('tab') || 'text') as ComposerTab
  const draftId = searchParams.get('draft')
  const [activeTab, setActiveTab] = useState<ComposerTab>(tabParam)
  const [familyId, setFamilyId] = useState<string>('')
  const [isLoadingDraft, setIsLoadingDraft] = useState(!!draftId)

  // Use shared composer state
  const { state: composerState, updateState, switchMode, hasContent } = useComposerState(tabParam)
  
  // Autosave hook
  const { save, storyId, isSaving } = useStoryAutosave({ 
    storyId: draftId,
    enabled: true 
  })

  // Load draft content if resuming a draft
  useEffect(() => {
    async function loadDraft() {
      if (!draftId) return
      
      try {
        const { data: draft, error } = await supabase
          .from('stories')
          .select('title, content, occurred_on, is_approx, happened_at_property_id, metadata')
          .eq('id', draftId)
          .single()

        if (error) throw error
        
        if (draft) {
          // Populate composer state with draft content
          updateState({
            title: draft.title || '',
            content: draft.content || '',
            dateValue: {
              date: draft.occurred_on ? new Date(draft.occurred_on) : null,
              precision: draft.is_approx ? 'circa' : 'exact',
              yearOnly: false
            }
          })
        }
      } catch (error) {
        console.error('Error loading draft:', error)
        toast({
          title: 'Error loading draft',
          description: 'Could not load the draft content',
          variant: 'destructive'
        })
      } finally {
        setIsLoadingDraft(false)
      }
    }
    
    loadDraft()
  }, [draftId])

  // Track composer open on mount
  useEffect(() => {
    track('composer_open', {
      route: window.location.pathname,
      tab: activeTab,
      params_present: {
        promptId: !!searchParams.get('promptId'),
        personId: !!searchParams.get('personId'),
        draft: !!draftId,
        source: searchParams.get('source') || 'direct'
      }
    })
    
    // Track draft resume if applicable
    if (draftId) {
      track('draft_resume', { 
        draft_id: draftId,
        tab: activeTab
      })
    }
  }, [])

  // Get family ID
  useEffect(() => {
    async function getFamilyId() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()
      
      if (data) setFamilyId(data.family_id)
    }
    getFamilyId()
  }, [])

  // Autosave on content change
  useEffect(() => {
    if (!familyId || !hasContent()) return
    
    const occurredDate = composerState.dateValue.date 
      ? composerState.dateValue.date.toISOString().split('T')[0]
      : null
    
    const isApprox = composerState.dateValue.precision === 'circa' || 
                     composerState.dateValue.precision === 'year' ||
                     composerState.dateValue.precision === 'month'
    
    save({
      title: composerState.title,
      content: composerState.content,
      familyId,
      occurred_on: occurredDate,
      is_approx: isApprox,
      propertyId: prefillData.propertyId
    })
  }, [composerState.title, composerState.content, familyId, composerState.dateValue])

  // Store tab metadata in draft
  useEffect(() => {
    if (!storyId) return
    
    async function updateTabMetadata() {
      await supabase
        .from('stories')
        .update({ 
          metadata: { tab: activeTab, source: searchParams.get('source') }
        })
        .eq('id', storyId)
      
      // Track draft save
      track('draft_save', {
        draft_id: storyId,
        tab: activeTab,
        has_title: !!composerState.title,
        has_content: !!composerState.content
      })
    }
    updateTabMetadata()
  }, [storyId, activeTab])

  // Warn before closing browser tab with unsaved content
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasContent() && !isSaving) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasContent, isSaving])
  
  // Parse prefill params
  const prefillData: ComposerPrefillData = {
    promptId: searchParams.get('promptId') || undefined,
    personId: searchParams.get('personId') || undefined,
    children: searchParams.get('children')?.split(',') || undefined,
    circle: searchParams.get('circle') || undefined,
    album: searchParams.get('album') || undefined,
    source: searchParams.get('source') || undefined,
    propertyId: searchParams.get('propertyId') || undefined,
  }

  // Load prompt data if promptId is present
  const [promptTitle, setPromptTitle] = useState<string>('')
  
  useEffect(() => {
    if (prefillData.promptId && prefillData.promptId !== 'today') {
      loadPrompt(prefillData.promptId)
    } else if (prefillData.promptId === 'today') {
      setPromptTitle("Today's Prompt")
    }
  }, [prefillData.promptId])

  async function loadPrompt(promptId: string) {
    const { data } = await supabase
      .from('prompt_instances')
      .select('id, prompts(title)')
      .eq('id', promptId)
      .single()
    
    if (data && data.prompts) {
      setPromptTitle((data.prompts as any).title)
    }
  }

  // Sync activeTab with URL param
  useEffect(() => {
    const urlTab = searchParams.get('tab') as ComposerTab
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab)
    }
  }, [searchParams, activeTab])

  const handleTabChange = (value: string) => {
    const newTab = value as ComposerTab
    setActiveTab(newTab)
    switchMode(newTab)
    
    // Update URL without triggering navigation
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', newTab)
    setSearchParams(newParams, { replace: true })
  }

  // Detect if user should upgrade to mixed mode
  const shouldShowMixedUpgrade = () => {
    if (activeTab === 'mixed') return false
    
    const hasText = composerState.title.trim() || composerState.content.trim()
    const hasPhotos = composerState.photos.length > 0
    const hasAudio = composerState.audioBlob !== null
    const hasVideo = composerState.videoBlob !== null
    
    const mediaCount = [hasText, hasPhotos, hasAudio, hasVideo].filter(Boolean).length
    return mediaCount > 1
  }

  const handleUpgradeToMixed = () => {
    setActiveTab('mixed')
    switchMode('mixed')
    
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', 'mixed')
    setSearchParams(newParams, { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Create Story</h1>
            {promptTitle && (
              <Badge variant="secondary" className="text-sm">
                {promptTitle}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Choose how you'd like to capture your story
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="photo">Photo</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="mixed">Mixed</TabsTrigger>
          </TabsList>

          {/* Mixed Mode Upgrade Alert */}
          {shouldShowMixedUpgrade() && (
            <Alert className="mb-4 border-primary/50 bg-primary/5">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-sm">
                  You've added multiple types of content. Switch to Mixed mode for a richer story.
                </span>
                <Button 
                  size="sm" 
                  onClick={handleUpgradeToMixed}
                  className="ml-4"
                >
                  Upgrade to Mixed
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <TabsContent value="text" className="mt-0">
            <ComposeText 
              prefillData={prefillData} 
              composerState={composerState}
              updateState={updateState}
            />
          </TabsContent>

          <TabsContent value="photo" className="mt-0">
            <ComposePhotos 
              prefillData={prefillData}
              composerState={composerState}
              updateState={updateState}
            />
          </TabsContent>

          <TabsContent value="voice" className="mt-0">
            <ComposeVoice 
              prefillData={prefillData}
              composerState={composerState}
              updateState={updateState}
            />
          </TabsContent>

          <TabsContent value="video" className="mt-0">
            <ComposeVideo 
              prefillData={prefillData}
              composerState={composerState}
              updateState={updateState}
            />
          </TabsContent>

          <TabsContent value="mixed" className="mt-0">
            <ComposeMixed 
              prefillData={prefillData}
              composerState={composerState}
              updateState={updateState}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
