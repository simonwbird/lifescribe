import { useState, useEffect } from 'react'
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
  const [instances, setInstances] = useState<PromptInstance[]>([])
  const [counts, setCounts] = useState<PromptCounts>({ open: 0, in_progress: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lockedPrompts, setLockedPrompts] = useState<any[]>([])
  const [people, setPeople] = useState<Record<string, { name: string; relationship?: string }>>({})

  const isPeopleSpecificEnabled = flags['prompts.peopleSpecific']

  const fetchPrompts = async (status?: 'open' | 'completed' | 'in_progress', filterPersonId?: string, category?: 'Birthdays' | 'Favorites') => {
    try {
      setLoading(true)
      setError(null)

      // Fetch people for placeholder replacement
      const { data: peopleData, error: peopleError } = await supabase
        .from('people')
        .select('id, full_name')
        .eq('family_id', familyId)

      if (peopleError) throw peopleError

      // Fetch relationships separately to avoid complex joins
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from('relationships')
        .select('from_person_id, to_person_id, relationship_type')

      if (relationshipsError) throw relationshipsError

      // Build people lookup for placeholder replacement
      const peopleMap: Record<string, { name: string; relationship?: string }> = {}
      peopleData?.forEach(person => {
        // Find primary relationship for this person
        const relationship = relationshipsData?.find(r => 
          r.from_person_id === person.id || r.to_person_id === person.id
        )
        
        peopleMap[person.id] = {
          name: person.full_name,
          relationship: relationship?.relationship_type
        }
      })
      setPeople(peopleMap)

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

      // Filter by category if specified
      if (category) {
        if (category === 'Birthdays') {
          query = query.eq('source', 'birthday')
        } else if (category === 'Favorites') {
          query = query.eq('source', 'favorites')
        }
      }

      // Filter by person if specified
      const targetPersonId = filterPersonId || personId
      if (targetPersonId) {
        query = query.contains('person_ids', [targetPersonId])
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // If no instances exist for this family, initialize them
      if (!data || data.length === 0) {
        console.log('No prompt instances found, initializing...')
        try {
          const { initializeFamilyPrompts } = await import('@/services/promptService')
          await initializeFamilyPrompts(familyId)
          
          // Retry the query after initialization
          const { data: retryData, error: retryError } = await query
          if (retryError) throw retryError
          
          const initializedData = retryData || []
          console.log(`Initialized ${initializedData.length} prompt instances`)
          
          const processedInstances = initializedData.filter(instance => {
            if (instance.prompt?.scope === 'general') return true
            if (instance.prompt?.scope === 'person_specific') return isPeopleSpecificEnabled
            return true
          }).map(instance => {
            if (instance.prompt) {
              const relevantPeople: Record<string, { name: string; relationship?: string }> = {}
              instance.person_ids?.forEach((id: string) => {
                if (peopleMap[id]) {
                  relevantPeople[id] = peopleMap[id]
                }
              })
              
              return {
                ...instance,
                status: instance.status as PromptInstance['status'], // Type assertion
                prompt: {
                  ...instance.prompt,
                  scope: instance.prompt.scope as 'general' | 'person_specific', // Type assertion
                  title: replacePlaceholders(instance.prompt.title, relevantPeople),
                  body: replacePlaceholders(instance.prompt.body, relevantPeople)
                }
              } as PromptInstance
            }
            return {
              ...instance,
              status: instance.status as PromptInstance['status'] // Type assertion
            } as PromptInstance
          })
          
          setInstances(processedInstances)
          
          // Update counts
          const newCounts = {
            open: processedInstances.filter(i => i.status === 'open').length,
            in_progress: processedInstances.filter(i => i.status === 'in_progress').length,
            completed: processedInstances.filter(i => i.status === 'completed').length
          }
          setCounts(newCounts)
          
          return // Exit early after initialization
        } catch (initError) {
          console.error('Failed to initialize prompt instances:', initError)
          // Continue with empty state
        }
      }

      // Filter instances based on feature flag and apply placeholder replacement
      const filteredData = (data || []).filter(instance => {
        // Always show general prompts
        if (instance.prompt?.scope === 'general') return true
        
        // Only show person-specific prompts if feature flag is enabled
        if (instance.prompt?.scope === 'person_specific') {
          return isPeopleSpecificEnabled
        }
        
        return true
      }).map(instance => {
        // Replace placeholders in prompt text
        if (instance.prompt) {
          const relevantPeople: Record<string, { name: string; relationship?: string }> = {}
          instance.person_ids?.forEach((id: string) => {
            if (peopleMap[id]) {
              relevantPeople[id] = peopleMap[id]
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
      })

      setInstances(filteredData as PromptInstance[])

      // Calculate counts from filtered data
      if (!status) {
        const openCount = filteredData?.filter(i => i.status === 'open').length || 0
        const inProgressCount = filteredData?.filter(i => i.status === 'in_progress').length || 0
        const completedCount = filteredData?.filter(i => i.status === 'completed').length || 0
        
        setCounts({
          open: openCount,
          in_progress: inProgressCount,
          completed: completedCount
        })
      }

      // Fetch locked prompts if people-specific is enabled
      if (isPeopleSpecificEnabled) {
        try {
          const missingRoles = await getMissingPeopleForPrompts(familyId)
          setLockedPrompts(missingRoles)
        } catch (lockedError) {
          console.warn('Error fetching locked prompts:', lockedError)
        }
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
  }, [familyId, personId, isPeopleSpecificEnabled])

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
      await fetchPrompts()
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