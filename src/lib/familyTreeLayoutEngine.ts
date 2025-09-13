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
  nodeWidth: 156,
  nodeHeight: 208,
  unionWidth: 40,
  unionHeight: 20,
  horizontalSpacing: 80,
  siblingSpacing: 60,
  generationHeight: 240
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
    const focusPerson = this.personMap.get(focusPersonId)
    if (!focusPerson) throw new Error('Focus person not found')

    const nodes: LayoutNode[] = []
    const unions: UnionNode[] = []
    const processedPeople = new Set<string>()
    const processedFamilies = new Set<string>()

    // Build generational structure - ancestors up, descendants down
    const generationMap = new Map<number, TreePerson[]>()
    
    // Add person to specific generation
    const addToGeneration = (person: TreePerson, level: number) => {
      if (processedPeople.has(person.id)) return
      processedPeople.add(person.id)
      
      if (!generationMap.has(level)) {
        generationMap.set(level, [])
      }
      generationMap.get(level)!.push(person)
    }

    // Recursively build family tree structure
    const buildGenerations = (personId: string, currentLevel: number, maxDepth: number) => {
      if (Math.abs(currentLevel) > maxDepth) return
      
      const person = this.personMap.get(personId)
      if (!person || processedPeople.has(person.id)) return

      addToGeneration(person, currentLevel)

      // Add parents (go up)
      if (currentLevel >= -maxDepth) {
        const parents = this.getParents(personId)
        parents.forEach(parent => {
          buildGenerations(parent.id, currentLevel - 1, maxDepth)
        })
      }

      // Add children (go down)  
      if (currentLevel <= maxDepth) {
        const children = this.getChildren(personId)
        children.forEach(child => {
          buildGenerations(child.id, currentLevel + 1, maxDepth)
        })
      }

      // Add spouses at same level
      const partners = this.getPartners(personId)
      partners.forEach(partner => {
        if (!processedPeople.has(partner.id)) {
          addToGeneration(partner, currentLevel)
        }
      })
    }

    // Start from focus person at level 0
    buildGenerations(focusPersonId, 0, generations)

    // Create layout nodes with proper positioning
    const sortedLevels = Array.from(generationMap.keys()).sort((a, b) => a - b)
    
    sortedLevels.forEach(level => {
      const peopleInLevel = generationMap.get(level) || []
      const levelWidth = peopleInLevel.length * this.config.nodeWidth + 
                        (peopleInLevel.length - 1) * this.config.siblingSpacing
      let startX = -levelWidth / 2

      peopleInLevel.forEach((person, index) => {
        const x = startX + index * (this.config.nodeWidth + this.config.siblingSpacing)
        const y = level * this.config.generationHeight
        
        const node = this.createLayoutNode(person, x, y, level)
        nodes.push(node)
      })
    })

    // Create unions from parent relationships and spouse links (works even without tree_families)
    type U = { p1: TreePerson; p2?: TreePerson; children: Set<string> }
    const unionMap = new Map<string, U>()

    // From parent relationships
    this.parentMap.forEach((parents, childId) => {
      if (!parents || parents.length === 0) return
      if (parents.length === 2) {
        const [a, b] = parents
        const key = [a.id, b.id].sort().join('-')
        if (!unionMap.has(key)) unionMap.set(key, { p1: a, p2: b, children: new Set() })
        unionMap.get(key)!.children.add(childId)
      } else if (parents.length === 1) {
        const a = parents[0]
        const key = `single-${a.id}`
        if (!unionMap.has(key)) unionMap.set(key, { p1: a, children: new Set() })
        unionMap.get(key)!.children.add(childId)
      }
    })

    // From spouse links (ensure marriage bar even if no child in view)
    this.partnersMap.forEach((partners, pid) => {
      partners.forEach(sp => {
        const key = [pid, sp.id].sort().join('-')
        if (!unionMap.has(key)) unionMap.set(key, { p1: this.personMap.get(pid)!, p2: sp, children: new Set() })
      })
    })

    unionMap.forEach((u, key) => {
      const partner1 = nodes.find(n => n.id === u.p1.id)
      const partner2 = u.p2 ? nodes.find(n => n.id === u.p2.id) : undefined
      if (!partner1 && !partner2) return

      const childNodes: LayoutNode[] = Array.from(u.children)
        .map(cid => nodes.find(n => n.id === cid))
        .filter(Boolean) as LayoutNode[]

      const family: TreeFamily = {
        id: `u-${key}`,
        family_id: u.p1.family_id,
        partner1_id: u.p1.id,
        partner2_id: u.p2?.id ?? null,
        relationship_type: 'union',
        created_at: new Date().toISOString()
      }

      const baseNode = partner1 || partner2!
      const union: UnionNode = {
        id: family.id,
        family,
        partner1: u.p1,
        partner2: u.p2,
        children: childNodes,
        x: partner1 && partner2 ? (partner1.x + partner2.x) / 2 : baseNode.x,
        y: baseNode.y + this.config.nodeHeight / 2,
        width: this.config.unionWidth,
        height: this.config.unionHeight,
        level: baseNode.level
      }
      unions.push(union)
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