import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic } from 'lucide-react'
import { getElderPrompts, ElderPrompt, truncatePrompt } from '@/lib/prompts/getElderPrompts'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useNavigate } from 'react-router-dom'
import { PromptControls } from './PromptControls'
import { InputTypeModal } from './InputTypeModal'
import { BlankCanvasModal } from './BlankCanvasModal'
import VoiceFirstHero from '@/components/home/VoiceFirstHero';
import InviteBanner from '@/components/home/InviteBanner';
import EnhancedPromptResponseArea from '@/components/simple/EnhancedPromptResponseArea';
import { useUnifiedDraftManager } from '@/hooks/useUnifiedDraftManager';
import { DraftProgressBanner } from '@/components/drafts/DraftProgressBanner';
import { ResumeSessionModal } from '@/components/drafts/ResumeSessionModal';
import QuickVoiceRecordModal from '@/components/voice/QuickVoiceRecordModal';

interface SimpleHeaderProps {
  profileId: string
  spaceId: string
  onRecordPrompt: (prompt: ElderPrompt) => void
}

export function SimpleHeader({ 
  profileId, 
  spaceId, 
  onRecordPrompt 
}: SimpleHeaderProps) {
  const [prompts, setPrompts] = useState<ElderPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [shuffling, setShuffling] = useState(false)
  const [showInputTypeModal, setShowInputTypeModal] = useState(false)
  const [showBlankCanvasModal, setShowBlankCanvasModal] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<ElderPrompt | null>(null)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [showQuickVoiceModal, setShowQuickVoiceModal] = useState(false)
  const { track } = useAnalytics()
  const navigate = useNavigate()
  
  const draftManager = useUnifiedDraftManager('simple_mode')

  useEffect(() => {
    loadPrompts()
    
    // Check for existing drafts on load
    const existingDrafts = draftManager.loadAllDrafts()
    if (existingDrafts.length > 0) {
      setShowResumeModal(true)
    }
  }, [profileId, spaceId])

  const loadPrompts = async () => {
    try {
      setLoading(true)
      const elderPrompts = await getElderPrompts(profileId, spaceId)
      setPrompts(elderPrompts)
      
      // Track impression
      track('simple_mode.header_view', {
        prompts_count: elderPrompts.length,
        has_upcoming: elderPrompts.some(p => p.kind === 'upcoming'),
        has_personal: elderPrompts.some(p => p.kind === 'personal')
      })

      // Track individual prompt impressions
      elderPrompts.forEach(prompt => {
        track('prompt.impression', {
          prompt_id: prompt.id,
          kind: prompt.kind,
          has_person: !!prompt.context?.personId
        })
      })
    } catch (error) {
      console.error('Failed to load prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShuffle = async () => {
    if (shuffling) return
    
    setShuffling(true)
    track('prompt.shuffle')
    
    try {
      const newPrompts = await getElderPrompts(profileId, spaceId)
      setPrompts(newPrompts)
    } catch (error) {
      console.error('Failed to shuffle prompts:', error)
    }
    
    // 3s cooldown to prevent frantic tapping
    setTimeout(() => setShuffling(false), 3000)
  }

  const handleSwapPrompt = (swapPrompt: ElderPrompt) => {
    track('prompt.swap', {
      from_prompt_id: prompts[0]?.id,
      to_prompt_id: swapPrompt.id,
      kind: swapPrompt.kind
    })

    // Move the selected alternate to primary position
    setPrompts(prev => {
      const newPrompts = [...prev]
      const swapIndex = newPrompts.findIndex(p => p.id === swapPrompt.id)
      if (swapIndex > 0) {
        // Swap the positions
        [newPrompts[0], newPrompts[swapIndex]] = [newPrompts[swapIndex], newPrompts[0]]
      }
      return newPrompts
    })
  }

  const handleRecordWithPrompt = (prompt: ElderPrompt) => {
    track('prompt.record_start', {
      prompt_id: prompt.id,
      kind: prompt.kind,
      has_person: !!prompt.context?.personId
    })
    
    // Show input type selection modal
    setSelectedPrompt(prompt)
    setShowInputTypeModal(true)
  }

  const handleRecordWithoutPrompt = () => {
    track('simple_mode.record_without_prompt')
    // Show blank canvas modal for input type selection
    setShowBlankCanvasModal(true)
  }

  const handleInputTypeSelected = (type: 'text' | 'audio' | 'video', prompt?: ElderPrompt) => {
    setShowInputTypeModal(false)
    setShowBlankCanvasModal(false)
    
    if (prompt) {
      // Handle prompt recording with specific input type
      if (type === 'audio') {
        onRecordPrompt(prompt)
      } else {
        // Navigate to text/video story creation with prompt
        const title = `Prompt: ${prompt.text.substring(0, 50)}...`
        const searchParams = new URLSearchParams({
          type: type,
          promptTitle: title,
          prompt_id: prompt.id,
          prompt_text: prompt.text,
          ...(prompt.context?.personId && { 
            person_id: prompt.context.personId 
          })
        })
        
        navigate(`/stories/new?${searchParams.toString()}`)
      }
    } else {
      // Handle blank canvas recording
      const searchParams = new URLSearchParams({
        type: type,
        blank: 'true'
      })
      
      navigate(`/stories/new?${searchParams.toString()}`)
    }
    
    setSelectedPrompt(null)
  }

  const handleResumeDraft = (draft: any) => {
    track('draft_resumed', { 
      draftId: draft.id, 
      type: draft.type,
      source: 'simple_mode' 
    })
    
    setShowResumeModal(false)
    
    // Navigate to appropriate editor based on draft type
    const searchParams = new URLSearchParams({
      type: draft.type,
      draft_id: draft.id,
      resume: 'true'
    })
    
    navigate(`/stories/new?${searchParams.toString()}`)
  }

  const handleDiscardDraft = (draftId: string) => {
    track('draft_deleted', { 
      draftId, 
      source: 'simple_mode' 
    })
    
    draftManager.clearDraft(draftId)
    
    // Close modal if no more drafts
    const remainingDrafts = draftManager.loadAllDrafts()
    if (remainingDrafts.length === 0) {
      setShowResumeModal(false)
    }
  }

  const handleStartFresh = () => {
    track('simple_mode.record_without_prompt')
    setShowResumeModal(false)
  }

  const handleQuickRecord = () => {
    track('activity_clicked', { action: 'quick_record' })
    setShowBlankCanvasModal(true)
  }

  const handleModalCancel = () => {
    setShowInputTypeModal(false)
    setShowBlankCanvasModal(false)
    setSelectedPrompt(null)
  }

  if (loading) {
    return (
      <Card className="w-full mb-6">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="space-y-2">
              <div className="h-5 bg-muted rounded w-32" />
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
            <div className="h-12 bg-muted rounded w-full" />
            <div className="flex justify-between items-center">
              <div className="h-4 bg-muted rounded w-40" />
              <div className="flex gap-2">
                <div className="h-10 bg-muted rounded w-20" />
                <div className="h-10 bg-muted rounded w-20" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const primaryPrompt = prompts[0]
  const alternatePrompts = prompts.slice(1, 3) // Max 2 alternates

  if (!primaryPrompt) {
    return null
  }

  return (
    <div className="w-full mb-8 space-y-4">
      {/* Draft Progress Banner */}
      <DraftProgressBanner 
        autosaveStatus={draftManager.autosaveStatus}
      />
      
      {/* Resume Session Modal */}
      <ResumeSessionModal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        drafts={draftManager.availableDrafts}
        onResume={handleResumeDraft}
        onDiscard={handleDiscardDraft}
        onStartFresh={handleStartFresh}
      />

      {/* Main Hero Card */}
      <Card className="w-full border-2 hover:border-primary/20 transition-colors">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="space-y-3 sm:space-y-4 lg:space-y-5">
            {/* Card Title */}
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-lg font-medium text-muted-foreground">
                Today's prompt
              </h2>
              
            {/* Main Prompt Text with Hear It Button */}
            <div className="space-y-3 sm:space-y-4" aria-live="polite">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1">
                  <p className="text-2xl sm:text-3xl font-medium leading-relaxed text-foreground">
                    {truncatePrompt(primaryPrompt.text, 90)}
                  </p>
                </div>
                <PromptControls
                  prompt={primaryPrompt}
                  onShuffle={handleShuffle}
                  shuffling={shuffling}
                  showShuffleOnly={false}
                />
              </div>
              <p className="text-base text-muted-foreground">
                No need to be perfect—just talk.
              </p>
            </div>
            </div>

            {/* Enhanced Prompt Response Area */}
            <EnhancedPromptResponseArea
              prompt={{
                id: primaryPrompt.id,
                text: primaryPrompt.text,
                type: primaryPrompt.kind === 'personal' ? 'personal' : 'general'
              }}
              onRecord={(format) => {
                // Start autosave for recording
                const draftFormat = format === 'voice' ? 'audio' : format
                draftManager.startAutosave(() => ({
                  prompt: primaryPrompt.text,
                  mode: draftFormat
                }), draftFormat)
                handleRecordWithPrompt(primaryPrompt)
              }}
              onBrowseFeed={() => {
                track('activity_clicked', { action: 'browse_feed' })
                navigate('/feed')
              }}
              onCreateFreeform={() => {
                track('activity_clicked', { action: 'create_freeform' })
                navigate('/create')
              }}
              onAddPhoto={() => {
                track('activity_clicked', { action: 'add_photo' })
                navigate('/create?mode=photo')
              }}
              onQuickVoice={() => {
                track('activity_clicked', { action: 'quick_voice' })
                setShowQuickVoiceModal(true)
              }}
              userAge="adult" // TODO: Get from user profile
            />
          </div>
        </CardContent>
      </Card>

      {/* Alternate Suggestions */}
      {alternatePrompts.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {alternatePrompts.map((prompt) => (
            <Card key={prompt.id} className="flex-1 border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-base font-medium leading-relaxed">
                        {truncatePrompt(prompt.text, 60)}
                      </p>
                    </div>
                    <PromptControls
                      prompt={prompt}
                      onShuffle={handleShuffle}
                      shuffling={shuffling}
                      showShuffleOnly={false}
                      compact={true}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      // Start autosave for blank canvas
                      draftManager.startAutosave(() => ({
                        mode: 'blank'
                      }), 'text')
                      handleRecordWithoutPrompt()
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full h-10 text-sm font-medium border-2 hover:bg-accent/50 gap-2"
                  >
                    <Mic className="w-4 h-4 text-primary" />
                    Record with this prompt
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Input Type Modal for Prompts */}
      {selectedPrompt && (
        <InputTypeModal
          isOpen={showInputTypeModal}
          prompt={selectedPrompt}
          onSelectType={(type) => handleInputTypeSelected(type, selectedPrompt)}
          onCancel={handleModalCancel}
        />
      )}

      {/* Quick Voice Recording Modal */}
      <QuickVoiceRecordModal
        open={showQuickVoiceModal}
        onClose={() => setShowQuickVoiceModal(false)}
        onStoryCreated={(storyId) => {
          track('activity_clicked', { 
            action: 'story_created_quick_voice',
            story_id: storyId 
          })
        }}
      />

      {/* Blank Canvas Modal */}
      <BlankCanvasModal
        isOpen={showBlankCanvasModal}
        onSelectType={(type) => handleInputTypeSelected(type)}
        onCancel={handleModalCancel}
      />
    </div>
  )
}