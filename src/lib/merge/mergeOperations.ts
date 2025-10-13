/**
 * Merge Operations for People and Media
 * Handles atomic merging with full undo capability
 */

import { supabase } from '@/integrations/supabase/client'

export interface MergePreview {
  canonical: any
  duplicate: any
  mergedData: any
  conflicts: string[]
  affectedRecords: {
    stories: number
    media: number
    relationships: number
    tags: number
  }
}

export async function previewPersonMerge(
  canonicalId: string,
  duplicateId: string
): Promise<MergePreview> {
  // Fetch both people
  const { data: canonical } = await supabase
    .from('people')
    .select('*')
    .eq('id', canonicalId)
    .single()

  const { data: duplicate } = await supabase
    .from('people')
    .select('*')
    .eq('id', duplicateId)
    .single()

  if (!canonical || !duplicate) {
    throw new Error('People not found')
  }

  // Count affected records
  const { count: storyCount } = await supabase
    .from('entity_links')
    .select('*', { count: 'exact', head: true })
    .eq('entity_id', duplicateId)
    .eq('entity_type', 'person')

  const { count: mediaCount } = await supabase
    .from('entity_links')
    .select('*', { count: 'exact', head: true })
    .eq('entity_id', duplicateId)
    .eq('entity_type', 'person')
    .eq('source_type', 'media')

  const { count: relationshipCount } = await supabase
    .from('relationships')
    .select('*', { count: 'exact', head: true })
    .or(`from_person_id.eq.${duplicateId},to_person_id.eq.${duplicateId}`)

  // Detect conflicts
  const conflicts: string[] = []
  const mergedData = { ...canonical }

  if (canonical.birth_date !== duplicate.birth_date && duplicate.birth_date) {
    conflicts.push('birth_date')
  }
  if (canonical.death_date !== duplicate.death_date && duplicate.death_date) {
    conflicts.push('death_date')
  }
  if (canonical.birth_place !== duplicate.birth_place && duplicate.birth_place) {
    conflicts.push('birth_place')
  }

  // Merge non-conflicting data (prefer canonical, but take duplicate if canonical is null)
  Object.keys(duplicate).forEach(key => {
    if (!canonical[key] && duplicate[key]) {
      mergedData[key] = duplicate[key]
    }
  })

  return {
    canonical,
    duplicate,
    mergedData,
    conflicts,
    affectedRecords: {
      stories: storyCount || 0,
      media: mediaCount || 0,
      relationships: relationshipCount || 0,
      tags: 0
    }
  }
}

export async function executePersonMerge(
  canonicalId: string,
  duplicateId: string,
  mergedData: any,
  reason: string
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Start transaction by calling edge function
  const { data, error } = await supabase.functions.invoke('merge-people', {
    body: {
      canonicalId,
      duplicateId,
      mergedData,
      reason,
      performedBy: user.id
    }
  })

  if (error) throw error
  return data.mergeId
}

export async function undoMerge(mergeId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.functions.invoke('undo-merge', {
    body: { mergeId, undoneby: user.id }
  })

  if (error) throw error
}

export async function getDuplicateCandidates(
  entityType: 'person' | 'media',
  status: 'pending' | 'merged' | 'dismissed' = 'pending'
): Promise<any[]> {
  if (entityType === 'person') {
    const { data, error } = await supabase
      .from('duplicate_candidates')
      .select(`
        *,
        person_a:people!duplicate_candidates_person_a_id_fkey(*),
        person_b:people!duplicate_candidates_person_b_id_fkey(*)
      `)
      .eq('status', status)
      .order('confidence_score', { ascending: false })

    if (error) throw error
    return data || []
  }

  // TODO: Implement media duplicate detection
  return []
}
