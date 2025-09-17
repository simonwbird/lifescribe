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
    console.log('🌳 ═══ STARTING SIMPLE HIERARCHICAL LAYOUT ═══')
    
    // SIMPLE RULE: People with no parents = TOP GENERATION
    const rootPeople = this.people.filter(person => !this.parentsMap.has(person.id))
    // Special debugging for the people who should be Generation 2, 3, and 4
    const shouldBeGen2 = ['Helen Dorothy Viccars', 'Edward Ellis Bird', 'Henry George Kemter', 'Shirley Lenore Thomas']
    const shouldBeGen3 = ['David Edward Bird', 'Helen Bird', 'William G Kemter', 'Bentley Kerry-Anne']
    const shouldBeGen4 = ['Zuzana Buckova', 'Simon William Bird', 'Matthew David Bird', 'Adam George Bird', 'James Edward Bird', 'Sarah Kemter', 'Lucy Shirley Bird', 'Jamie William Bird']
    
    console.log('🔍 GENERATION 2, 3 & 4 ANALYSIS:')
    
    shouldBeGen2.forEach(name => {
      const person = this.people.find(p => p.full_name?.includes(name.split(' ')[0]))
      if (person) {
        const parents = this.parentsMap.get(person.id) || []
        console.log(`🔍   GEN 2: ${person.full_name} (${person.birth_year}) has ${parents.length} parents`)
      }
    })
    
    shouldBeGen3.forEach(name => {
      const person = this.people.find(p => p.full_name?.includes(name.split(' ')[0]))
      if (person) {
        const parents = this.parentsMap.get(person.id) || []
        const spouses = this.spouseMap.get(person.id) || []
        console.log(`🔍   GEN 3: ${person.full_name} (${person.birth_year || 'no year'}) has ${parents.length} parents, ${spouses.length} spouses/divorced`)
      }
    })
    
    shouldBeGen4.forEach(name => {
      const person = this.people.find(p => p.full_name?.includes(name.split(' ')[0]))
      if (person) {
        const parents = this.parentsMap.get(person.id) || []
        const spouses = this.spouseMap.get(person.id) || []
        console.log(`🔍   GEN 4: ${person.full_name} (${person.birth_year || 'no year'}) has ${parents.length} parents, ${spouses.length} spouses`)
        
        if (parents.length === 0) {
          console.log(`🔍     ❌ ERROR: ${person.full_name} has NO PARENTS - will be Generation 0 instead of 4!`)
        } else {
          const parentNames = parents.map(id => this.people.find(p => p.id === id)?.full_name)
          console.log(`🔍     Parents: ${parentNames.join(', ')}`)
        }
      }
    })
    
    console.log('🌳 TOP GENERATION (no parents assigned):', rootPeople.map(p => `${p.full_name} (${p.birth_year || 'no year'})`))
    
    // Check if any Generation 2/3/4 people are incorrectly in the root generation
    const gen234InRoots = rootPeople.filter(p => 
      shouldBeGen2.some(name => p.full_name?.includes(name.split(' ')[0])) ||
      shouldBeGen3.some(name => p.full_name?.includes(name.split(' ')[0])) ||
      shouldBeGen4.some(name => p.full_name?.includes(name.split(' ')[0]))
    )
    
    if (gen234InRoots.length > 0) {
      console.log('🔍 ❌ ERROR: These Generation 2/3/4 people are incorrectly in TOP generation:', 
        gen234InRoots.map(p => `${p.full_name} (should be gen 2/3/4)`))
      console.log('🔍 This means parent-child relationships are missing in the database!')
    }
    
    // Simple generation assignment using BFS
    const generations = new Map<number, Person[]>()
    const personDepth = new Map<string, number>()
    const visited = new Set<string>()
    
    const assignGeneration = (person: Person, depth: number) => {
      if (visited.has(person.id)) return
      visited.add(person.id)
      
      // Special debugging for Viccars family
      const isViccarsFamily = person.full_name?.includes('Viccars') || person.full_name?.includes('Archibald') || 
                             person.full_name?.includes('Annie') || person.full_name?.includes('Helen')
      
      if (isViccarsFamily) {
        console.log(`🔍 VICCARS: Assigning ${person.full_name} (${person.birth_year}) to generation ${depth}`)
      } else {
        console.log(`🌳 Assigning ${person.full_name} to generation ${depth}`)
      }
      
      personDepth.set(person.id, depth)
      if (!generations.has(depth)) generations.set(depth, [])
      generations.get(depth)!.push(person)
      
      // Add spouses to same generation
      const spouses = this.spouseMap.get(person.id) || []
      if (spouses.length > 0) {
        if (isViccarsFamily) {
          console.log(`🔍 VICCARS: ${person.full_name} has spouses:`, spouses.map(id => this.people.find(p => p.id === id)?.full_name))
        } else {
          console.log(`🌳   ${person.full_name} has spouses:`, spouses.map(id => this.people.find(p => p.id === id)?.full_name))
        }
      }
      spouses.forEach(spouseId => {
        const spouse = this.people.find(p => p.id === spouseId)
        if (spouse && !visited.has(spouse.id)) {
          if (isViccarsFamily) {
            console.log(`🔍 VICCARS: Adding spouse ${spouse.full_name} to same generation ${depth}`)
          } else {
            console.log(`🌳   Adding spouse ${spouse.full_name} to same generation ${depth}`)
          }
          assignGeneration(spouse, depth)
        }
      })
      
      // Add children to next generation
      const children = this.childrenMap.get(person.id) || []
      if (children.length > 0) {
        if (isViccarsFamily) {
          console.log(`🔍 VICCARS: ${person.full_name} has children:`, children.map(id => this.people.find(p => p.id === id)?.full_name))
        } else {
          console.log(`🌳   ${person.full_name} has children:`, children.map(id => this.people.find(p => p.id === id)?.full_name))
        }
      }
      children.forEach(childId => {
        const child = this.people.find(p => p.id === childId)
        if (child && !visited.has(child.id)) {
          const shouldBeGen2Names = ['Helen', 'Edward', 'Henry', 'Shirley']
          const isGen2Person = shouldBeGen2Names.some(name => child.full_name?.includes(name))
          
          if (isGen2Person) {
            console.log(`🔍 FOUND GEN 2 PERSON: Adding ${child.full_name} as child of ${person.full_name} to generation ${depth + 1}`)
          } else {
            console.log(`🌳   Adding child ${child.full_name} to generation ${depth + 1}`)
          }
          assignGeneration(child, depth + 1)
        }
      })
    }
    
    // Start from TOP GENERATION (people with no parents)
    console.log('🔍 Starting BFS from top generation...')
    rootPeople.forEach(person => {
      console.log(`🔍 Starting generation assignment from: ${person.full_name} (no parents = Generation 0)`)
      assignGeneration(person, 0)
    })
    
    // Handle any unvisited people (disconnected components)
    this.people.forEach(person => {
      if (!visited.has(person.id)) {
        console.log(`🔍 ORPHAN: ${person.full_name} (${person.birth_year}) has no connections - adding to Generation 0`)
        assignGeneration(person, 0) // Put orphaned people in top generation
      }
    })
    
    // Final generation verification
    console.log('🔍 ═══ FINAL GENERATION ASSIGNMENTS ═══')
    const gen2Names = ['Helen Dorothy', 'Edward Ellis', 'Henry George', 'Shirley']
    const gen3Names = ['David Edward', 'Helen Bird', 'William G', 'Bentley']
    const gen4Names = ['Zuzana', 'Simon William', 'Matthew David', 'Adam George', 'James Edward', 'Sarah Kemter', 'Lucy', 'Jamie']
    
    gen2Names.forEach(name => {
      const person = this.people.find(p => p.full_name?.includes(name.split(' ')[0]))
      if (person) {
        const assignedGeneration = personDepth.get(person.id)
        console.log(`🔍 GEN 2: ${person.full_name}: Assigned to Generation ${assignedGeneration} ${assignedGeneration === 1 ? '✅' : '❌'}`)
      }
    })
    
    gen3Names.forEach(name => {
      const person = this.people.find(p => p.full_name?.includes(name.split(' ')[0]))
      if (person) {
        const assignedGeneration = personDepth.get(person.id)
        console.log(`🔍 GEN 3: ${person.full_name}: Assigned to Generation ${assignedGeneration} ${assignedGeneration === 2 ? '✅' : '❌'}`)
      }
    })
    
    gen4Names.forEach(name => {
      const person = this.people.find(p => p.full_name?.includes(name.split(' ')[0]))
      if (person) {
        const assignedGeneration = personDepth.get(person.id)
        console.log(`🔍 GEN 4: ${person.full_name}: Assigned to Generation ${assignedGeneration} ${assignedGeneration === 3 ? '✅' : '❌'}`)
      }
    })
    
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
        
        // Add extra space between family groups
        currentX += this.options.hGap
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