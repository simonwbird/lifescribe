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
  const { track } = useAnalytics()
  const navigate = useNavigate()

  useEffect(() => {
    loadPrompts()
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
      {/* Main Hero Card */}
      <Card className="w-full border-2 hover:border-primary/20 transition-colors">
        <CardContent className="p-4 sm:p-6 lg:p-8 xl:p-10">
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Card Title */}
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-lg font-medium text-muted-foreground">
                Today's prompt
              </h2>
              
              {/* Main Prompt Text */}
              <div className="space-y-2 sm:space-y-3" aria-live="polite">
                <p className="text-2xl sm:text-3xl font-medium leading-relaxed text-foreground">
                  {truncatePrompt(primaryPrompt.text, 90)}
                </p>
                <p className="text-base text-muted-foreground">
                  No need to be perfect—just talk.
                </p>
              </div>
            </div>

            {/* Primary Action */}
            <div className="space-y-3 sm:space-y-4">
              <Button
                onClick={() => handleRecordWithPrompt(primaryPrompt)}
                size="lg"
                className="w-full sm:w-auto h-14 text-lg font-medium px-8 bg-primary hover:bg-primary/90 min-w-44"
              >
                <Mic className="w-6 h-6 mr-3" />
                Start with this
              </Button>

              {/* Secondary Action */}
              <div className="text-center sm:text-left">
                <button
                  onClick={handleRecordWithoutPrompt}
                  className="text-primary hover:text-primary/80 underline underline-offset-4 text-base font-medium"
                  title="Share any memory or thought that comes to mind — no prompt needed"
                >
                  Share whatever's on your mind
                </button>
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex justify-between items-center pt-2 sm:pt-4">
              <div className="flex-1" />
              <PromptControls
                prompt={primaryPrompt}
                onShuffle={handleShuffle}
                shuffling={shuffling}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alternate Suggestions */}
      {alternatePrompts.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {alternatePrompts.map((prompt) => (
            <Button
              key={prompt.id}
              onClick={() => handleRecordWithPrompt(prompt)}
              variant="outline"
              size="lg"
              className="flex-1 h-14 px-6 text-base font-medium text-left justify-start min-w-0 bg-background hover:bg-accent/50 border-2 gap-3"
            >
              <Mic className="w-5 h-5 flex-shrink-0 text-primary" />
              <span className="truncate">
                {truncatePrompt(prompt.text, 60)}
              </span>
            </Button>
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

      {/* Blank Canvas Modal */}
      <BlankCanvasModal
        isOpen={showBlankCanvasModal}
        onSelectType={(type) => handleInputTypeSelected(type)}
        onCancel={handleModalCancel}
      />
    </div>
  )
}