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
 * Generate person-specific prompt instances when a person is added/updated
 */
export async function generatePersonPromptInstances(familyId: string, personId: string) {
  try {
    const { data, error } = await supabase.rpc('generate_person_prompt_instances', {
      p_family_id: familyId,
      p_person_id: personId
    })

    if (error) throw error
    
    console.log(`Created ${data} person-specific prompt instances for person ${personId}`)
    return data
  } catch (error) {
    console.error('Error generating person prompt instances:', error)
    throw error
  }
}

/**
 * Replace placeholders in prompt text with actual person names
 */
export function replacePlaceholders(text: string, people: Record<string, { name: string; relationship?: string }>) {
  let result = text

  // Replace specific person placeholders: {spouse_name}, {sibling_name}, etc.
  Object.entries(people).forEach(([personId, person]) => {
    const role = person.relationship?.toLowerCase() || 'person'
    result = result.replace(new RegExp(`{${role}_name}`, 'g'), person.name)
    result = result.replace(new RegExp(`{person_name}`, 'g'), person.name)
  })

  // Replace generic placeholders
  const firstPerson = Object.values(people)[0]
  if (firstPerson) {
    result = result.replace(/{name}/g, firstPerson.name)
  }

  return result
}

/**
 * Get missing people for locked prompts
 */
export async function getMissingPeopleForPrompts(familyId: string) {
  try {
    // Get all person-specific prompts
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('*')
      .eq('scope', 'person_specific')
      .eq('enabled', true)

    if (promptsError) throw promptsError

    // Get existing people in family
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .select('id, full_name')
      .eq('family_id', familyId)

    if (peopleError) throw peopleError

    // Get existing relationships
    const { data: relationships, error: relationshipsError } = await supabase
      .from('relationships')
      .select('from_person_id, to_person_id, relationship_type')
      .or(`from_person_id.in.(${people?.map(p => p.id).join(',')}),to_person_id.in.(${people?.map(p => p.id).join(',')})`)

    if (relationshipsError) throw relationshipsError

    // Find which person roles are missing
    const existingRoles = new Set<string>()
    
    relationships?.forEach(rel => {
      existingRoles.add(rel.relationship_type)
    })

    const missingRoles = prompts?.filter(prompt => 
      prompt.person_role && !existingRoles.has(prompt.person_role)
    ).map(prompt => ({
      role: prompt.person_role,
      prompts: prompts.filter(p => p.person_role === prompt.person_role)
    }))

    return missingRoles || []
  } catch (error) {
    console.error('Error getting missing people for prompts:', error)
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