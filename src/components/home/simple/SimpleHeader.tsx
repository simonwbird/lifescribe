import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
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
  const queryClient = useQueryClient()

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

  const handleShuffle = async () => {
    try {
      // Get all open prompts for shuffling
      const { data: openPrompts, error } = await supabase
        .from('prompt_instances')
        .select(`
          id,
          status,
          person_ids,
          due_at,
          created_at,
          updated_at,
          prompt:prompts(
            id,
            title,
            body,
            category
          )
        `)
        .eq('family_id', spaceId)
        .eq('status', 'open')
        .order('created_at', { ascending: true })

      if (error) throw error
      
      if (openPrompts && openPrompts.length > 1) {
        // Get a random prompt that's different from the current one
        const availablePrompts = openPrompts.filter(p => p.id !== todaysPrompt?.id)
        if (availablePrompts.length > 0) {
          const randomIndex = Math.floor(Math.random() * availablePrompts.length)
          const selectedPrompt = availablePrompts[randomIndex]
          
          // Update the query cache to show the new prompt
          queryClient.setQueryData(['todays-prompt', spaceId], selectedPrompt)
        }
      }
    } catch (error) {
      console.error('Error shuffling prompt:', error)
    }
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