// New Family Tree Types - Union/Family Node Pattern

export interface TreePerson {
  id: string
  family_id: string
  given_name?: string | null
  surname?: string | null
  sex?: string | null
  birth_date?: string | null
  death_date?: string | null
  is_living: boolean | null
  birth_place?: string | null
  death_place?: string | null
  profile_photo_url?: string | null
  notes?: string | null
  source_xref?: string | null // for GED imports like @I1@
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface TreeFamily {
  id: string
  family_id: string
  partner1_id?: string | null
  partner2_id?: string | null
  relationship_type: string
  start_date?: string | null
  end_date?: string | null
  source_xref?: string | null // for GED imports like @F1@
  created_by?: string | null
  created_at: string
}

export interface TreeFamilyChild {
  family_id: string
  child_id: string
  relationship_note?: string // for adoption, step-children, etc.
  created_at: string
}

export interface TreePersonAlias {
  id: string
  person_id: string
  alias: string
  alias_type: string
  created_at: string
}

export interface TreePreference {
  user_id: string
  family_id: string
  root_person_id?: string | null
  updated_at: string
}

export interface TreeImport {
  id: string
  family_id: string
  imported_by: string
  import_type: string
  file_name?: string | null
  file_path?: string | null
  status: string
  people_count: number | null
  families_count: number | null
  errors_log: any
  created_at: string | null
  completed_at?: string | null
}

// Graph structures for visualization
export interface TreeGraph {
  focusPersonId: string
  people: TreePerson[]
  families: TreeFamily[]
  children: TreeFamilyChild[]
}

export interface TreeNode extends TreePerson {
  partners: TreePerson[]
  unions: TreeUnion[]
  children: TreePerson[]
  parents: TreePerson[]
  x?: number
  y?: number
  level?: number
}

export interface TreeUnion {
  id: string
  family: TreeFamily
  partner1: TreePerson
  partner2?: TreePerson
  children: TreePerson[]
  x?: number
  y?: number
}

// Import types
export interface GedcomPerson {
  person_id: string
  given_name?: string
  surname?: string
  sex?: 'M' | 'F' | 'X'
  birth_date?: string
  birth_place?: string
  death_date?: string
  death_place?: string
  is_living: 'Y' | 'N'
  fams?: string // family as spouse
  famc?: string // family as child
  raw_name: string
}

export interface GedcomRelationship {
  rel_type: 'spouse' | 'parent'
  a_id: string
  b_id: string
  family_id: string
  marriage_date?: string
  divorce_date?: string
  note?: string
}

export interface ImportPreview {
  people: GedcomPerson[]
  relationships: GedcomRelationship[]
  peopleCount: number
  familiesCount: number
  childrenCount: number
  duplicates: PersonMatch[]
}

export interface PersonMatch {
  incoming: GedcomPerson
  existing: TreePerson
  confidence: number
  matchReasons: string[]
}

// Layout types
export interface LayoutConfig {
  nodeWidth: number
  nodeHeight: number
  horizontalSpacing: number
  verticalSpacing: number
  unionSpacing: number
  generationHeight: number
}

// UI state types
export interface TreeViewState {
  view: 'explorer' | 'fan'
  focusPersonId?: string
  homePersonId?: string
  showParents: boolean
  showSpouses: boolean
  showChildren: boolean
  generationDepth: number
  highlightBranch?: string
  autoLayout: boolean
  zoom: number
  pan: { x: number; y: number }
}

export interface QuickAddForm {
  given_name: string
  surname: string
  sex: 'M' | 'F' | 'X'
  birth_date?: string
  is_living: boolean
  relationship_type: 'parent' | 'partner' | 'child'
  target_person_id: string
}