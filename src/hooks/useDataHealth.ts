import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDataHealth(familyId: string) {
  return useQuery({
    queryKey: ['data-health', familyId],
    queryFn: async () => {
      const [
        uncitedStories,
        duplicates,
        orphanMedia,
        failedImports,
      ] = await Promise.all([
        // Uncited stories
        supabase
          .from('stories')
          .select('id', { count: 'exact', head: true })
          .eq('family_id', familyId)
          .not('id', 'in', `(SELECT story_id FROM story_sources WHERE family_id = '${familyId}')`),
        
        // Duplicate candidates
        supabase
          .from('duplicate_candidates')
          .select('id', { count: 'exact', head: true })
          .eq('family_id', familyId)
          .eq('status', 'pending'),
        
        // Orphan media (no person, date, or place)
        supabase
          .from('media')
          .select('id', { count: 'exact', head: true })
          .eq('family_id', familyId)
          .is('person_id', null)
          .is('occurred_at', null)
          .is('place_id', null),
        
        // Failed imports (if we have an imports table)
        supabase
          .from('error_logs')
          .select('id', { count: 'exact', head: true })
          .eq('family_id', familyId)
          .like('route', '%import%'),
      ]);

      return {
        uncitedStories: uncitedStories.count || 0,
        duplicates: duplicates.count || 0,
        orphanMedia: orphanMedia.count || 0,
        failedImports: failedImports.count || 0,
        untaggedFaces: 0, // Placeholder for future face detection
      };
    },
    enabled: !!familyId,
  });
}
