/**
 * Utility functions to apply Shirley seed data to a person page
 */

import { supabase } from '@/integrations/supabase/client'
import { shirleySeedData } from '@/data/shirleySeedData'

export async function applyShirleySeedData(personId: string, familyId: string) {
  try {
    // Update person with Shirley's data
    const { error: personError } = await supabase
      .from('people')
      .update({
        given_name: shirleySeedData.person.given_name,
        middle_names: shirleySeedData.person.middle_names,
        surname: shirleySeedData.person.surname,
        birth_date: shirleySeedData.person.birth_date,
        death_date: shirleySeedData.person.death_date,
        birth_place: shirleySeedData.person.birth_place,
        status: 'passed',
      })
      .eq('id', personId)

    if (personError) throw personError

    // Update bio block if it exists
    const { data: bioBlock } = await supabase
      .from('person_page_blocks')
      .select('id')
      .eq('person_id', personId)
      .eq('type', 'bio_overview')
      .single()

    if (bioBlock) {
      const { error: bioError } = await supabase
        .from('person_page_blocks')
        .update({
          content_json: {
            short_bio: shirleySeedData.bio.short_bio,
            long_bio: shirleySeedData.bio.long_bio,
            tone: shirleySeedData.bio.tone,
            sources: [],
          } as any
        })
        .eq('id', bioBlock.id)

      if (bioError) throw bioError
    }

    // Update quick facts block if it exists  
    const { data: factsBlock } = await supabase
      .from('person_page_blocks')
      .select('id')
      .eq('person_id', personId)
      .eq('type', 'quick_facts')
      .single()

    if (factsBlock) {
      const { error: factsError } = await supabase
        .from('person_page_blocks')
        .update({
          content_json: {
            facts: shirleySeedData.quickFacts.map(f => ({ ...f })),
          } as any
        })
        .eq('id', factsBlock.id)

      if (factsError) throw factsError
    }

    return { success: true }
  } catch (error) {
    console.error('Error applying Shirley seed data:', error)
    return { success: false, error }
  }
}
