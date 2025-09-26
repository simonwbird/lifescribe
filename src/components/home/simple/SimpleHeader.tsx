import React from 'react'
import { useNavigate } from 'react-router-dom'
import TodaysPromptCard from '@/components/prompts/TodaysPromptCard'
import ContinueSection from '@/components/prompts/ContinueSection'
import { usePrompts } from '@/hooks/usePrompts'
import { ElderPrompt } from '@/lib/prompts/getElderPrompts'

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
  const { getTodaysPrompt, getInProgressInstances, loading } = usePrompts(spaceId)
  const navigate = useNavigate()

  const todaysPrompt = getTodaysPrompt()
  const inProgressPrompts = getInProgressInstances()

  const handleRespondToPrompt = (instanceId: string) => {
    const instance = todaysPrompt
    if (instance?.prompt) {
      const searchParams = new URLSearchParams({
        type: 'text',
        promptTitle: instance.prompt.title,
        prompt_id: instance.id,
        prompt_text: instance.prompt.body
      })
      navigate(`/stories/new?${searchParams.toString()}`)
    }
  }

  const handleBrowseAll = () => {
    navigate('/prompts/browse')
  }

  const handleContinuePrompt = (instanceId: string) => {
    const instance = inProgressPrompts.find(p => p.id === instanceId)
    if (instance?.prompt) {
      const searchParams = new URLSearchParams({
        type: 'text',
        promptTitle: instance.prompt.title,
        prompt_id: instance.id,
        prompt_text: instance.prompt.body
      })
      navigate(`/stories/new?${searchParams.toString()}`)
    }
  }

  return (
    <div className="w-full mb-8 space-y-4">
      <TodaysPromptCard 
        promptInstance={todaysPrompt}
        onRespond={handleRespondToPrompt}
        onBrowseAll={handleBrowseAll}
        loading={loading}
      />
      
      <ContinueSection 
        instances={inProgressPrompts}
        onContinue={handleContinuePrompt}
      />
    </div>
  )
}