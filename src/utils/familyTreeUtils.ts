import type { Person, Relationship, TreeNode, TreeGraph } from '@/lib/familyTreeTypes'

export function buildFamilyTree(people: Person[], relationships: Relationship[], rootId?: string): TreeGraph {
  if (!people.length) {
    return { nodes: [], relationships, people, rootId }
  }

  // Find root person
  let root = rootId ? people.find(p => p.id === rootId) : null
  if (!root) {
    // Auto-select root: find person with no parents, or the earliest birth year
    const peopleWithParents = new Set(
      relationships
        .filter(r => r.relationship_type === 'parent')
        .map(r => r.from_person_id)
    )
    
    const rootCandidates = people.filter(p => !peopleWithParents.has(p.id))
    if (rootCandidates.length > 0) {
      root = rootCandidates.sort((a, b) => {
        const aYear = a.birth_year || (a.birth_date ? new Date(a.birth_date).getFullYear() : 9999)
        const bYear = b.birth_year || (b.birth_date ? new Date(b.birth_date).getFullYear() : 9999)
        return aYear - bYear
      })[0]
    } else {
      root = people[0] // Fallback to first person
    }
  }

  if (!root) {
    return { nodes: [], relationships, people, rootId }
  }

  // Build tree recursively
  const visitedNodes = new Set<string>()
  
  function buildNode(personId: string, level = 0): TreeNode | null {
    if (visitedNodes.has(personId)) return null
    
    const person = people.find(p => p.id === personId)
    if (!person) return null
    
    visitedNodes.add(personId)
    
    // Find children (people who have this person as parent)
    const childrenIds = relationships
      .filter(r => r.relationship_type === 'parent' && r.to_person_id === personId)
      .map(r => r.from_person_id)
    
    // Find spouses
    const spouseIds = relationships
      .filter(r => r.relationship_type === 'spouse' && 
        (r.from_person_id === personId || r.to_person_id === personId))
      .map(r => r.from_person_id === personId ? r.to_person_id : r.from_person_id)
    
    const spouses = spouseIds.map(id => people.find(p => p.id === id)).filter(Boolean) as Person[]
    
    const children = childrenIds
      .map(childId => buildNode(childId, level + 1))
      .filter(Boolean) as TreeNode[]
    
    return {
      id: personId,
      person,
      children,
      spouses,
      level
    }
  }

  const rootNode = buildNode(root.id)
  return {
    nodes: rootNode ? [rootNode] : [],
    relationships,
    people,
    rootId: root.id
  }
}

export function isAncestor(relationships: Relationship[], ancestorId: string, descendantId: string): boolean {
  if (ancestorId === descendantId) return true
  
  // Find all parent relationships for the descendant
  const parentIds = relationships
    .filter(r => r.relationship_type === 'parent' && r.from_person_id === descendantId)
    .map(r => r.to_person_id)
  
  // Recursively check if any parent is the ancestor or has the ancestor as their ancestor
  return parentIds.some(parentId => isAncestor(relationships, ancestorId, parentId))
}

export function validateRelationship(
  relationships: Relationship[], 
  fromPersonId: string, 
  toPersonId: string, 
  relationshipType: 'parent' | 'spouse'
): { valid: boolean; error?: string } {
  // No self relationships
  if (fromPersonId === toPersonId) {
    return { valid: false, error: "A person cannot be related to themselves" }
  }
  
  if (relationshipType === 'parent') {
    // Check for cycles - child cannot be ancestor of parent
    if (isAncestor(relationships, fromPersonId, toPersonId)) {
      return { valid: false, error: "This would create a family cycle (ancestor loop)" }
    }
  }
  
  // Check for duplicate relationships
  const existingRelation = relationships.find(r => 
    r.from_person_id === fromPersonId && 
    r.to_person_id === toPersonId && 
    r.relationship_type === relationshipType
  )
  
  if (existingRelation) {
    return { valid: false, error: "This relationship already exists" }
  }
  
  return { valid: true }
}

export function validateAges(
  parentPerson: Person, 
  childPerson: Person
): { valid: boolean; warning?: string } {
  const parentYear = parentPerson.birth_year || 
    (parentPerson.birth_date ? new Date(parentPerson.birth_date).getFullYear() : null)
  const childYear = childPerson.birth_year || 
    (childPerson.birth_date ? new Date(childPerson.birth_date).getFullYear() : null)
  
  if (!parentYear || !childYear) {
    return { valid: true } // Can't validate without years
  }
  
  const ageDifference = childYear - parentYear
  
  if (ageDifference < 10) {
    return { 
      valid: false, 
      warning: `Parent would be ${ageDifference} years old when child was born. This seems unusual.` 
    }
  }
  
  if (ageDifference > 80) {
    return { 
      valid: false, 
      warning: `Parent would be ${ageDifference} years old when child was born. This seems unusual.` 
    }
  }
  
  return { valid: true }
}

export function formatPersonYears(person: Person): string {
  const birthYear = person.birth_year || 
    (person.birth_date ? new Date(person.birth_date).getFullYear() : null)
  const deathYear = person.death_year || 
    (person.death_date ? new Date(person.death_date).getFullYear() : null)
  
  if (!birthYear && !deathYear) return ''
  if (!birthYear) return `?–${deathYear}`
  if (!deathYear) return `${birthYear}–`
  return `${birthYear}–${deathYear}`
}

export function getPersonDisplayName(person: Person): string {
  return person.full_name || `${person.given_name || ''} ${person.surname || ''}`.trim() || 'Unknown'
}