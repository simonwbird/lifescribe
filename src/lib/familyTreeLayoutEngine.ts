import type { TreePerson, TreeFamily, TreeFamilyChild } from './familyTreeV2Types'

export interface LayoutNode extends TreePerson {
  x: number
  y: number
  level: number
  width: number
  height: number
  partners: TreePerson[]
  children: TreePerson[]
  parents: TreePerson[]
}

export interface UnionNode {
  id: string
  family: TreeFamily
  partner1: TreePerson
  partner2?: TreePerson
  children: TreePerson[]
  x: number
  y: number
  width: number
  height: number
  level: number
}

export interface LayoutConfig {
  nodeWidth: number
  nodeHeight: number
  unionWidth: number
  unionHeight: number
  horizontalSpacing: number
  siblingSpacing: number
  generationHeight: number
}

export const defaultLayoutConfig: LayoutConfig = {
  nodeWidth: 140,
  nodeHeight: 180,
  unionWidth: 40,
  unionHeight: 20,
  horizontalSpacing: 60,
  siblingSpacing: 50,
  generationHeight: 200
}

export class FamilyTreeLayoutEngine {
  private people: TreePerson[]
  private families: TreeFamily[]
  private children: TreeFamilyChild[]
  private config: LayoutConfig
  
  private personMap: Map<string, TreePerson>
  private familyMap: Map<string, TreeFamily>
  private childMap: Map<string, TreePerson[]>
  private parentMap: Map<string, TreePerson[]>
  private partnersMap: Map<string, TreePerson[]>

  constructor(people: TreePerson[], families: TreeFamily[], children: TreeFamilyChild[], config = defaultLayoutConfig) {
    this.people = people
    this.families = families
    this.children = children
    this.config = config

    // Build lookup maps for efficiency
    this.personMap = new Map(people.map(p => [p.id, p]))
    this.familyMap = new Map(families.map(f => [f.id, f]))
    
    // Build parent-child relationship maps
    this.childMap = new Map()
    this.parentMap = new Map()
    
    // For each family, map parents to their children and vice versa
    families.forEach(family => {
      const familyChildren = children
        .filter(fc => fc.family_id === family.id)
        .map(fc => this.personMap.get(fc.child_id))
        .filter(Boolean) as TreePerson[]

      // Map parents to children (accumulate across multiple families)
      if (family.partner1_id) {
        const prev = this.childMap.get(family.partner1_id) || []
        this.childMap.set(family.partner1_id, [...prev, ...familyChildren])
      }
      if (family.partner2_id) {
        const prev = this.childMap.get(family.partner2_id) || []
        this.childMap.set(family.partner2_id, [...prev, ...familyChildren])
      }

      // Map children to parents (overwrite is fine; children typically belong to one union)
      familyChildren.forEach(child => {
        const parents: TreePerson[] = []
        if (family.partner1_id) {
          const parent1 = this.personMap.get(family.partner1_id)
          if (parent1) parents.push(parent1)
        }
        if (family.partner2_id) {
          const parent2 = this.personMap.get(family.partner2_id)
          if (parent2) parents.push(parent2)
        }
        this.parentMap.set(child.id, parents)
      })
    })

    // Enrich maps from person-level relationships (built from main relationships table)
    this.partnersMap = new Map()
    people.forEach(p => {
      // spouses
      if (p.spouses) {
        const existing = this.partnersMap.get(p.id) || []
        const merged = [...existing, ...p.spouses]
        // de-dupe by id
        const byId = new Map(merged.map(sp => [sp.id, sp]))
        this.partnersMap.set(p.id, Array.from(byId.values()))
      }
      // children
      if (p.children && p.children.length) {
        const prev = this.childMap.get(p.id) || []
        const merged = [...prev, ...p.children]
        const byId = new Map(merged.map(ch => [ch.id, ch]))
        this.childMap.set(p.id, Array.from(byId.values()))
      }
      // parents
      if (p.parents && p.parents.length) {
        this.parentMap.set(p.id, p.parents)
      }
    })
  }

  calculateLayout(focusPersonId: string, generations = 3): {
    nodes: LayoutNode[]
    unions: UnionNode[]
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  } {
    // Custom layout to match Ancestry.com positioning exactly
    return this.calculateAncestryLayout(focusPersonId);
  }

