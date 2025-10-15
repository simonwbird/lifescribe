import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export function usePropertyStories(familyId: string | null, limit = 5) {
  return useQuery({
    queryKey: ['property-stories', familyId, limit],
    queryFn: async () => {
      if (!familyId) return []
      
      const { data: links, error } = await supabase
        .from('story_property_links' as any)
        .select(`
          story_id,
          property_id,
          created_at,
          stories:story_id (
            id,
            title,
            content,
            created_at,
            profile_id,
            occurred_on
          ),
          properties:property_id (
            id,
            display_title,
            name,
            title
          )
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching property stories:', error)
        return []
      }
      
      // Map to expected format
      return (links || []).map((link: any) => ({
        story_id: link.story_id,
        property_id: link.property_id,
        created_at: link.created_at,
        story: link.stories,
        property: link.properties
      }))
    },
    enabled: !!familyId
  })
}
