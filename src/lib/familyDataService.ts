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
  relationship_type: 'parent' | 'spouse' | 'divorced'
  created_at: string
  created_by: string | null
}

export class FamilyDataService {
  // People CRUD operations
  static async getPeople(familyId: string): Promise<PersonData[]> {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('family_id', familyId)
      .order('given_name')
    
    if (error) throw error
    return data || []
  }

  static async updatePerson(id: string, updates: Partial<PersonData>): Promise<void> {
    const { error } = await supabase
      .from('people')
      .update(updates)
      .eq('id', id)
    
    if (error) throw error
  }

  static async deletePerson(id: string): Promise<void> {
    // First delete all relationships involving this person
    await supabase
      .from('relationships')
      .delete()
      .or(`from_person_id.eq.${id},to_person_id.eq.${id}`)
    
    // Then delete the person
    const { error } = await supabase
      .from('people')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async createPerson(person: Omit<PersonData, 'id' | 'created_at' | 'updated_at'>): Promise<PersonData> {
    const { data, error } = await supabase
      .from('people')
      .insert({
        ...person,
        full_name: `${person.given_name} ${person.surname || ''}`.trim()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Relationships CRUD operations
  static async getRelationships(familyId: string): Promise<RelationshipData[]> {
    const { data, error } = await supabase
      .from('relationships')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at')
    
    if (error) throw error
    return data || []
  }

  static async updateRelationship(id: string, updates: Partial<RelationshipData>): Promise<void> {
    const { error } = await supabase
      .from('relationships')
      .update(updates)
      .eq('id', id)
    
    if (error) throw error
  }

  static async deleteRelationship(id: string): Promise<void> {
    const { error } = await supabase
      .from('relationships')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }

  static async createRelationship(relationship: Omit<RelationshipData, 'id' | 'created_at'>): Promise<RelationshipData> {
    const { data, error } = await supabase
      .from('relationships')
      .insert(relationship)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Get people with relationship counts for better UX
  static async getPeopleWithRelationships(familyId: string) {
    const { data, error } = await supabase
      .from('people')
      .select(`
        *,
        parent_relationships:relationships!relationships_from_person_id_fkey(id),
        child_relationships:relationships!relationships_to_person_id_fkey(id)
      `)
      .eq('family_id', familyId)
      .order('given_name')
    
    if (error) throw error
    return data || []
  }
}