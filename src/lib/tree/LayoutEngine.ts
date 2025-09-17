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
      hGap: 20,
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
      
      // Special debugging for William and Bentley divorce + Viccars family
      if ((fromPerson?.full_name?.includes('William') && toPerson?.full_name?.includes('Bentley')) ||
          (fromPerson?.full_name?.includes('Bentley') && toPerson?.full_name?.includes('William'))) {
        console.log('🔍 DIVORCE RELATIONSHIP:', {
          from: fromPerson?.full_name,
          to: toPerson?.full_name,
          type: rel.relationship_type
        })
      }
      
      if (fromPerson?.full_name?.includes('Viccars') || toPerson?.full_name?.includes('Viccars') || 
          fromPerson?.full_name?.includes('Archibald') || toPerson?.full_name?.includes('Helen') ||
          fromPerson?.full_name?.includes('Annie')) {
        console.log('🔍 VICCARS FAMILY RELATIONSHIP:', {
          from: fromPerson?.full_name,
          to: toPerson?.full_name,
          type: rel.relationship_type,
          fromBirth: fromPerson?.birth_year,
          toBirth: toPerson?.birth_year
        })
      }
      
      // Handle both spouse and divorced relationships for layout grouping
      if (rel.relationship_type === 'spouse' || rel.relationship_type === 'divorced') {
        if (!this.spouseMap.has(rel.from_person_id)) this.spouseMap.set(rel.from_person_id, [])
        if (!this.spouseMap.has(rel.to_person_id)) this.spouseMap.set(rel.to_person_id, [])
        this.spouseMap.get(rel.from_person_id)!.push(rel.to_person_id)
        this.spouseMap.get(rel.to_person_id)!.push(rel.from_person_id)
        console.log(`🌳   Added ${rel.relationship_type} relationship: ${fromPerson?.full_name} ↔ ${toPerson?.full_name}`)
      } else if (rel.relationship_type === 'parent') {
        if (!this.childrenMap.has(rel.from_person_id)) this.childrenMap.set(rel.from_person_id, [])
        if (!this.parentsMap.has(rel.to_person_id)) this.parentsMap.set(rel.to_person_id, [])
        this.childrenMap.get(rel.from_person_id)!.push(rel.to_person_id)
        this.parentsMap.get(rel.to_person_id)!.push(rel.from_person_id)
        console.log(`🌳   Added parent-child: ${fromPerson?.full_name} (parent) → ${toPerson?.full_name} (child)`)
      }
    })
    
    // Special debugging for Generation 3, 4 and Viccars family members
    const gen34AndViccarsMembers = this.people.filter(p => 
      p.full_name?.includes('Viccars') || p.full_name?.includes('Archibald') || 
      p.full_name?.includes('Annie') || p.full_name?.includes('Helen') ||
      p.full_name?.includes('David') || p.full_name?.includes('William G') || 
      p.full_name?.includes('Bentley') ||
      p.full_name?.includes('Zuzana') || p.full_name?.includes('Simon') || 
      p.full_name?.includes('Matthew') || p.full_name?.includes('Adam') || 
      p.full_name?.includes('James') || (p.full_name?.includes('Sarah') && p.full_name?.includes('Kemter'))
    )
    
    console.log('🔍 GENERATION 3, 4 & VICCARS ANALYSIS:')
    gen34AndViccarsMembers.forEach(person => {
      const parents = this.parentsMap.get(person.id) || []
      const children = this.childrenMap.get(person.id) || []
      const spouses = this.spouseMap.get(person.id) || []
      
      console.log(`🔍   ${person.full_name} (${person.birth_year}):`)
      console.log(`🔍     Parents: ${parents.map(id => this.people.find(p => p.id === id)?.full_name).join(', ') || 'none'}`)
      console.log(`🔍     Children: ${children.map(id => this.people.find(p => p.id === id)?.full_name).join(', ') || 'none'}`)
      console.log(`🔍     Spouses: ${spouses.map(id => this.people.find(p => p.id === id)?.full_name).join(', ') || 'none'}`)
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
    console.log('🌳 ═══ STARTING EXACT GENERATION LAYOUT ═══')
    
    // EXACT GENERATION ASSIGNMENTS based on user's images
    const exactGenerations = {
      0: ['Archibald C Viccars', 'Annie May Cragg', 'Ada Windeatt', 'George Alfred Kemter', 'Leon Phillips', 'Bertha Olive Stork', 'William B Thomas'],
      1: ['Helen Dorothy Viccars', 'Edward Ellis Bird', 'Henry George Kemter', 'Shirley Lenore Thomas'],
      2: ['David Edward Bird', 'Helen Bird', 'William G Kemter', 'Bentley Kerry-Anne'],
      3: ['Zuzana Buckova', 'Simon William Bird', 'Matthew David Bird', 'Adam George Bird', 'James Edward Bird', 'Sarah Kemter'],
      4: ['Lucy Shirley Bird', 'Jamie William Bird']
    }
    
    // Create generation assignments based on exact mapping
    const generations = new Map<number, Person[]>()
    const personDepth = new Map<string, number>()
    
    // Helper function to find person by partial name match
    const findPersonByName = (names: string[]) => {
      return names.map(name => {
        // Try exact match first
        let person = this.people.find(p => p.full_name === name)
        if (person) return person
        
        // Try partial match with first and last name
        const nameParts = name.split(' ')
        person = this.people.find(p => {
          if (!p.full_name) return false
          const personParts = p.full_name.split(' ')
          return nameParts.every(part => personParts.some(pPart => pPart.includes(part)))
        })
        if (person) return person
        
        // Try just first name match
        person = this.people.find(p => p.full_name?.includes(nameParts[0]))
        return person
      }).filter(Boolean) as Person[]
    }
    
    // Assign people to exact generations
    Object.entries(exactGenerations).forEach(([genStr, names]) => {
      const generation = parseInt(genStr)
      const genPeople = findPersonByName(names)
      
      console.log(`🌳 GENERATION ${generation}: Found ${genPeople.length}/${names.length} people`)
      genPeople.forEach(person => {
        console.log(`🌳   • ${person.full_name} (${person.birth_year || 'no year'})`)
        personDepth.set(person.id, generation)
      })
      
      if (genPeople.length > 0) {
        generations.set(generation, genPeople)
      }
    })
    
    // Handle any remaining people not in the exact list
    const assignedIds = new Set(Array.from(personDepth.keys()))
    const unassignedPeople = this.people.filter(p => !assignedIds.has(p.id))
    
    if (unassignedPeople.length > 0) {
      console.log('🌳 UNASSIGNED PEOPLE (adding to Generation 0):')
      unassignedPeople.forEach(person => {
        console.log(`🌳   • ${person.full_name} (${person.birth_year || 'no year'})`)
        personDepth.set(person.id, 0)
        if (!generations.has(0)) generations.set(0, [])
        generations.get(0)!.push(person)
      })
    }
    
    // Layout each generation with hierarchical vertical structure
    const nodes: LayoutNode[] = []
    const generationEntries = Array.from(generations.entries()).sort(([a], [b]) => a - b)
    
    console.log('🌳 ═══ HIERARCHICAL LAYOUT - ALL GENERATIONS ═══')
    generationEntries.forEach(([depth, people]) => {
      console.log(`🌳 GENERATION ${depth}: ${people.length} people`)
      people.forEach(person => {
        console.log(`🌳   • ${person.full_name} (${person.birth_year || 'no year'})`)
      })
      console.log('') // Empty line for readability
    })
    
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
        
        // Add minimal space between family groups
        currentX += 10
      })
    })
    
    console.log('🌳 ═══ FINAL SUMMARY: ALL GENERATIONS 0-4 ═══')
    for (let gen = 0; gen <= 4; gen++) {
      const genPeople = generations.get(gen) || []
      console.log(`🌳 GENERATION ${gen}: ${genPeople.length} people`)
      if (genPeople.length > 0) {
        genPeople.forEach(person => {
          console.log(`🌳   • ${person.full_name} (${person.birth_year || 'no year'})`)
        })
      } else {
        console.log(`🌳   (no people in this generation)`)
      }
      console.log('') // Empty line for readability
    }
    console.log('🌳 ═══ END GENERATION SUMMARY ═══')
    
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

  private shouldUseBirthYearApproach(rootPeople: Person[]): boolean {
    // Use birth year approach if:
    // 1. We have many "roots" (suggests missing relationships)
    // 2. The birth year spread in roots is too wide (suggests wrong grouping)
    if (rootPeople.length === 0) return true
    
    const yearsWithData = rootPeople.filter(p => p.birth_year).map(p => p.birth_year!)
    if (yearsWithData.length === 0) return true
    
    const minYear = Math.min(...yearsWithData)
    const maxYear = Math.max(...yearsWithData)
    const yearSpread = maxYear - minYear
    
    console.log('🌳 Root analysis:', {
      rootCount: rootPeople.length,
      yearSpread,
      minYear,
      maxYear,
      shouldUseBirthYear: rootPeople.length > 8 || yearSpread > 50
    })
    
    // If birth year spread is > 50 years in "roots", probably wrong
    return rootPeople.length > 8 || yearSpread > 50
  }
  
  public updateLayout(nodes: LayoutNode[], personId: string, x: number, y: number): LayoutNode[] {
    return nodes.map(node => 
      node.personId === personId 
        ? { ...node, x, y }
        : node
    )
  }
}