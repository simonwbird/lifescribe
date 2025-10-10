import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface PersonRelationship {
  id: string
  person_id: string
  person_name: string
  person_avatar?: string
  person_status: 'living' | 'passed'
  relation_type: string
  relation_label: string
  has_page_access: boolean
  start_date?: string
  end_date?: string
}

const RELATION_LABELS: Record<string, string> = {
  spouse: 'Spouse',
  divorced: 'Former Spouse',
  unmarried: 'Partner',
  parent: 'Parent',
  child: 'Child',
  sibling: 'Sibling',
  brother: 'Brother',
  sister: 'Sister',
  grandmother: 'Grandmother',
  grandfather: 'Grandfather',
  grandchild: 'Grandchild'
}

export function usePersonRelationships(personId: string, currentUserId: string | null) {
  const [relationships, setRelationships] = useState<PersonRelationship[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!personId) return

    const fetchRelationships = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch relationships where person is either from or to
        const { data: relData, error: relError } = await supabase
          .from('relationships')
          .select(`
            id,
            from_person_id,
            to_person_id,
            relationship_type,
            from_person:people!relationships_from_person_id_fkey(
              id,
              full_name,
              avatar_url,
              death_date,
              is_living
            ),
            to_person:people!relationships_to_person_id_fkey(
              id,
              full_name,
              avatar_url,
              death_date,
              is_living
            )
          `)
          .or(`from_person_id.eq.${personId},to_person_id.eq.${personId}`)
          .in('relationship_type', ['spouse', 'parent', 'child', 'sibling', 'brother', 'sister', 'divorced', 'unmarried'])

        if (relError) throw relError

        // Transform to PersonRelationship format
        const transformed: PersonRelationship[] = []
        
        for (const rel of relData || []) {
          // Determine which person is the related one
          const isFromPerson = rel.from_person_id === personId
          const relatedPerson = isFromPerson ? rel.to_person : rel.from_person
          
          if (!relatedPerson) continue

          // Adjust relation type based on perspective
          let relationType = rel.relationship_type
          if (relationType === 'parent' && isFromPerson) {
            relationType = 'child' // If I'm the parent, they're my child
          } else if (relationType === 'child' && !isFromPerson) {
            relationType = 'parent' // If they list me as child, I'm their parent
          }

          // Check access permissions - default to true for family members
          let hasAccess = true // Default to accessible within family
          if (currentUserId) {
            // Check if there are specific permissions set
            const { data: permData } = await supabase
              .from('person_page_permissions')
              .select('role')
              .eq('person_id', relatedPerson.id)
              .eq('user_id', currentUserId)
              .maybeSingle()

            // If permissions exist, user has explicit access
            // If no permissions exist, user has default family access
            hasAccess = true
          }

          transformed.push({
            id: rel.id,
            person_id: relatedPerson.id,
            person_name: relatedPerson.full_name,
            person_avatar: relatedPerson.avatar_url,
            person_status: relatedPerson.death_date || relatedPerson.is_living === false ? 'passed' : 'living',
            relation_type: relationType,
            relation_label: RELATION_LABELS[relationType] || relationType,
            has_page_access: hasAccess
          })
        }

        // Group and sort
        const sorted = transformed.sort((a, b) => {
          // Priority order: spouse/unmarried, parents, children, siblings
          const priority: Record<string, number> = {
            spouse: 1,
            unmarried: 1,
            divorced: 2,
            parent: 3,
            child: 4,
            sibling: 5,
            brother: 5,
            sister: 5
          }
          const aPriority = priority[a.relation_type] || 10
          const bPriority = priority[b.relation_type] || 10
          
          if (aPriority !== bPriority) return aPriority - bPriority
          return a.person_name.localeCompare(b.person_name)
        })

        setRelationships(sorted)
      } catch (err) {
        console.error('Error fetching relationships:', err)
        setError(err instanceof Error ? err.message : 'Failed to load relationships')
      } finally {
        setLoading(false)
      }
    }

    fetchRelationships()
  }, [personId, currentUserId])

  return { relationships, loading, error }
}