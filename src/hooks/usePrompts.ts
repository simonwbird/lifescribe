import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface Prompt {
  id: string
  slug: string
  category: string
  scope: 'general' | 'person_specific'
  person_role: string | null
  title: string
  body: string
  tags: string[]
  enabled: boolean
  version: number
  created_at: string
}

export interface PromptInstance {
  id: string
  prompt_id: string | null
  family_id: string
  assignee_user_id: string | null
  source: string
  status: 'open' | 'in_progress' | 'completed'
  person_ids: string[]
  due_at: string | null
  snoozed_until: string | null
  expires_at: string | null
  created_at: string
  updated_at: string
  prompt?: Prompt
  responses?: PromptResponse[]
}

export interface PromptResponse {
  id: string
  prompt_instance_id: string
  author_user_id: string | null
  type: 'text' | 'audio' | 'video' | 'photo'
  text_body: string | null
  media_url: string | null
  media_duration_seconds: number | null
  caption: string | null
  transcript: string | null
  created_at: string
}

export interface PromptCounts {
  open: number
  in_progress: number
  completed: number
}

export function usePrompts(familyId: string, personId?: string) {
  const [instances, setInstances] = useState<PromptInstance[]>([])
  const [counts, setCounts] = useState<PromptCounts>({ open: 0, in_progress: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrompts = async (status?: 'open' | 'completed' | 'in_progress', filterPersonId?: string) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('prompt_instances')
        .select(`
          *,
          prompt:prompts(*)
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      // Filter by person if specified
      const targetPersonId = filterPersonId || personId
      if (targetPersonId) {
        query = query.contains('person_ids', [targetPersonId])
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setInstances((data || []) as PromptInstance[])

      // Calculate counts
      if (!status) {
        const openCount = data?.filter(i => i.status === 'open').length || 0
        const inProgressCount = data?.filter(i => i.status === 'in_progress').length || 0
        const completedCount = data?.filter(i => i.status === 'completed').length || 0
        
        setCounts({
          open: openCount,
          in_progress: inProgressCount,
          completed: completedCount
        })
      }

    } catch (err) {
      console.error('Error fetching prompts:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch prompts')
    } finally {
      setLoading(false)
    }
  }

  const startPrompt = async (instanceId: string) => {
    try {
      const { error } = await supabase
        .from('prompt_instances')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId)

      if (error) throw error

      // Refresh data
      await fetchPrompts()
    } catch (err) {
      console.error('Error starting prompt:', err)
      throw err
    }
  }

  const createResponse = async (
    instanceId: string,
    type: 'text' | 'audio' | 'video' | 'photo',
    data: {
      text_body?: string
      media_url?: string
      media_duration_seconds?: number
      caption?: string
      transcript?: string
    }
  ) => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('prompt_responses')
        .insert({
          prompt_instance_id: instanceId,
          author_user_id: user.user.id,
          type,
          ...data
        })

      if (error) throw error

      // Check if response meets completion threshold and update status
      let shouldComplete = false
      
      if (type === 'text' && data.text_body && data.text_body.length >= 280) {
        shouldComplete = true
      } else if ((type === 'audio' || type === 'video') && data.media_duration_seconds && data.media_duration_seconds >= 10) {
        shouldComplete = true
      } else if (type === 'photo' && data.caption && data.caption.length >= 15) {
        shouldComplete = true
      }

      if (shouldComplete) {
        await supabase
          .from('prompt_instances')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', instanceId)
      }

      // Refresh data
      await fetchPrompts()
    } catch (err) {
      console.error('Error creating response:', err)
      throw err
    }
  }

  const getTodaysPrompt = () => {
    const openInstances = instances.filter(i => i.status === 'open')
    // Return first open prompt as "today's prompt"
    return openInstances[0] || null
  }

  const getInProgressInstances = () => {
    return instances.filter(i => i.status === 'in_progress').slice(0, 3)
  }

  const getPersonProgress = (targetPersonId: string) => {
    const personInstances = instances.filter(i => 
      i.person_ids && i.person_ids.includes(targetPersonId)
    )
    return {
      completed: personInstances.filter(i => i.status === 'completed').length,
      total: personInstances.length,
      instances: personInstances
    }
  }

  const getNextPromptForPerson = (targetPersonId: string) => {
    const personInstances = instances.filter(i => 
      i.person_ids && i.person_ids.includes(targetPersonId)
    )
    
    // Priority: in_progress first → due_at soonest → diversity (different categories)
    const inProgress = personInstances.find(i => i.status === 'in_progress')
    if (inProgress) return inProgress
    
    const open = personInstances.filter(i => i.status === 'open')
    if (open.length === 0) return null
    
    // Sort by due_at if available, then by category diversity
    return open.sort((a, b) => {
      if (a.due_at && b.due_at) {
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
      }
      return 0
    })[0]
  }

  useEffect(() => {
    if (familyId) {
      fetchPrompts()
    }
  }, [familyId, personId])

  return {
    instances,
    counts,
    loading,
    error,
    fetchPrompts,
    startPrompt,
    createResponse,
    getTodaysPrompt,
    getInProgressInstances,
    getPersonProgress,
    getNextPromptForPerson
  }
}