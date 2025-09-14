export interface Person {
  id: string
  family_id: string
  full_name: string
  given_name?: string
  middle_name?: string
  surname?: string
  birth_date?: string
  death_date?: string
  birth_year?: number
  death_year?: number
  gender?: 'male' | 'female' | 'other' | 'unknown'
  avatar_url?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface Relationship {
  id: string
  family_id: string
  from_person_id: string
  to_person_id: string
  relationship_type: 'parent' | 'spouse' | 'divorced' | 'unmarried'
  created_at: string
  created_by?: string
}

export interface PersonUserLink {
  id: string
  person_id: string
  user_id: string
  family_id: string
  created_at: string
}

export interface TreePreference {
  user_id: string
  family_id: string
  root_person_id?: string
  updated_at: string
}

export interface TreeNode {
  id: string
  person: Person
  children: TreeNode[]
  spouses: Person[]
  x?: number
  y?: number
  level?: number
}

export interface TreeGraph {
  nodes: TreeNode[]
  relationships: Relationship[]
  people: Person[]
  rootId?: string
}