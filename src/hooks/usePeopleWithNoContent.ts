import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PersonWithoutContent {
  id: string;
  full_name: string;
  given_name: string;
  surname: string | null;
}

export function usePeopleWithNoContent(familyId: string | null) {
  return useQuery({
    queryKey: ['people-without-content', familyId],
    queryFn: async (): Promise<PersonWithoutContent[]> => {
      if (!familyId) return [];

      // Get all people in the family
      const { data: people, error: peopleError } = await supabase
        .from('people')
        .select('id, full_name, given_name, surname')
        .eq('family_id', familyId)
        .order('given_name');

      if (peopleError) throw peopleError;
      if (!people || people.length === 0) return [];

      // Get all entity links for stories and media
      const { data: links, error: linksError } = await supabase
        .from('entity_links')
        .select('entity_id')
        .eq('family_id', familyId)
        .in('entity_type', ['person']);

      if (linksError) throw linksError;

      // Create a set of person IDs that have content
      const peopleWithContent = new Set(
        (links || []).map(link => link.entity_id)
      );

      // Filter to people without any content
      const peopleWithoutContent = people.filter(
        person => !peopleWithContent.has(person.id)
      );

      return peopleWithoutContent;
    },
    enabled: !!familyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
