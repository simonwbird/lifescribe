import type { Person, Relationship } from '@/lib/familyTreeTypes'

export interface LayoutNode {
  person: Person
  x: number
  y: number
  generation: number
  branchColor: string
  spouses: Person[]
  children: Person[]
  parents: Person[]
}

export interface SpousePair {
  spouse1: Person
  spouse2: Person
  x: number
  y: number
  generation: number
  branchColor: string
  children: Person[]
  width: number
}

export interface LayoutResult {
  nodes: LayoutNode[]
  spousePairs: SpousePair[]
  dimensions: {
    minX: number
    maxX: number
    minY: number
    maxY: number
    width: number
    height: number
  }
}

export interface LayoutConfig {
  personWidth: number
  personHeight: number
  generationHeight: number
  spouseSpacing: number
  siblingSpacing: number
  childSpacing: number
  padding: number
}

const DEFAULT_CONFIG: LayoutConfig = {
  personWidth: 120,
  personHeight: 140,
  generationHeight: 200,
  spouseSpacing: 160,
  siblingSpacing: 180,
  childSpacing: 140,
  padding: 200
}

// Color palette for family branches
const BRANCH_COLORS = [
  '#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#14B8A6',
  '#EF4444', '#EAB308', '#EC4899', '#6366F1', '#84CC16'
]

export class FamilyTreeLayoutEngine {
  private config: LayoutConfig
  private spouseMap = new Map<string, string[]>()
  private childrenMap = new Map<string, string[]>()
  private parentsMap = new Map<string, string[]>()
  private branchColors = new Map<string, string>()

