import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'

export interface PersonData {
  id: string
  given_name: string
  surname: string | null
  full_name: string
  gender: string | null
  birth_date: string | null
  death_date: string | null
  avatar_url: string | null
  notes: string | null
  family_id: string
  created_at: string
  updated_at: string
}

export interface RelationshipData {
  id: string
  family_id: string
  from_person_id: string
  to_person_id: string
  relationship_type: string
  created_at: string
  created_by: string | null
}

// Optimized hook for family people with proper caching
export function useFamilyPeople(familyId: string) {
  return useQuery({
    queryKey: ['family-people', familyId],
    queryFn: async (): Promise<PersonData[]> => {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('family_id', familyId)
        .order('given_name')
      
      if (error) throw error
      return data || []
    },
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Optimized hook for family relationships with proper caching
export function useFamilyRelationships(familyId: string) {
  return useQuery({
    queryKey: ['family-relationships', familyId],
    queryFn: async (): Promise<RelationshipData[]> => {
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at')
      
      if (error) throw error
      return data || []
    },
    enabled: !!familyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Combined hook for both people and relationships
export function useFamilyData(familyId: string) {
  const peopleQuery = useFamilyPeople(familyId)
  const relationshipsQuery = useFamilyRelationships(familyId)
  
  return {
    people: peopleQuery.data || [],
    relationships: relationshipsQuery.data || [],
    isLoading: peopleQuery.isLoading || relationshipsQuery.isLoading,
    error: peopleQuery.error || relationshipsQuery.error,
    refetch: () => {
      peopleQuery.refetch()
      relationshipsQuery.refetch()
    }
  }
}