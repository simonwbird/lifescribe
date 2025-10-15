import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface StoryWithPets {
  id: string
  title: string
  content: string | null
  created_at: string
  profile_id: string
  family_id: string
  cover_url?: string
  profiles?: {
    full_name: string
    avatar_url: string | null
  }
  pet_ids?: string[]
}

export function usePetStories(petId: string | null, limit = 5) {
  return useQuery({
    queryKey: ['pet-stories', petId, limit],
    queryFn: async (): Promise<StoryWithPets[]> => {
      if (!petId) return []

      // Get story IDs linked to this pet
      const { data: links, error: linksError } = await supabase
        .from('story_pet_links')
        .select('story_id')
        .eq('pet_id', petId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (linksError) throw linksError
      if (!links || links.length === 0) return []

      const storyIds = links.map(l => l.story_id)

      // Get stories with author info
      const { data: stories, error: storiesError } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          content,
          created_at,
          profile_id,
          family_id,
          profiles:profile_id(full_name, avatar_url)
        `)
        .in('id', storyIds)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (storiesError) throw storiesError

      return stories || []
    },
    enabled: !!petId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export function useRecentPetStories(familyId: string | null, limit = 5) {
  return useQuery({
    queryKey: ['recent-pet-stories', familyId, limit],
    queryFn: async (): Promise<StoryWithPets[]> => {
      if (!familyId) return []

      // Get recent story IDs that have pet links
      const { data: links, error: linksError } = await supabase
        .from('story_pet_links')
        .select('story_id, pet_id')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(limit * 2) // Get more to account for filtering

      if (linksError) throw linksError
      if (!links || links.length === 0) return []

      // Get unique story IDs
      const storyIds = [...new Set(links.map(l => l.story_id))]

      // Get stories with author info
      const { data: stories, error: storiesError } = await supabase
        .from('stories')
        .select(`
          id,
          title,
          content,
          created_at,
          profile_id,
          family_id,
          profiles:profile_id(full_name, avatar_url)
        `)
        .in('id', storyIds)
        .eq('status', 'published')
        .order('created_at', { ascending: false})
        .limit(limit)

      if (storiesError) throw storiesError

      // Attach pet IDs to each story
      const storiesWithPets = (stories || []).map(story => ({
        ...story,
        pet_ids: links.filter(l => l.story_id === story.id).map(l => l.pet_id)
      }))

      return storiesWithPets
    },
    enabled: !!familyId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}
