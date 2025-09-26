import { supabase } from '@/integrations/supabase/client'

/**
 * Create default prompt instances for a new family
 */
export async function initializeFamilyPrompts(familyId: string) {
  try {
    const { data, error } = await supabase.rpc('create_default_prompt_instances', {
      p_family_id: familyId
    })

    if (error) throw error
    
    console.log(`Created ${data} prompt instances for family ${familyId}`)
    return data
  } catch (error) {
    console.error('Error initializing family prompts:', error)
    throw error
  }
}

/**
 * Get prompt instances for a family with optional status filter
 */
export async function getPromptInstances(
  familyId: string, 
  status?: 'open' | 'in_progress' | 'completed'
) {
  try {
    let query = supabase
      .from('prompt_instances')
      .select(`
        *,
        prompt:prompts(*),
        responses:prompt_responses(*)
      `)
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching prompt instances:', error)
    throw error
  }
}

/**
 * Get counts of prompts by status
 */
export async function getPromptCounts(familyId: string) {
  try {
    const { data, error } = await supabase
      .from('prompt_instances')
      .select('status')
      .eq('family_id', familyId)

    if (error) throw error

    const counts = {
      open: 0,
      in_progress: 0,
      completed: 0
    }

    data?.forEach(instance => {
      counts[instance.status as keyof typeof counts]++
    })

    return counts
  } catch (error) {
    console.error('Error fetching prompt counts:', error)
    throw error
  }
}