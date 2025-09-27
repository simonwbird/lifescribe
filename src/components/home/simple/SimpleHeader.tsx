import React from 'react'
import { useNavigate } from 'react-router-dom'
import TodaysPromptCard from '@/components/prompts/TodaysPromptCard'
import ContinueSection from '@/components/prompts/ContinueSection'
import { useTodaysPrompt, useInProgressPrompts } from '@/hooks/useTodaysPrompt'
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
  const { data: todaysPrompt, isLoading: todaysLoading, refetch } = useTodaysPrompt(spaceId)
  const { data: inProgressPrompts = [], isLoading: inProgressLoading } = useInProgressPrompts(spaceId)
  const navigate = useNavigate()

  const loading = todaysLoading || inProgressLoading

  const handleRespondToPrompt = (instanceId: string) => {
    const instance = todaysPrompt
    if (instance?.prompt) {
      const searchParams = new URLSearchParams({
        type: 'text',
        promptTitle: instance.prompt.title,
        prompt_id: instance.id,
        family_id: spaceId
      })
      navigate(`/capture/story-wizard?${searchParams.toString()}`)
    }
  }

  const handleRecordPrompt = (instanceId: string) => {
    const instance = todaysPrompt
    if (instance?.prompt && onRecordPrompt) {
      onRecordPrompt({
        id: instance.prompt.id,
        text: instance.prompt.body,
        kind: 'general' as const
      })
    }
  }

  const handleBrowseAll = () => {
    navigate('/prompts')
  }

  const handleContinuePrompt = (instanceId: string) => {
    const instance = inProgressPrompts.find(p => p.id === instanceId)
    if (instance?.prompt) {
      const searchParams = new URLSearchParams({
        type: 'text',
        promptTitle: instance.prompt.title,
        prompt_id: instance.id,
        family_id: spaceId
      })
      navigate(`/capture/story-wizard?${searchParams.toString()}`)
    }
  }

  const handleShuffle = () => {
    // Trigger a refetch of today's prompt to get a different one
    refetch()
  }

  return (
    <div className="w-full mb-8 space-y-4">
      <TodaysPromptCard 
        promptInstance={todaysPrompt}
        onRespond={handleRespondToPrompt}
        onBrowseAll={handleBrowseAll}
        onShuffle={handleShuffle}
        loading={loading}
      />
      
      <ContinueSection 
        instances={inProgressPrompts}
        onContinue={handleContinuePrompt}
      />
    </div>
  )
}