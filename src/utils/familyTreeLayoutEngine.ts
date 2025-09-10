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

export interface Marriage {
  id: string
  parentA?: Person
  parentB?: Person
  children: Person[]
  x: number
  y: number
  generation: number
  branchColor: string
}

export interface LayoutResult {
  nodes: LayoutNode[]
  marriages: Marriage[]
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
  gridX: number
  gridY: number
}

const DEFAULT_CONFIG: LayoutConfig = {
  personWidth: 160,
  personHeight: 120,
  generationHeight: 200,
  spouseSpacing: 200,
  siblingSpacing: 220,
  childSpacing: 180,
  padding: 100,
  gridX: 220,
  gridY: 160
}

// Color palette for family branches
const BRANCH_COLORS = [
  '#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#14B8A6',
  '#EF4444', '#EAB308', '#EC4899', '#6366F1', '#84CC16'
]

export class FamilyTreeLayoutEngine {
  private config: LayoutConfig
  private childrenMap = new Map<string, string[]>()
  private parentsMap = new Map<string, string[]>()
  private spouseMap = new Map<string, string[]>()
  private branchColors = new Map<string, string>()
  private peopleById = new Map<string, Person>()

  constructor(config: Partial<LayoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  public generateLayout(people: Person[], relationships: Relationship[]): LayoutResult {
    // Clear previous state
    this.childrenMap.clear()
    this.parentsMap.clear()
    this.spouseMap.clear()
    this.branchColors.clear()
    this.peopleById.clear()

    // Index people by ID
    people.forEach(p => this.peopleById.set(p.id, p))

    // Step 1: Build relationship maps and marriages
    this.buildRelationshipMaps(relationships)
    const marriages = this.buildMarriages(people)

    // Step 2: Assign generation depths using BFS
    const depths = this.assignDepths(people, marriages)

    // Step 3: Assign branch colors
    this.assignBranchColors(people, depths)

    // Step 4: Calculate positions using org-chart algorithm
    const positions = this.calculatePositions(people, marriages, depths)

    // Step 5: Create layout nodes
    const nodes = this.createLayoutNodes(people, positions, depths)
    const marriageNodes = this.createMarriageNodes(marriages, positions)

    // Step 6: Calculate dimensions
    const dimensions = this.calculateDimensions([...nodes, ...marriageNodes])

    return {
      nodes,
      marriages: marriageNodes,
      dimensions
    }
  }

  private buildRelationshipMaps(relationships: Relationship[]) {
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

  private buildMarriages(people: Person[]): Marriage[] {
    const marriages = new Map<string, Marriage>()
    
    // Create marriages from parent-child relationships
    people.forEach(person => {
      const parents = this.parentsMap.get(person.id) || []
      if (parents.length > 0) {
        // Sort parents for consistent marriage ID
        const sortedParents = [...parents].sort()
        const marriageId = sortedParents.join('-')
        
        if (!marriages.has(marriageId)) {
          const parentA = this.peopleById.get(sortedParents[0])
          const parentB = sortedParents[1] ? this.peopleById.get(sortedParents[1]) : undefined
          
          marriages.set(marriageId, {
            id: marriageId,
            parentA,
            parentB,
            children: [],
            x: 0,
            y: 0,
            generation: 0,
            branchColor: BRANCH_COLORS[0]
          })
        }
        
        marriages.get(marriageId)!.children.push(person)
      }
    })

    return Array.from(marriages.values())
  }

  private assignDepths(people: Person[], marriages: Marriage[]): Map<string, number> {
    const depths = new Map<string, number>()
    const visited = new Set<string>()

    // Find root people (no parents)
    const rootPeople = people.filter(p => !this.parentsMap.has(p.id))
    if (rootPeople.length === 0 && people.length > 0) {
      rootPeople.push(people[0]) // Fallback to first person
    }

    // BFS to assign depths
    const queue: Array<{ person: Person; depth: number }> = []
    
    // Start with root people at depth 0
    rootPeople.forEach(person => {
      depths.set(person.id, 0)
      visited.add(person.id)
      queue.push({ person, depth: 0 })
    })

    while (queue.length > 0) {
      const { person, depth } = queue.shift()!
      
      // Find marriages involving this person
      marriages.forEach(marriage => {
        if ((marriage.parentA?.id === person.id || marriage.parentB?.id === person.id)) {
          // Marriage at same depth as parents
          marriage.generation = depth
          
          // Children at depth + 1
          marriage.children.forEach(child => {
            if (!visited.has(child.id)) {
              depths.set(child.id, depth + 1)
              visited.add(child.id)
              queue.push({ person: child, depth: depth + 1 })
            }
          })
        }
      })

      // Handle spouses (same generation)
      const spouses = this.spouseMap.get(person.id) || []
      spouses.forEach(spouseId => {
        const spouse = this.peopleById.get(spouseId)
        if (spouse && !visited.has(spouse.id)) {
          depths.set(spouse.id, depth)
          visited.add(spouse.id)
          queue.push({ person: spouse, depth })
        }
      })
    }

    return depths
  }

  private assignBranchColors(people: Person[], depths: Map<string, number>) {
    const rootPeople = people.filter(p => (depths.get(p.id) || 0) === 0)
    
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

      // Also assign to spouses
      const spouses = this.spouseMap.get(personId) || []
      spouses.forEach(spouseId => {
        if (!this.branchColors.has(spouseId)) {
          this.branchColors.set(spouseId, color)
        }
      })
    }

    rootPeople.forEach(person => {
      const color = this.branchColors.get(person.id)!
      assignColorToDescendants(person.id, color)
    })
  }

  private calculatePositions(people: Person[], marriages: Marriage[], depths: Map<string, number>): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>()
    
    // Group by generation
    const generations = new Map<number, Person[]>()
    people.forEach(person => {
      const depth = depths.get(person.id) || 0
      if (!generations.has(depth)) generations.set(depth, [])
      generations.get(depth)!.push(person)
    })

    // Sort generations by depth
    const sortedGenerations = Array.from(generations.entries()).sort(([a], [b]) => a - b)
    
    // Calculate positions generation by generation
    sortedGenerations.forEach(([generation, genPeople]) => {
      const y = generation * this.config.gridY
      
      // Group people by marriage
      const marriedPeople = new Set<string>()
      const currentMarriages = marriages.filter(m => m.generation === generation)
      
      let currentX = 0
      
      // Position married couples
      currentMarriages.forEach(marriage => {
        if (marriage.parentA) {
          marriedPeople.add(marriage.parentA.id)
          positions.set(marriage.parentA.id, { 
            x: currentX - this.config.spouseSpacing / 4, 
            y 
          })
        }
        
        if (marriage.parentB) {
          marriedPeople.add(marriage.parentB.id)
          positions.set(marriage.parentB.id, { 
            x: currentX + this.config.spouseSpacing / 4, 
            y 
          })
        }
        
        // Marriage position at center of couple
        marriage.x = currentX
        marriage.y = y
        
        currentX += this.config.spouseSpacing
      })
      
      // Position single people
      const singlePeople = genPeople.filter(p => !marriedPeople.has(p.id))
      singlePeople.forEach(person => {
        positions.set(person.id, { x: currentX, y })
        currentX += this.config.siblingSpacing
      })
    })

    // Second pass: center children under parents
    marriages.forEach(marriage => {
      if (marriage.children.length > 0) {
        const childGeneration = marriage.generation + 1
        const childY = childGeneration * this.config.gridY
        
        // Center children under marriage
        const totalChildWidth = (marriage.children.length - 1) * this.config.childSpacing
        let childX = marriage.x - totalChildWidth / 2
        
        marriage.children.forEach(child => {
          positions.set(child.id, { x: childX, y: childY })
          childX += this.config.childSpacing
        })
      }
    })

    // Collision resolution
    this.resolveCollisions(positions, generations)

    return positions
  }

