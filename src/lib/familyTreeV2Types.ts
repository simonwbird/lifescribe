// Shared types for Family Explorer (Ancestry style)

export type Sex = "M" | "F" | "X" | undefined;

export type Person = {
  id: string;
  given_name: string;
  surname?: string;
  birth_date?: string | number | null;
  death_date?: string | number | null;
  sex?: Sex;
  avatar_url?: string | null;
};

export type Relationship =
  | { type: "parent"; parent_id: string; child_id: string }
  | { type: "spouse"; a: string; b: string }
  | { type: "divorced"; a: string; b: string };

export type NodeRect = { id: string; x: number; y: number; w: number; h: number; depth: number };

export type Union = {
  id: string;
  a: string;
  b: string;
  children: string[];
  depth: number;
  y: number;
};

export type FamilyGraph = {
  peopleById: Map<string, Person>;
  childrenOf: Map<string, string[]>;
  parentsOf: Map<string, string[]>;
  spouses: Map<string, Set<string>>;
  divorced: Map<string, Set<string>>;
  unions: Union[];
};

export type TreeLayout = {
  rects: Map<string, NodeRect>;
  unions: Union[];
  rows: Map<number, number>;
  bounds: { width: number; height: number };
};

// Legacy types for backward compatibility
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
  source_xref?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
  full_name?: string
  birth_year?: number
  death_year?: number
  gender?: 'male' | 'female' | 'other' | 'unknown'
  avatar_url?: string
  middle_name?: string
  spouses?: TreePerson[]
  children?: TreePerson[]
  parents?: TreePerson[]
}

export interface TreeFamily {
  id: string
  family_id: string
  partner1_id?: string | null
  partner2_id?: string | null
  relationship_type: string
  start_date?: string | null
  end_date?: string | null
  source_xref?: string | null
  created_by?: string | null
  created_at: string
}

export interface TreeFamilyChild {
  family_id: string
  child_id: string
  relationship_note?: string
  created_at: string
}

export interface TreeGraph {
  focusPersonId: string
  people: TreePerson[]
  families: TreeFamily[]
  children: TreeFamilyChild[]
  relationships?: any[]
  components?: TreePerson[][]
  meta?: {
    source: string
    count_people: number
    count_rels: number
  }
}

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
  fams?: string
  famc?: string
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

export interface TreePreference {
  user_id: string
  family_id: string
  root_person_id?: string | null
  updated_at: string
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