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
  | { type: "spouse"; a: string; b: string };

// Rect for a card on the canvas
export type NodeRect = { id: string; x: number; y: number; w: number; h: number; depth: number };

// A spouse union (marriage/partnership) rendered as a horizontal bar
export type Union = {
  id: string;
  a: string;           // partner A id
  b: string;           // partner B id
  children: string[];  // child ids of this union (can be empty for childless partner)
  depth: number;       // row depth
  y: number;           // computed bar Y (filled by layout)
};

// Graph built from raw rows
export type FamilyGraph = {
  peopleById: Map<string, Person>;
  childrenOf: Map<string, string[]>;
  parentsOf: Map<string, string[]>;
  spouses: Map<string, Set<string>>;
  unions: Union[];
};

// Layout result
export type TreeLayout = {
  rects: Map<string, NodeRect>;
  unions: Union[];
  rows: Map<number, number>; // depth -> rowTopY
  bounds: { width: number; height: number };
};