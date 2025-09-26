import { supabase } from '@/integrations/supabase/client'

export interface Favorite {
  id: string
  person_id: string
  family_id: string
  type: 'place' | 'song' | 'food' | 'hobby' | 'memory' | 'other'
  value: string
  value_hash: string
  notes?: string
  created_at: string
  created_by: string
  updated_at: string
}

export interface CreateFavoriteRequest {
  person_id: string
  family_id: string
  type: Favorite['type']
  value: string
  notes?: string
}

export interface UpdateFavoriteRequest {
  value?: string
  notes?: string
}

/**
 * Compute SHA256 hash for favorite value (for deduplication)
 */
async function computeValueHash(value: string): Promise<string> {
  const { data, error } = await supabase.rpc('compute_value_hash', {
    input_value: value
  })

  if (error) throw error
  return data
}

/**
 * Create a favorite and generate corresponding prompt instance
 */
export async function createFavorite(favoriteData: CreateFavoriteRequest): Promise<Favorite> {
  try {
    const valueHash = await computeValueHash(favoriteData.value)
    
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) throw new Error('User not authenticated')

    // Insert favorite (will handle duplicates via unique constraint)
    const { data: favorite, error: favoriteError } = await supabase
      .from('favorites')
      .insert({
        ...favoriteData,
        value_hash: valueHash,
        created_by: user.user.id
      })
      .select()
      .single()

    if (favoriteError) {
      // If duplicate, return existing favorite
      if (favoriteError.code === '23505') {
        const { data: existingFavorite, error: fetchError } = await supabase
          .from('favorites')
          .select('*')
          .eq('person_id', favoriteData.person_id)
          .eq('type', favoriteData.type)
          .eq('value_hash', valueHash)
          .single()

        if (fetchError) throw fetchError
        return existingFavorite as Favorite
      }
      throw favoriteError
    }

    // Generate favorite prompt instance
    await generateFavoritePromptInstance(favorite as Favorite)

    return favorite as Favorite
  } catch (error) {
    console.error('Error creating favorite:', error)
    throw error
  }
}

/**
 * Update a favorite and regenerate prompt instance if value changed
 */
export async function updateFavorite(favoriteId: string, updates: UpdateFavoriteRequest): Promise<Favorite> {
  try {
    let valueHash: string | undefined
    if (updates.value) {
      valueHash = await computeValueHash(updates.value)
    }

    const { data: favorite, error } = await supabase
      .from('favorites')
      .update({
        ...updates,
        ...(valueHash && { value_hash: valueHash })
      })
      .eq('id', favoriteId)
      .select()
      .single()

    if (error) throw error

    // If value changed, regenerate prompt instance
    if (updates.value) {
      await generateFavoritePromptInstance(favorite as Favorite)
    }

    return favorite as Favorite
  } catch (error) {
    console.error('Error updating favorite:', error)
    throw error
  }
}

/**
 * Get favorites for a person
 */
export async function getFavorites(personId: string): Promise<Favorite[]> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('person_id', personId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Favorite[]
  } catch (error) {
    console.error('Error fetching favorites:', error)
    throw error
  }
}

/**
 * Delete a favorite
 */
export async function deleteFavorite(favoriteId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting favorite:', error)
    throw error
  }
}

/**
 * Generate prompt instance for a favorite
 */
async function generateFavoritePromptInstance(favorite: Favorite): Promise<void> {
  try {
    // Get favorite prompt template
    const { data: favoriteTemplates, error: templatesError } = await supabase
      .from('prompts')
      .select('*')
      .eq('scope', 'general')
      .like('slug', '%favorite%')
      .eq('enabled', true)

    if (templatesError) throw templatesError

    let favoriteTemplate = favoriteTemplates?.[0]

    // Create default favorite template if none exists
    if (!favoriteTemplate) {
      const { data: newTemplate, error: createError } = await supabase
        .from('prompts')
        .insert({
          slug: 'favorite-memory',
          title: 'Tell us about {favorite_value}',
          body: 'Tell us about why you love {favorite_value} and what makes it special to you.',
          category: 'Favorites',
          scope: 'general',
          enabled: true,
          tags: ['favorites', 'memories', 'personal'],
          version: 1
        })
        .select()
        .single()

      if (createError) throw createError
      favoriteTemplate = newTemplate
    }

    const dynamicKey = `fav:${favorite.person_id}:${favorite.type}:${favorite.value_hash}`

    // Check if instance already exists
    const { data: existingInstance } = await supabase
      .from('prompt_instances')
      .select('id')
      .eq('dynamic_key', dynamicKey)
      .single()

    if (!existingInstance) {
      // Create new favorite prompt instance
      const { error: insertError } = await supabase
        .from('prompt_instances')
        .insert({
          prompt_id: favoriteTemplate.id,
          family_id: favorite.family_id,
          person_ids: [favorite.person_id],
          status: 'open',
          source: 'favorites',
          dynamic_key: dynamicKey
        })

      if (insertError) {
        console.error('Error creating favorite prompt instance:', insertError)
        throw insertError
      }

      console.log(`Created favorite prompt instance for ${favorite.type}: ${favorite.value}`)
    }
  } catch (error) {
    console.error('Error generating favorite prompt instance:', error)
    throw error
  }
}