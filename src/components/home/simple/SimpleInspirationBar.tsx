import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Shuffle } from 'lucide-react'
import { getElderPrompts, ElderPrompt } from '@/lib/prompts/getElderPrompts'
import { useAnalytics } from '@/hooks/useAnalytics'
import { PromptCard } from './PromptCard'
import { PromptChip } from './PromptChip'

interface SimpleInspirationBarProps {
  profileId: string
  spaceId: string
  onRecordPrompt: (prompt: ElderPrompt) => void
}

export function SimpleInspirationBar({ 
  profileId, 
  spaceId, 
  onRecordPrompt 
}: SimpleInspirationBarProps) {
  const [prompts, setPrompts] = useState<ElderPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [shuffling, setShuffling] = useState(false)
  const { track } = useAnalytics()

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
    
    // Keep the primary (first) prompt, shuffle the alternates
    try {
      const newPrompts = await getElderPrompts(profileId, spaceId)
      // Ensure we get different alternates by requesting fresh prompts
      setPrompts(newPrompts)
    } catch (error) {
      console.error('Failed to shuffle prompts:', error)
    }
    
    // Cooldown to prevent frantic tapping
    setTimeout(() => setShuffling(false), 3000)
  }

  const handleRecordPrompt = (prompt: ElderPrompt) => {
    track('prompt.record_start', {
      prompt_id: prompt.id,
      kind: prompt.kind,
      has_person: !!prompt.context?.personId
    })
    
    onRecordPrompt(prompt)
  }

  if (loading) {
    return (
      <div className="w-full mb-6 space-y-4 animate-pulse">
        <div className="h-40 bg-muted rounded-lg" />
        <div className="flex gap-2">
          <div className="h-11 bg-muted rounded flex-1" />
          <div className="h-11 bg-muted rounded flex-1" />
          <div className="h-11 bg-muted rounded w-11" />
        </div>
      </div>
    )
  }

  const primaryPrompt = prompts[0]
  const alternatePrompts = prompts.slice(1, 3)

  if (!primaryPrompt) {
    return null
  }

  return (
    <div className="w-full mb-6 space-y-4">
      {/* Main Prompt Card */}
      <PromptCard
        prompt={primaryPrompt}
        onRecord={handleRecordPrompt}
      />

      {/* Alternate Prompts */}
      {alternatePrompts.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex gap-2 flex-1">
            {alternatePrompts.map((prompt) => (
              <PromptChip
                key={prompt.id}
                prompt={prompt}
                onRecord={handleRecordPrompt}
              />
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShuffle}
            disabled={shuffling}
            className="shrink-0 h-11 w-11 p-0"
            aria-label="Shuffle prompts"
          >
            <Shuffle className={`h-5 w-5 ${shuffling ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      )}
    </div>
  )
}
