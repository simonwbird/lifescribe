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

      // Map parents to children
      if (family.partner1_id) {
        this.childMap.set(family.partner1_id, familyChildren)
      }
      if (family.partner2_id) {
        this.childMap.set(family.partner2_id, familyChildren)
      }

      // Map children to parents
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

    // Create family unions and connections
    this.families.forEach(family => {
      if (processedFamilies.has(family.id)) return

      const partner1 = nodes.find(n => n.id === family.partner1_id)
      const partner2 = family.partner2_id ? nodes.find(n => n.id === family.partner2_id) : null
      
      if (!partner1) return

      const familyChildren = this.children
        .filter(fc => fc.family_id === family.id)
        .map(fc => nodes.find(n => n.id === fc.child_id))
        .filter(Boolean) as LayoutNode[]

      if (familyChildren.length > 0 || partner2) {
        const union: UnionNode = {
          id: family.id,
          family,
          partner1: partner1,
          partner2: partner2 || undefined,
          children: familyChildren,
          x: partner2 ? (partner1.x + partner2.x) / 2 : partner1.x,
          y: partner1.y + this.config.nodeHeight / 2,
          width: this.config.unionWidth,
          height: this.config.unionHeight,
          level: partner1.level
        }
        unions.push(union)
        processedFamilies.add(family.id)
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
    const partners: TreePerson[] = []
    this.families.forEach(family => {
      if (family.partner1_id === personId && family.partner2_id) {
        const partner = this.personMap.get(family.partner2_id)
        if (partner) partners.push(partner)
      } else if (family.partner2_id === personId && family.partner1_id) {
        const partner = this.personMap.get(family.partner1_id)
        if (partner) partners.push(partner)
      }
    })
    return partners
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