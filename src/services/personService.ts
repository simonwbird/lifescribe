import { supabase } from '@/integrations/supabase/client'
import { generatePersonPromptInstances } from './promptService'

/**
 * Handle person creation - generate relevant prompt instances
 */
export async function handlePersonCreated(familyId: string, personId: string) {
  try {
    // Generate person-specific prompt instances
    await generatePersonPromptInstances(familyId, personId)
    
    console.log(`Generated prompts for new person: ${personId}`)
  } catch (error) {
    console.error('Error handling person creation:', error)
    throw error
  }
}

/**
 * Handle person update - regenerate prompts if relationships changed
 */
export async function handlePersonUpdated(familyId: string, personId: string, changes: any) {
  try {
    // If relationships were updated, regenerate prompts
    if (changes.relationships_changed) {
      await generatePersonPromptInstances(familyId, personId)
    }
    
    console.log(`Updated prompts for person: ${personId}`)
  } catch (error) {
    console.error('Error handling person update:', error)
    throw error
  }
}

/**
 * Handle person deletion - soft-hide their prompt instances
 */
export async function handlePersonDeleted(familyId: string, personId: string) {
  try {
    // Soft-hide prompt instances for this person by updating status
    const { error } = await supabase
      .from('prompt_instances')
      .update({ 
        status: 'completed', // Mark as completed to hide from active lists
        updated_at: new Date().toISOString()
      })
      .eq('family_id', familyId)
      .contains('person_ids', [personId])
      .in('status', ['open', 'in_progress'])

    if (error) throw error
    
    console.log(`Soft-hid prompts for deleted person: ${personId}`)
  } catch (error) {
    console.error('Error handling person deletion:', error)
    throw error
  }
}

/**
 * Handle relationship creation - generate combo prompts for groups
 */
export async function handleRelationshipCreated(familyId: string, fromPersonId: string, toPersonId: string, relationshipType: string) {
  try {
    // For sibling relationships, check if we need to create/update combo prompts
    if (relationshipType === 'sibling' || relationshipType === 'brother' || relationshipType === 'sister') {
      await generateSiblingComboPrompts(familyId)
    }
    
    // Generate prompts for both people involved in the relationship
    await generatePersonPromptInstances(familyId, fromPersonId)
    await generatePersonPromptInstances(familyId, toPersonId)
    
    console.log(`Generated combo prompts for relationship: ${relationshipType}`)
  } catch (error) {
    console.error('Error handling relationship creation:', error)
    throw error
  }
}

/**
 * Generate combo prompts for sibling groups
 */
async function generateSiblingComboPrompts(familyId: string) {
  try {
    // Get all siblings in the family
    const { data: relationships, error: relationshipsError } = await supabase
      .from('relationships')
      .select(`
        from_person_id,
        to_person_id,
        relationship_type,
        from_person:people!relationships_from_person_id_fkey(id, full_name, family_id),
        to_person:people!relationships_to_person_id_fkey(id, full_name, family_id)
      `)
      .in('relationship_type', ['sibling', 'brother', 'sister'])

    if (relationshipsError) throw relationshipsError

    // Group siblings together
    const siblingGroups = new Map<string, Set<string>>()
    
    relationships?.forEach(rel => {
      const fromFamilyId = (rel.from_person as any)?.family_id
      const toFamilyId = (rel.to_person as any)?.family_id
      
      if (fromFamilyId === familyId && toFamilyId === familyId) {
        const fromId = rel.from_person_id
        const toId = rel.to_person_id
        
        // Find existing group or create new one
        let groupKey = null
        for (const [key, group] of siblingGroups.entries()) {
          if (group.has(fromId) || group.has(toId)) {
            groupKey = key
            break
          }
        }
        
        if (!groupKey) {
          groupKey = `sibling_group_${siblingGroups.size + 1}`
          siblingGroups.set(groupKey, new Set())
        }
        
        siblingGroups.get(groupKey)!.add(fromId)
        siblingGroups.get(groupKey)!.add(toId)
      }
    })

    // Create combo prompts for each sibling group with 2+ members
    for (const [groupKey, siblingIds] of siblingGroups.entries()) {
      if (siblingIds.size >= 2) {
        await createSiblingComboInstances(familyId, Array.from(siblingIds))
      }
    }
    
  } catch (error) {
    console.error('Error generating sibling combo prompts:', error)
    throw error
  }
}

/**
 * Create combo prompt instances for a group of siblings
 */
async function createSiblingComboInstances(familyId: string, siblingIds: string[]) {
  try {
    // Get combo prompts for siblings
    const { data: comboPrompts, error: promptsError } = await supabase
      .from('prompts')
      .select('*')
      .eq('scope', 'person_specific')
      .eq('person_role', 'sibling')
      .like('slug', '%combo%')

    if (promptsError) throw promptsError

    // Check if combo instances already exist for this group
    for (const prompt of comboPrompts || []) {
      const { data: existingInstances } = await supabase
        .from('prompt_instances')
        .select('id')
        .eq('family_id', familyId)
        .eq('prompt_id', prompt.id)
        .overlaps('person_ids', siblingIds)

      // Only create if doesn't exist
      if (!existingInstances || existingInstances.length === 0) {
        const { error: insertError } = await supabase
          .from('prompt_instances')
          .insert({
            prompt_id: prompt.id,
            family_id: familyId,
            person_ids: siblingIds,
            status: 'open',
            source: 'auto_generated'
          })

        if (insertError) {
          console.error('Error creating combo instance:', insertError)
        }
      }
    }
  } catch (error) {
    console.error('Error creating sibling combo instances:', error)
    throw error
  }
}