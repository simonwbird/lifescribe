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
    console.log('🌳 Building relationship maps from relationships:', this.relationships.length)
    
    this.relationships.forEach(rel => {
      const fromPerson = this.people.find(p => p.id === rel.from_person_id)
      const toPerson = this.people.find(p => p.id === rel.to_person_id)
      
      console.log(`🌳 Processing: ${fromPerson?.full_name} --${rel.relationship_type}--> ${toPerson?.full_name}`)
      
      if (rel.relationship_type === 'spouse') {
        if (!this.spouseMap.has(rel.from_person_id)) this.spouseMap.set(rel.from_person_id, [])
        if (!this.spouseMap.has(rel.to_person_id)) this.spouseMap.set(rel.to_person_id, [])
        this.spouseMap.get(rel.from_person_id)!.push(rel.to_person_id)
        this.spouseMap.get(rel.to_person_id)!.push(rel.from_person_id)
        console.log(`🌳   Added spouse relationship: ${fromPerson?.full_name} ↔ ${toPerson?.full_name}`)
      } else if (rel.relationship_type === 'parent') {
        if (!this.childrenMap.has(rel.from_person_id)) this.childrenMap.set(rel.from_person_id, [])
        if (!this.parentsMap.has(rel.to_person_id)) this.parentsMap.set(rel.to_person_id, [])
        this.childrenMap.get(rel.from_person_id)!.push(rel.to_person_id)
        this.parentsMap.get(rel.to_person_id)!.push(rel.from_person_id)
        console.log(`🌳   Added parent-child: ${fromPerson?.full_name} (parent) → ${toPerson?.full_name} (child)`)
      }
    })
    
    console.log('🌳 Final relationship maps:')
    console.log('🌳   Parents Map:', Array.from(this.parentsMap.entries()).map(([childId, parentIds]) => ({
      child: this.people.find(p => p.id === childId)?.full_name,
      parents: parentIds.map(id => this.people.find(p => p.id === id)?.full_name)
    })))
    console.log('🌳   Children Map:', Array.from(this.childrenMap.entries()).map(([parentId, childIds]) => ({
      parent: this.people.find(p => p.id === parentId)?.full_name,
      children: childIds.map(id => this.people.find(p => p.id === id)?.full_name)
    })))
  }
  
  public generateLayout(rootPersonId?: string): TreeLayout {
    console.log('🌳 ═══ STARTING HIERARCHICAL LAYOUT GENERATION ═══')
    
    // Find root people (those with no parents)
    let rootPeople = this.people.filter(person => !this.parentsMap.has(person.id))
    console.log('🌳 Found root people (no parents):', rootPeople.map(p => `${p.full_name} (${p.birth_year || 'no year'})`))
    
    // If no clear roots, find oldest by birth year as fallback
    if (rootPeople.length === 0 && this.people.length > 0) {
      console.log('🌳 No clear roots found, using fallback logic...')
      const oldestByYear = this.people
        .filter(p => p.birth_year)
        .sort((a, b) => (a.birth_year || 9999) - (b.birth_year || 9999))[0]
      
      rootPeople = oldestByYear ? [oldestByYear] : [this.people[0]]
      console.log('🌳 Fallback root selected:', rootPeople[0]?.full_name)
    }
    
    // Assign generations using ancestry-based BFS
    const generations = new Map<number, Person[]>()
    const personDepth = new Map<string, number>()
    const visited = new Set<string>()
    
    const assignGeneration = (person: Person, depth: number) => {
      if (visited.has(person.id)) return
      visited.add(person.id)
      
      console.log(`🌳 Assigning ${person.full_name} to generation ${depth}`)
      
      personDepth.set(person.id, depth)
      if (!generations.has(depth)) generations.set(depth, [])
      generations.get(depth)!.push(person)
      
      // Add spouses to same generation
      const spouses = this.spouseMap.get(person.id) || []
      if (spouses.length > 0) {
        console.log(`🌳   ${person.full_name} has spouses:`, spouses.map(id => this.people.find(p => p.id === id)?.full_name))
      }
      spouses.forEach(spouseId => {
        const spouse = this.people.find(p => p.id === spouseId)
        if (spouse && !visited.has(spouse.id)) {
          console.log(`🌳   Adding spouse ${spouse.full_name} to same generation ${depth}`)
          assignGeneration(spouse, depth)
        }
      })
      
      // Add children to next generation
      const children = this.childrenMap.get(person.id) || []
      if (children.length > 0) {
        console.log(`🌳   ${person.full_name} has children:`, children.map(id => this.people.find(p => p.id === id)?.full_name))
      }
      children.forEach(childId => {
        const child = this.people.find(p => p.id === childId)
        if (child && !visited.has(child.id)) {
          console.log(`🌳   Adding child ${child.full_name} to generation ${depth + 1}`)
          assignGeneration(child, depth + 1)
        }
      })
    }
    
    // Start from root people (oldest generation at depth 0)
    rootPeople.forEach(person => assignGeneration(person, 0))
    
    // Handle any unvisited people (disconnected components)
    this.people.forEach(person => {
      if (!visited.has(person.id)) {
        assignGeneration(person, 0) // Put orphaned people in top generation
      }
    })
    
    // Layout each generation with hierarchical vertical structure
    const nodes: LayoutNode[] = []
    const generationEntries = Array.from(generations.entries()).sort(([a], [b]) => a - b)
    
    console.log('🌳 Hierarchical Layout - Generations:', generationEntries.map(([depth, people]) => ({
      generation: depth,
      count: people.length,
      names: people.map(p => p.full_name)
    })))
    
    generationEntries.forEach(([depth, genPeople]) => {
      // Group families: siblings together, spouses side-by-side
      const familyGroups = this.groupFamilies(genPeople)
      
      // Sort family groups by oldest birth year in each group
      familyGroups.sort((a, b) => {
        const aOldest = Math.min(...a.map(p => p.birth_year || 9999))
        const bOldest = Math.min(...b.map(p => p.birth_year || 9999))
        return aOldest - bOldest
      })
      
      // Calculate Y position with larger gaps between generations for hierarchy
      const hierarchicalVGap = this.options.vGap * 1.5 // 50% more space between generations for clearer hierarchy
      const y = depth * hierarchicalVGap + this.options.cardHeight / 2
      
      console.log(`🌳 Generation ${depth}: Y=${y}, ${genPeople.length} people, ${familyGroups.length} family groups`)
      
      let currentX = 0
      
      familyGroups.forEach(group => {
        // Sort individuals within group by birth year (oldest first)
        group.sort((a, b) => (a.birth_year || 9999) - (b.birth_year || 9999))
        
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
          // Multiple people - check if they're spouses or siblings
          const spouses = this.findSpousePairs(group)
          
          if (spouses.length > 0) {
            // Handle spouse pairs with closer spacing
            spouses.forEach(spousePair => {
              const spouseGap = 30 // Close gap for spouses
              spousePair.forEach((person, index) => {
                nodes.push({
                  personId: person.id,
                  x: currentX + index * (this.options.cardWidth + spouseGap),
                  y,
                  depth
                })
              })
              currentX += spousePair.length * (this.options.cardWidth + spouseGap) + this.options.hGap
            })
            
            // Handle any remaining non-spouse members
            const spouseIds = new Set(spouses.flat().map(p => p.id))
            const remaining = group.filter(p => !spouseIds.has(p.id))
            remaining.forEach(person => {
              nodes.push({
                personId: person.id,
                x: currentX,
                y,
                depth
              })
              currentX += this.options.cardWidth + this.options.hGap
            })
          } else {
            // Siblings or other family members - normal spacing
            group.forEach(person => {
              nodes.push({
                personId: person.id,
                x: currentX,
                y,
                depth
              })
              currentX += this.options.cardWidth + this.options.hGap
            })
          }
        }
        
        // Add extra space between family groups
        currentX += this.options.hGap
      })
    })
    
    // Center the entire layout horizontally
    if (nodes.length > 0) {
      const minX = Math.min(...nodes.map(n => n.x))
      const maxX = Math.max(...nodes.map(n => n.x))
      const centerOffset = -((minX + maxX) / 2)
      
      nodes.forEach(node => {
        node.x += centerOffset
      })
    }
    
    // Calculate bounds
    const bounds = nodes.length > 0 ? {
      width: Math.max(...nodes.map(n => n.x)) - Math.min(...nodes.map(n => n.x)) + this.options.cardWidth,
      height: generationEntries.length * this.options.vGap * 1.2 + this.options.cardHeight
    } : { width: 800, height: 600 }
    
    return {
      nodes,
      bounds,
      generations: generationEntries.length
    }
  }
  
  private groupFamilies(people: Person[]): Person[][] {
    const visited = new Set<string>()
    const groups: Person[][] = []
    
    people.forEach(person => {
      if (visited.has(person.id)) return
      
      const group = [person]
      visited.add(person.id)
      
      // Find spouses first (they should be in same group)
      const spouses = this.spouseMap.get(person.id) || []
      spouses.forEach(spouseId => {
        const spouse = people.find(p => p.id === spouseId)
        if (spouse && !visited.has(spouse.id)) {
          group.push(spouse)
          visited.add(spouse.id)
        }
      })
      
      // Find siblings (share same parents)
      const personParents = this.parentsMap.get(person.id) || []
      if (personParents.length > 0) {
        people.forEach(otherPerson => {
          if (visited.has(otherPerson.id)) return
          
          const otherParents = this.parentsMap.get(otherPerson.id) || []
          // Check if they share at least one parent
          const hasSharedParent = personParents.some(parent => otherParents.includes(parent))
          
          if (hasSharedParent) {
            group.push(otherPerson)
            visited.add(otherPerson.id)
            
            // Also add their spouses to the group
            const otherSpouses = this.spouseMap.get(otherPerson.id) || []
            otherSpouses.forEach(spouseId => {
              const spouse = people.find(p => p.id === spouseId)
              if (spouse && !visited.has(spouse.id)) {
                group.push(spouse)
                visited.add(spouse.id)
              }
            })
          }
        })
      }
      
      groups.push(group)
    })
    
    return groups
  }

  private findSpousePairs(people: Person[]): Person[][] {
    const pairs: Person[][] = []
    const paired = new Set<string>()
    
    people.forEach(person => {
      if (paired.has(person.id)) return
      
      const spouses = this.spouseMap.get(person.id) || []
      const spouseInGroup = spouses.find(spouseId => 
        people.some(p => p.id === spouseId && !paired.has(p.id))
      )
      
      if (spouseInGroup) {
        const spouse = people.find(p => p.id === spouseInGroup)!
        pairs.push([person, spouse])
        paired.add(person.id)
        paired.add(spouse.id)
      }
    })
    
    return pairs
  }
  
  public updateLayout(nodes: LayoutNode[], personId: string, x: number, y: number): LayoutNode[] {
    return nodes.map(node => 
      node.personId === personId 
        ? { ...node, x, y }
        : node
    )
  }
}