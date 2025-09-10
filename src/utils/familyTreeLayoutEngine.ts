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
    const nodes: LayoutNode[] = []

    // First, position spouse pairs by generation
    this.positionSpousePairs(spousePairs, generations)

    // Then position individual nodes
    people.forEach(person => {
      const generation = this.findPersonGeneration(person.id, generations)
      const y = generation * this.config.generationHeight
      
      // Check if person is part of a spouse pair
      const spousePair = spousePairs.find(sp => 
        sp.spouse1.id === person.id || sp.spouse2.id === person.id
      )

      let x = 0
      if (spousePair) {
        // Position relative to spouse pair center
        x = spousePair.spouse1.id === person.id 
          ? spousePair.x - this.config.spouseSpacing / 4
          : spousePair.x + this.config.spouseSpacing / 4
      } else {
        // Position single person
        x = this.calculateSinglePersonPosition(person, generation, generations, spousePairs)
      }

      // If person has parents, center under them
      const parents = this.parentsMap.get(person.id) || []
      if (parents.length > 0) {
        x = this.centerUnderParents(person, parents, nodes, spousePairs)
      }

      const spouses = (this.spouseMap.get(person.id) || [])
        .map(id => people.find(p => p.id === id)!)
        .filter(Boolean)
      
      const children = (this.childrenMap.get(person.id) || [])
        .map(id => people.find(p => p.id === id)!)
        .filter(Boolean)
      
      const parentPeople = parents
        .map(id => people.find(p => p.id === id)!)
        .filter(Boolean)

      nodes.push({
        person,
        x,
        y,
        generation,
        branchColor: this.branchColors.get(person.id) || BRANCH_COLORS[0],
        spouses,
        children,
        parents: parentPeople
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

    // Position each generation's pairs
    pairsByGeneration.forEach((pairs, generation) => {
      const totalWidth = pairs.length * this.config.spouseSpacing
      let currentX = -totalWidth / 2

      pairs.forEach(pair => {
        pair.x = currentX + this.config.spouseSpacing / 2
        currentX += this.config.spouseSpacing
      })
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

  private calculateSinglePersonPosition(
    person: Person, 
    generation: number, 
    generations: Map<number, Person[]>,
    spousePairs: SpousePair[]
  ): number {
    const genPeople = generations.get(generation) || []
    const singlePeople = genPeople.filter(p => {
      return !spousePairs.some(sp => sp.spouse1.id === p.id || sp.spouse2.id === p.id)
    })

    const personIndex = singlePeople.findIndex(p => p.id === person.id)
    const totalSingleWidth = singlePeople.length * this.config.siblingSpacing
    
    // Position single people to the right of spouse pairs
    const spousePairsWidth = spousePairs.filter(sp => sp.generation === generation).length * this.config.spouseSpacing
    const startX = spousePairsWidth / 2 + this.config.siblingSpacing
    
    return startX + personIndex * this.config.siblingSpacing
  }

  private centerUnderParents(
    person: Person, 
    parentIds: string[], 
    nodes: LayoutNode[], 
    spousePairs: SpousePair[]
  ): number {
    // Find parent positions
    const parentNodes = nodes.filter(n => parentIds.includes(n.person.id))
    const parentPair = spousePairs.find(sp => 
      parentIds.includes(sp.spouse1.id) && parentIds.includes(sp.spouse2.id)
    )

    if (parentPair) {
      // Center under spouse pair
      return parentPair.x
    } else if (parentNodes.length > 0) {
      // Center under single parent or average of parents
      const avgX = parentNodes.reduce((sum, node) => sum + node.x, 0) / parentNodes.length
      return avgX
    }

    return 0
  }

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