import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function usePropertyStories(familyId: string | null, limit = 5) {
  return useQuery({
    queryKey: ['property-stories', familyId, limit],
    queryFn: async () => {
      if (!familyId) return []
      
      const { data: linksData, error } = await supabase
        .from('story_property_links' as any)
        .select(`story_id, property_id, created_at, family_id`)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching property stories:', error)
        return []
      }

      let linksList: any[] = linksData || []

      const storyIds = Array.from(new Set((linksList || []).map((l: any) => l.story_id).filter(Boolean)))
      const propertyIds = Array.from(new Set((linksList || []).map((l: any) => l.property_id).filter(Boolean)))

      // If no links found (e.g., trigger not yet created), fall back to stories with a property set
      let stories: any[] = []
      let properties: any[] = []

      if (storyIds.length > 0 || propertyIds.length > 0) {
        const [storiesRes, propertiesRes] = await Promise.all([
          storyIds.length
            ? supabase
                .from('stories' as any)
                .select('id, title, content, created_at, profile_id, occurred_on, happened_at_property_id')
                .in('id', storyIds)
            : Promise.resolve({ data: [], error: null } as any),
          propertyIds.length
            ? supabase
                .from('properties' as any)
                .select('id, display_title, name, title')
                .in('id', propertyIds)
            : Promise.resolve({ data: [], error: null } as any)
        ])

        if ((storiesRes as any).error || (propertiesRes as any).error) {
          console.error('Error fetching related data:', {
            storiesError: (storiesRes as any).error,
            propertiesError: (propertiesRes as any).error
          })
        }
        stories = (storiesRes as any).data || []
        properties = (propertiesRes as any).data || []
      } else {
        // Fallback: query recent stories that already have a property set
        const { data: fallbackStories, error: fallbackError } = await supabase
          .from('stories' as any)
          .select('id, title, content, created_at, profile_id, occurred_on, happened_at_property_id')
          .eq('family_id', familyId)
          .not('happened_at_property_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (fallbackError) {
          console.error('Error fetching fallback property stories:', fallbackError)
          return []
        }
        stories = fallbackStories || []
        const fallbackPropertyIds = Array.from(
          new Set(stories.map((s: any) => s.happened_at_property_id).filter(Boolean))
        )
        if (fallbackPropertyIds.length > 0) {
          const { data: propsData, error: propsError } = await supabase
            .from('properties' as any)
            .select('id, display_title, name, title')
            .in('id', fallbackPropertyIds)
          if (propsError) {
            console.error('Error fetching properties for fallback stories:', propsError)
          }
          properties = propsData || []
        }

        // Construct synthetic links so return shape stays the same
        linksList = (stories || []).map((s: any) => ({
          story_id: s.id,
          property_id: s.happened_at_property_id,
          created_at: s.created_at
        })) as any
      }

      const storiesById = Object.fromEntries((stories || []).map((s: any) => [s.id, s]))
      const propertiesById = Object.fromEntries((properties || []).map((p: any) => [p.id, p]))

      return (linksList || []).map((link: any) => ({
        story_id: link.story_id,
        property_id: link.property_id,
        created_at: link.created_at,
        story: storiesById[link.story_id] || null,
        property: propertiesById[link.property_id] || null
      }))
    },
    enabled: !!familyId
  })
}