  private resolveCollisions(positions: Map<string, { x: number; y: number }>, generations: Map<number, Person[]>) {
    // For each generation, ensure no overlaps
    generations.forEach(genPeople => {
      const genPositions = genPeople
        .map(p => ({ person: p, pos: positions.get(p.id)! }))
        .filter(item => item.pos)
        .sort((a, b) => a.pos.x - b.pos.x)
      
      const minSpacing = this.config.personWidth + 20 // 20px gap
      
      for (let i = 1; i < genPositions.length; i++) {
        const prev = genPositions[i - 1]
        const curr = genPositions[i]
        
        if (curr.pos.x - prev.pos.x < minSpacing) {
          const shift = minSpacing - (curr.pos.x - prev.pos.x)
          
          // Shift current and all following people
          for (let j = i; j < genPositions.length; j++) {
            const item = genPositions[j]
            positions.set(item.person.id, {
              x: item.pos.x + shift,
              y: item.pos.y
            })
            item.pos.x += shift
          }
        }
      }
    })
  }

  private createLayoutNodes(people: Person[], positions: Map<string, { x: number; y: number }>, depths: Map<string, number>): LayoutNode[] {
    return people.map(person => {
      const position = positions.get(person.id) || { x: 0, y: 0 }
      const generation = depths.get(person.id) || 0
      
      const spouses = (this.spouseMap.get(person.id) || [])
        .map(id => this.peopleById.get(id)!)
        .filter(Boolean)
      
      const children = (this.childrenMap.get(person.id) || [])
        .map(id => this.peopleById.get(id)!)
        .filter(Boolean)
      
      const parents = (this.parentsMap.get(person.id) || [])
        .map(id => this.peopleById.get(id)!)
        .filter(Boolean)

      return {
        person,
        x: position.x,
        y: position.y,
        generation,
        branchColor: this.branchColors.get(person.id) || BRANCH_COLORS[0],
        spouses,
        children,
        parents
      }
    })
  }

  private createMarriageNodes(marriages: Marriage[], positions: Map<string, { x: number; y: number }>): Marriage[] {
    return marriages.map(marriage => ({
      ...marriage,
      branchColor: marriage.parentA 
        ? this.branchColors.get(marriage.parentA.id) || BRANCH_COLORS[0]
        : BRANCH_COLORS[0]
    }))
  }

  private calculateDimensions(items: Array<{ x: number; y: number }>): { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number } {
    if (items.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 }
    }

    const xs = items.map(item => item.x)
    const ys = items.map(item => item.y)
    
    const minX = Math.min(...xs) - this.config.personWidth / 2 - this.config.padding
    const maxX = Math.max(...xs) + this.config.personWidth / 2 + this.config.padding
    const minY = Math.min(...ys) - this.config.padding
    const maxY = Math.max(...ys) + this.config.personHeight + this.config.padding

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