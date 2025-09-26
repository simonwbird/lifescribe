import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useLabs } from './useLabs'
import { replacePlaceholders, getMissingPeopleForPrompts, generatePersonPromptInstances } from '@/services/promptService'

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
  status: 'open' | 'in_progress' | 'completed' | 'skipped' | 'not_applicable' | 'snoozed'
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
  const { flags } = useLabs()
  const queryClient = useQueryClient()
  const isPeopleSpecificEnabled = flags['prompts.peopleSpecific']

  // Optimized people query with caching
  const { data: people = {} } = useQuery({
    queryKey: ['people-map', familyId],
    queryFn: async () => {
      const [{ data: peopleData, error: peopleError }, { data: relationshipsData, error: relationshipsError }] = await Promise.all([
        supabase.from('people').select('id, full_name').eq('family_id', familyId),
        supabase.from('relationships').select('from_person_id, to_person_id, relationship_type')
      ])

      if (peopleError) throw peopleError
      if (relationshipsError) throw relationshipsError

      const peopleMap: Record<string, { name: string; relationship?: string }> = {}
      peopleData?.forEach(person => {
        const relationship = relationshipsData?.find(r => 
          r.from_person_id === person.id || r.to_person_id === person.id
        )
        peopleMap[person.id] = {
          name: person.full_name,
          relationship: relationship?.relationship_type
        }
      })
      return peopleMap
    },
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Optimized prompt instances query
  const { data: promptData, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['prompt-instances', familyId, personId, isPeopleSpecificEnabled],
    queryFn: async () => {
      let query = supabase
        .from('prompt_instances')
        .select(`*, prompt:prompts(*)`)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (personId) {
        query = query.contains('person_ids', [personId])
      }

      const { data, error } = await query
      if (error) throw error

      if (!data || data.length === 0) {
        const { initializeFamilyPrompts } = await import('@/services/promptService')
        await initializeFamilyPrompts(familyId)
        const { data: retryData, error: retryError } = await query
        if (retryError) throw retryError
        return retryData || []
      }

      return data || []
    },
    enabled: !!familyId,
    staleTime: 2 * 60 * 1000, // 2 minutes for prompts
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  const [lockedPrompts, setLockedPrompts] = useState<any[]>([])

  // Process instances with placeholders
  const instances = (promptData || [])
    .filter(instance => {
      if (instance.prompt?.scope === 'general') return true
      if (instance.prompt?.scope === 'person_specific') return isPeopleSpecificEnabled
      return true
    })
    .map(instance => {
      if (instance.prompt) {
        const relevantPeople: Record<string, { name: string; relationship?: string }> = {}
        instance.person_ids?.forEach((id: string) => {
          if (people[id]) {
            relevantPeople[id] = people[id]
          }
        })
        
        return {
          ...instance,
          prompt: {
            ...instance.prompt,
            title: replacePlaceholders(instance.prompt.title, relevantPeople),
            body: replacePlaceholders(instance.prompt.body, relevantPeople)
          }
        }
      }
      return instance
    }) as PromptInstance[]

  // Calculate counts
  const counts = {
    open: instances.filter(i => i.status === 'open').length,
    in_progress: instances.filter(i => i.status === 'in_progress').length,
    completed: instances.filter(i => i.status === 'completed').length
  }

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch prompts') : null

  const fetchPrompts = async (status?: 'open' | 'completed' | 'in_progress', filterPersonId?: string, category?: 'Birthdays' | 'Favorites') => {
    await queryClient.invalidateQueries({ 
      queryKey: ['prompt-instances', familyId, personId, isPeopleSpecificEnabled] 
    })
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
      await queryClient.invalidateQueries({ 
        queryKey: ['prompt-instances', familyId, personId, isPeopleSpecificEnabled] 
      })
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
      await queryClient.invalidateQueries({ 
        queryKey: ['prompt-instances', familyId, personId, isPeopleSpecificEnabled] 
      })
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

  // Fetch locked prompts when people-specific is enabled
  useEffect(() => {
    if (isPeopleSpecificEnabled && familyId) {
      getMissingPeopleForPrompts(familyId)
        .then(setLockedPrompts)
        .catch(err => console.warn('Error fetching locked prompts:', err))
    }
  }, [isPeopleSpecificEnabled, familyId])

  const getBirthdayPrompts = () => {
    return instances.filter(i => i.source === 'birthday' && i.status === 'open')
      .sort((a, b) => {
        const dateA = new Date(a.due_at || 0)
        const dateB = new Date(b.due_at || 0)
        return dateA.getTime() - dateB.getTime()
      })
  }

  const getFavoritePrompts = () => {
    return instances.filter(i => i.source === 'favorites')
  }

  const getUpcomingBirthdaysThisMonth = () => {
    const today = new Date()
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    return instances.filter(i => {
      if (i.source !== 'birthday' || !i.due_at) return false
      const dueDate = new Date(i.due_at)
      return dueDate >= today && dueDate <= nextMonth
    }).sort((a, b) => {
      const dateA = new Date(a.due_at || 0)
      const dateB = new Date(b.due_at || 0)
      return dateA.getTime() - dateB.getTime()
    })
  }

  const getDaysUntilBirthday = (instance: any) => {
    if (!instance.due_at) return null
    const today = new Date()
    const dueDate = new Date(instance.due_at)
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const generateDynamicPrompts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-dynamic-prompts')
      if (error) throw error
      
      // Refresh prompts after generation
      await fetchPrompts()
      return data
    } catch (err) {
      console.error('Error generating dynamic prompts:', err)
      throw err
    }
  }

  const generatePromptsForPerson = async (targetPersonId: string) => {
    try {
      await generatePersonPromptInstances(familyId, targetPersonId)
      // Refresh prompts after generation
      await queryClient.invalidateQueries({ 
        queryKey: ['prompt-instances', familyId, personId, isPeopleSpecificEnabled] 
      })
    } catch (err) {
      console.error('Error generating prompts for person:', err)
      throw err
    }
  }

  return {
    instances,
    counts,
    loading,
    error,
    lockedPrompts,
    people,
    fetchPrompts,
    startPrompt,
    createResponse,
    getTodaysPrompt,
    getInProgressInstances,
    getPersonProgress,
    getNextPromptForPerson,
    generatePromptsForPerson,
    getBirthdayPrompts,
    getFavoritePrompts,
    getUpcomingBirthdaysThisMonth,
    getDaysUntilBirthday,
    generateDynamicPrompts
  }
}