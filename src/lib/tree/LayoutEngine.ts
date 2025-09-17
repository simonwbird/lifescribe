import type { Person, Relationship } from '@/lib/familyTreeTypes'

export interface LayoutNode {
  personId: string
  x: number
  y: number
  depth: number
}

export interface LayoutOptions {
  hGap: number  // horizontal gap between cards
  vGap: number  // vertical gap between generations
  cardWidth: number
  cardHeight: number
}

export interface TreeLayout {
  nodes: LayoutNode[]
  bounds: { width: number; height: number }
  generations: number
}

export class LayoutEngine {
  private people: Person[]
  private relationships: Relationship[]
  private options: LayoutOptions
  
  private spouseMap = new Map<string, string[]>()
  private childrenMap = new Map<string, string[]>()
  private parentsMap = new Map<string, string[]>()
  
  constructor(
    people: Person[], 
    relationships: Relationship[], 
    options: Partial<LayoutOptions> = {}
  ) {
    this.people = people
    this.relationships = relationships
    this.options = {
      hGap: 100,
      vGap: 140,
      cardWidth: 150,
      cardHeight: 180,
      ...options
    }
    
    this.buildRelationshipMaps()
  }
  
  private buildRelationshipMaps() {
    this.relationships.forEach(rel => {
      if (rel.relationship_type === 'spouse') {
        if (!this.spouseMap.has(rel.from_person_id)) this.spouseMap.set(rel.from_person_id, [])
        if (!this.spouseMap.has(rel.to_person_id)) this.spouseMap.set(rel.to_person_id, [])
        this.spouseMap.get(rel.from_person_id)!.push(rel.to_person_id)
        this.spouseMap.get(rel.to_person_id)!.push(rel.from_person_id)
      } else if (rel.relationship_type === 'parent') {
        if (!this.childrenMap.has(rel.from_person_id)) this.childrenMap.set(rel.from_person_id, [])
        if (!this.parentsMap.has(rel.to_person_id)) this.parentsMap.set(rel.to_person_id, [])
        this.childrenMap.get(rel.from_person_id)!.push(rel.to_person_id)
        this.parentsMap.get(rel.to_person_id)!.push(rel.from_person_id)
      }
    })
  }
  
  public generateLayout(rootPersonId?: string): TreeLayout {
    // Find root people (those with no parents)
    const rootPeople = this.people.filter(person => !this.parentsMap.has(person.id))
    if (rootPeople.length === 0 && this.people.length > 0) {
      rootPeople.push(rootPersonId ? this.people.find(p => p.id === rootPersonId) || this.people[0] : this.people[0])
    }
    
    // Assign generations using BFS
    const generations = new Map<number, Person[]>()
    const personDepth = new Map<string, number>()
    const visited = new Set<string>()
    
    const assignGeneration = (person: Person, depth: number) => {
      if (visited.has(person.id)) return
      visited.add(person.id)
      
      personDepth.set(person.id, depth)
      if (!generations.has(depth)) generations.set(depth, [])
      generations.get(depth)!.push(person)
      
      // Add spouses to same generation
      const spouses = this.spouseMap.get(person.id) || []
      spouses.forEach(spouseId => {
        const spouse = this.people.find(p => p.id === spouseId)
        if (spouse && !visited.has(spouse.id)) {
          assignGeneration(spouse, depth)
        }
      })
      
      // Add children to next generation
      const children = this.childrenMap.get(person.id) || []
      children.forEach(childId => {
        const child = this.people.find(p => p.id === childId)
        if (child && !visited.has(child.id)) {
          assignGeneration(child, depth + 1)
        }
      })
    }
    
    // Start from root people
    rootPeople.forEach(person => assignGeneration(person, 0))
    
    // Layout each generation
    const nodes: LayoutNode[] = []
    const generationEntries = Array.from(generations.entries()).sort(([a], [b]) => a - b)
    
    generationEntries.forEach(([depth, genPeople]) => {
      // Group spouses together
      const groups = this.groupSpouses(genPeople)
      const y = depth * this.options.vGap + this.options.cardHeight / 2
      
      let currentX = 0
      
      groups.forEach(group => {
        if (group.length === 1) {
          // Single person
          nodes.push({
            personId: group[0].id,
            x: currentX,
            y,
            depth
          })
          currentX += this.options.cardWidth + this.options.hGap
        } else {
          // Spouse pair - place them close together
          const spouseGap = 30 // Closer gap for spouses
          group.forEach((person, index) => {
            nodes.push({
              personId: person.id,
              x: currentX + index * (this.options.cardWidth + spouseGap),
              y,
              depth
            })
          })
          currentX += group.length * (this.options.cardWidth + spouseGap) + this.options.hGap
        }
      })
    })
    
    // Center the layout
    const minX = Math.min(...nodes.map(n => n.x))
    const maxX = Math.max(...nodes.map(n => n.x))
    const centerOffset = -((minX + maxX) / 2)
    
    nodes.forEach(node => {
      node.x += centerOffset
    })
    
    // Calculate bounds
    const bounds = {
      width: Math.max(...nodes.map(n => n.x)) - Math.min(...nodes.map(n => n.x)) + this.options.cardWidth,
      height: generationEntries.length * this.options.vGap + this.options.cardHeight
    }
    
    return {
      nodes,
      bounds,
      generations: generationEntries.length
    }
  }
  
  private groupSpouses(people: Person[]): Person[][] {
    const visited = new Set<string>()
    const groups: Person[][] = []
    
    people.forEach(person => {
      if (visited.has(person.id)) return
      
      const group = [person]
      visited.add(person.id)
      
      // Find spouses
      const spouses = this.spouseMap.get(person.id) || []
      spouses.forEach(spouseId => {
        const spouse = people.find(p => p.id === spouseId)
        if (spouse && !visited.has(spouse.id)) {
          group.push(spouse)
          visited.add(spouse.id)
        }
      })
      
      groups.push(group)
    })
    
    return groups
  }
  
  public updateLayout(nodes: LayoutNode[], personId: string, x: number, y: number): LayoutNode[] {
    return nodes.map(node => 
      node.personId === personId 
        ? { ...node, x, y }
        : node
    )
  }
}