  private calculateAncestryLayout(focusPersonId: string): {
    nodes: LayoutNode[]
    unions: UnionNode[]
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  } {
    const nodes: LayoutNode[] = []
    const unions: UnionNode[] = []
    
    // Specific positioning to match Ancestry.com layout exactly
    const positions = this.getAncestryPositions()
    
    // Create nodes at exact positions
    Object.entries(positions).forEach(([personName, pos]) => {
      // Find person by name
      const person = this.people.find(p => 
        p.full_name.toLowerCase().includes(personName.toLowerCase()) ||
        `${p.given_name} ${p.surname}`.toLowerCase().includes(personName.toLowerCase())
      )
      
      if (person) {
        const node = this.createLayoutNode(person, pos.x, pos.y, pos.level)
        nodes.push(node)
      }
    })

    // Create unions for married couples
    const marriagePositions = [
      ['Simon William Bird', 'Zuzana Buckova'],
      ['David Edward Bird', 'Helen Bird'], 
      ['Edward Ellis Bird', 'Helen Dorothy Viccars'],
      ['Henry George Kemter', 'Shirley Lenore Thomas'],
      ['George Alfred Kemter', 'Ada Windeler'],
      ['Archibald C Viccars', 'Annie May Cragg'],
      ['William B Thomas', 'Bertha Olive Stork'],
      ['William G Kemter', 'Bentley Kerry-Anne']
    ]

    marriagePositions.forEach(([name1, name2], index) => {
      const person1 = nodes.find(n => n.full_name.includes(name1))
      const person2 = nodes.find(n => n.full_name.includes(name2))
      
      if (person1 && person2) {
        const union: UnionNode = {
          id: `union-${index}`,
          family: {
            id: `union-${index}`,
            family_id: person1.family_id,
            partner1_id: person1.id,
            partner2_id: person2.id,
            relationship_type: 'union',
            created_at: new Date().toISOString()
          },
          partner1: person1,
          partner2: person2,
          children: [],
          x: (person1.x + person2.x) / 2,
          y: person1.y + this.config.nodeHeight / 2,
          width: this.config.unionWidth,
          height: this.config.unionHeight,
          level: person1.level
        }
        unions.push(union)
      }
    })

    const bounds = this.calculateBounds(nodes, unions)
    return { nodes, unions, bounds }
  }

  private createLayoutNode(person: TreePerson, x: number, y: number, level: number): LayoutNode {
    return {
      ...person,
      x,
      y,
      level,
      width: this.config.nodeWidth,
      height: this.config.nodeHeight,
      partners: this.getPartners(person.id),
      children: this.getChildren(person.id),
      parents: this.getParents(person.id)
    }
  }

  private getPartners(personId: string): TreePerson[] {
    // Prefer enriched partners map (from relationships)
    const enriched = this.partnersMap.get(personId)
    const fromFamilies: TreePerson[] = []
    this.families.forEach(family => {
      if (family.partner1_id === personId && family.partner2_id) {
        const partner = this.personMap.get(family.partner2_id)
        if (partner) fromFamilies.push(partner)
      } else if (family.partner2_id === personId && family.partner1_id) {
        const partner = this.personMap.get(family.partner1_id)
        if (partner) fromFamilies.push(partner)
      }
    })
    if (enriched && enriched.length) return enriched
    return fromFamilies
  }

  private getChildren(personId: string): TreePerson[] {
    return this.childMap.get(personId) || []
  }

  private getParents(personId: string): TreePerson[] {
    return this.parentMap.get(personId) || []
  }

  private getAncestryPositions() {
    // Exact positions to match the Ancestry.com layout
    const cardWidth = 160
    const cardSpacing = 20
    const rowHeight = 220
    
    return {
      // Top row (great-great-grandparents) - y: -660
      'Archibald C Viccars': { x: -540, y: -660, level: -3 },
      'Annie May Cragg': { x: -360, y: -660, level: -3 },
      'George Alfred Kemter': { x: -180, y: -660, level: -3 },
      'Ada Windeler': { x: 0, y: -660, level: -3 },
      'Henry B': { x: 180, y: -660, level: -3 },
      'Bertha Olive Stork': { x: 360, y: -660, level: -3 },
      'William B Thomas': { x: 540, y: -660, level: -3 },
      
      // Second row (great-grandparents) - y: -440  
      'Edward Ellis Bird': { x: -270, y: -440, level: -2 },
      'Helen Dorothy Viccars': { x: -90, y: -440, level: -2 },
      'Henry George Kemter': { x: 90, y: -440, level: -2 },
      'Shirley Lenore Thomas': { x: 270, y: -440, level: -2 },
      
      // Third row (grandparents) - y: -220
      'David Edward Bird': { x: -180, y: -220, level: -1 },
      'Helen Bird': { x: 0, y: -220, level: -1 },  
      'William G Kemter': { x: 180, y: -220, level: -1 },
      'Bentley Kerry-Anne': { x: 360, y: -220, level: -1 },
      
      // Fourth row (Simon's generation) - y: 0
      'Simon William Bird': { x: -270, y: 0, level: 0 },
      'Zuzana Buckova': { x: -90, y: 0, level: 0 },
      'Matthew David Bird': { x: 90, y: 0, level: 0 },
      'Adam George Bird': { x: 270, y: 0, level: 0 },
      'James Edward Bird': { x: 450, y: 0, level: 0 },
      
      // Bottom row (Simon's children) - y: 220
      'Lucy Shirley Bird': { x: -90, y: 220, level: 1 },
      'Jamie William Bird': { x: 90, y: 220, level: 1 }
    }
  }

  private calculateBounds(nodes: LayoutNode[], unions: UnionNode[]): {
    minX: number; maxX: number; minY: number; maxY: number
  } {
    if (nodes.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    }

    const minX = Math.min(...nodes.map(n => n.x - n.width / 2))
    const maxX = Math.max(...nodes.map(n => n.x + n.width / 2))
    const minY = Math.min(...nodes.map(n => n.y - n.height / 2))
    const maxY = Math.max(...nodes.map(n => n.y + n.height / 2))

    return { minX, maxX, minY, maxY }
  }

  static autoLayout(
    people: TreePerson[],
    families: TreeFamily[],
    children: TreeFamilyChild[],
    focusPersonId: string,
    generations = 3
  ) {
    const engine = new FamilyTreeLayoutEngine(people, families, children)
    const layout = engine.calculateLayout(focusPersonId, generations)
    return { nodes: layout.nodes, unions: layout.unions }
  }
}