  constructor(config: Partial<LayoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  public generateLayout(people: Person[], relationships: Relationship[]): LayoutResult {
    this.buildRelationshipMaps(relationships)
    this.assignBranchColors(people)
    
    const generations = this.buildGenerations(people)
    const spousePairs = this.identifySpousePairs(generations)
    const nodes = this.calculateNodePositions(people, generations, spousePairs)
    const dimensions = this.calculateDimensions(nodes, spousePairs)

    return {
      nodes,
      spousePairs,
      dimensions
    }
  }

  private buildRelationshipMaps(relationships: Relationship[]) {
    this.spouseMap.clear()
    this.childrenMap.clear()
    this.parentsMap.clear()

    relationships.forEach(rel => {
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

  private assignBranchColors(people: Person[]) {
    this.branchColors.clear()
    const rootPeople = people.filter(person => !this.parentsMap.has(person.id))
    
    // Assign colors to root people
    rootPeople.forEach((person, index) => {
      const color = BRANCH_COLORS[index % BRANCH_COLORS.length]
      this.branchColors.set(person.id, color)
    })

    // Propagate colors to descendants
    const assignColorToDescendants = (personId: string, color: string, visited = new Set<string>()) => {
      if (visited.has(personId)) return
      visited.add(personId)
      
      this.branchColors.set(personId, color)
      
      const children = this.childrenMap.get(personId) || []
      children.forEach(childId => {
        assignColorToDescendants(childId, color, visited)
      })
    }

    rootPeople.forEach(person => {
      const color = this.branchColors.get(person.id)!
      assignColorToDescendants(person.id, color)
    })
  }

  private buildGenerations(people: Person[]): Map<number, Person[]> {
    const generations = new Map<number, Person[]>()
    const personGeneration = new Map<string, number>()
    const visited = new Set<string>()

    const assignGeneration = (person: Person, generation: number) => {
      if (visited.has(person.id)) return
      visited.add(person.id)
      
      personGeneration.set(person.id, generation)
      if (!generations.has(generation)) generations.set(generation, [])
      generations.get(generation)!.push(person)

      // Add spouses to same generation
      const spouses = this.spouseMap.get(person.id) || []
      spouses.forEach(spouseId => {
        const spouse = people.find(p => p.id === spouseId)
        if (spouse && !visited.has(spouse.id)) {
          assignGeneration(spouse, generation)
        }
      })

      // Add children to next generation
      const children = this.childrenMap.get(person.id) || []
      children.forEach(childId => {
        const child = people.find(p => p.id === childId)
        if (child && !visited.has(child.id)) {
          assignGeneration(child, generation + 1)
        }
      })
    }

    // Start from root people
    const rootPeople = people.filter(person => !this.parentsMap.has(person.id))
    if (rootPeople.length === 0 && people.length > 0) {
      rootPeople.push(people[0])
    }
    
    rootPeople.forEach(person => assignGeneration(person, 0))

    return generations
  }

  private identifySpousePairs(generations: Map<number, Person[]>): SpousePair[] {
    const spousePairs: SpousePair[] = []
    const processedPairs = new Set<string>()

    Array.from(generations.entries()).forEach(([generation, genPeople]) => {
      genPeople.forEach(person => {
        const spouses = this.spouseMap.get(person.id) || []
        spouses.forEach(spouseId => {
          const spouse = genPeople.find(p => p.id === spouseId)
          if (spouse) {
            const pairKey = [person.id, spouseId].sort().join('-')
            if (!processedPairs.has(pairKey)) {
              processedPairs.add(pairKey)
              
              // Get shared children
              const person1Children = this.childrenMap.get(person.id) || []
              const person2Children = this.childrenMap.get(spouseId) || []
              const sharedChildren = [...new Set([...person1Children, ...person2Children])]
              
              spousePairs.push({
                spouse1: person,
                spouse2: spouse,
                x: 0, // Will be calculated later
                y: generation * this.config.generationHeight,
                generation,
                branchColor: this.branchColors.get(person.id) || BRANCH_COLORS[0],
                children: sharedChildren.map(id => genPeople.find(p => p.id === id)).filter(Boolean) as Person[],
                width: this.config.spouseSpacing
              })
            }
          }
        })
      })
    })

    return spousePairs
  }

  private calculateNodePositions(
    people: Person[], 
    generations: Map<number, Person[]>, 
    spousePairs: SpousePair[]
  ): LayoutNode[] {
    // First, position spouse pairs by generation
    this.positionSpousePairs(spousePairs, generations)

    // Create a map to track person positions
    const personPositions = new Map<string, { x: number, y: number }>()
    
    // Position people generation by generation, top-down
    const sortedGenerations = Array.from(generations.entries()).sort(([a], [b]) => a - b)
    
    sortedGenerations.forEach(([generation, genPeople]) => {
      const y = generation * this.config.generationHeight
      
      // Separate married couples from single people
      const marriedPeople = new Set<string>()
      const currentGenSpousePairs = spousePairs.filter(sp => sp.generation === generation)
      
      currentGenSpousePairs.forEach(pair => {
        marriedPeople.add(pair.spouse1.id)
        marriedPeople.add(pair.spouse2.id)
        
        // Position spouse pair
        personPositions.set(pair.spouse1.id, { 
          x: pair.x - this.config.spouseSpacing / 4, 
          y 
        })
        personPositions.set(pair.spouse2.id, { 
          x: pair.x + this.config.spouseSpacing / 4, 
          y 
        })
      })
      
      // Position single people
      const singlePeople = genPeople.filter(p => !marriedPeople.has(p.id))
      const totalSpousePairWidth = currentGenSpousePairs.length * this.config.spouseSpacing
      let singlePersonX = totalSpousePairWidth / 2 + this.config.siblingSpacing / 2
      
      singlePeople.forEach(person => {
        personPositions.set(person.id, { x: singlePersonX, y })
        singlePersonX += this.config.siblingSpacing
      })
    })
    
    // Second pass: adjust children to be centered under parents
    sortedGenerations.forEach(([generation]) => {
      if (generation === 0) return // Skip root generation
      
      const genPeople = generations.get(generation) || []
      
      genPeople.forEach(person => {
        const parents = this.parentsMap.get(person.id) || []
        if (parents.length > 0) {
          const parentPositions = parents.map(pid => personPositions.get(pid)).filter(Boolean)
          if (parentPositions.length > 0) {
            const avgParentX = parentPositions.reduce((sum, pos) => sum + pos!.x, 0) / parentPositions.length
            
            // Center child under parents
            const currentPos = personPositions.get(person.id)
            if (currentPos) {
              personPositions.set(person.id, { x: avgParentX, y: currentPos.y })
            }
          }
        }
      })
    })
    
    // Handle multiple children spacing
    this.adjustSiblingSpacing(personPositions, generations)
    
    // Create nodes from calculated positions
    const nodes: LayoutNode[] = []
    
    people.forEach(person => {
      const position = personPositions.get(person.id)
      if (!position) return
      
      const generation = this.findPersonGeneration(person.id, generations)
      const spouses = (this.spouseMap.get(person.id) || [])
        .map(id => people.find(p => p.id === id)!)
        .filter(Boolean)
      
      const children = (this.childrenMap.get(person.id) || [])
        .map(id => people.find(p => p.id === id)!)
        .filter(Boolean)
      
      const parents = (this.parentsMap.get(person.id) || [])
        .map(id => people.find(p => p.id === id)!)
        .filter(Boolean)

      nodes.push({
        person,
        x: position.x,
        y: position.y,
        generation,
        branchColor: this.branchColors.get(person.id) || BRANCH_COLORS[0],
        spouses,
        children,
        parents
      })
    })

    return nodes
  }

  private positionSpousePairs(spousePairs: SpousePair[], generations: Map<number, Person[]>) {
    // Group spouse pairs by generation
    const pairsByGeneration = new Map<number, SpousePair[]>()
    spousePairs.forEach(pair => {
      if (!pairsByGeneration.has(pair.generation)) {
        pairsByGeneration.set(pair.generation, [])
      }
      pairsByGeneration.get(pair.generation)!.push(pair)
    })

    // Position each generation's pairs centered around origin
    pairsByGeneration.forEach((pairs, generation) => {
      const totalWidth = pairs.length * this.config.spouseSpacing
      let currentX = -totalWidth / 2

      pairs.forEach(pair => {
        pair.x = currentX + this.config.spouseSpacing / 2
        pair.width = this.config.spouseSpacing
        currentX += this.config.spouseSpacing
      })
    })
  }

  private adjustSiblingSpacing(
    personPositions: Map<string, { x: number, y: number }>, 
    generations: Map<number, Person[]>
  ) {
    // Handle multiple children under the same parents
    const childrenByParents = new Map<string, string[]>()
    
    this.parentsMap.forEach((parents, childId) => {
      const parentKey = parents.sort().join('-')
      if (!childrenByParents.has(parentKey)) {
        childrenByParents.set(parentKey, [])
      }
      childrenByParents.get(parentKey)!.push(childId)
    })
    
    // Adjust spacing for multiple children
    childrenByParents.forEach((children, parentKey) => {
      if (children.length > 1) {
        const parents = parentKey.split('-')
        const parentPositions = parents.map(pid => personPositions.get(pid)).filter(Boolean)
        
        if (parentPositions.length > 0) {
          const parentCenterX = parentPositions.reduce((sum, pos) => sum + pos!.x, 0) / parentPositions.length
          const totalChildWidth = (children.length - 1) * this.config.childSpacing
          let childX = parentCenterX - totalChildWidth / 2
          
          children.forEach(childId => {
            const childPos = personPositions.get(childId)
            if (childPos) {
              personPositions.set(childId, { x: childX, y: childPos.y })
              childX += this.config.childSpacing
            }
          })
        }
      }
    })
  }

  private findPersonGeneration(personId: string, generations: Map<number, Person[]>): number {
    for (const [generation, people] of generations.entries()) {
      if (people.some(p => p.id === personId)) {
        return generation
      }
    }
    return 0
  }

  // Remove these methods as they're no longer needed with the new positioning system

  private calculateDimensions(nodes: LayoutNode[], spousePairs: SpousePair[]) {
    const allX = [
      ...nodes.map(n => n.x - this.config.personWidth / 2),
      ...nodes.map(n => n.x + this.config.personWidth / 2),
      ...spousePairs.map(sp => sp.x - sp.width / 2),
      ...spousePairs.map(sp => sp.x + sp.width / 2)
    ]
    
    const allY = [
      ...nodes.map(n => n.y),
      ...nodes.map(n => n.y + this.config.personHeight),
      ...spousePairs.map(sp => sp.y),
      ...spousePairs.map(sp => sp.y + this.config.personHeight)
    ]

    const minX = Math.min(...allX) - this.config.padding
    const maxX = Math.max(...allX) + this.config.padding
    const minY = Math.min(...allY) - this.config.padding
    const maxY = Math.max(...allY) + this.config.padding

    return {
      minX,
      maxX,
      minY,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    }
  }
}