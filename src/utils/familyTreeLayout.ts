import type { TreeNode, Person, Relationship } from '@/lib/familyTreeTypes'

export interface LayoutNode extends TreeNode {
  x: number
  y: number
  level: number
  width: number
  height: number
}

export interface LayoutConfig {
  nodeWidth: number
  nodeHeight: number
  horizontalSpacing: number
  verticalSpacing: number
  levelHeight: number
  branchSpacing: number
  generationSpacing: number
}

export interface FamilyGroup {
  generation: number
  branch: string
  people: Person[]
  x: number
  y: number
  width: number
  height: number
}

const defaultConfig: LayoutConfig = {
  nodeWidth: 200,
  nodeHeight: 120,
  horizontalSpacing: 60,
  verticalSpacing: 40,
  levelHeight: 180,
  branchSpacing: 100,
  generationSpacing: 200
}

export function calculateFamilyTreeLayout(
  treeNodes: TreeNode[],
  people: Person[],
  relationships: Relationship[],
  config: LayoutConfig = defaultConfig
): LayoutNode[] {
  if (treeNodes.length === 0 && people.length === 0) return []

  // If no tree structure exists, group unconnected people nicely
  if (treeNodes.length === 0) {
    return layoutUnconnectedPeopleWithGroups(people, config)
  }

  const layoutNodes: LayoutNode[] = []
  
  // Group people by generations and family branches
  const familyGroups = createFamilyGroups(treeNodes, people, relationships)
  
  // Layout each generation
  familyGroups.forEach((group, generationIndex) => {
    const generationY = 100 + (generationIndex * config.generationSpacing)
    
    // Layout people within this generation
    const generationNodes = layoutGenerationGroup(group, generationY, config)
    layoutNodes.push(...generationNodes)
  })

  // Add any remaining unconnected people
  const connectedPersonIds = new Set(layoutNodes.map(n => n.person.id))
  const unconnectedPeople = people.filter(p => !connectedPersonIds.has(p.id))
  
  if (unconnectedPeople.length > 0) {
    const lastGenerationY = familyGroups.length * config.generationSpacing + 200
    const unconnectedLayout = layoutUnconnectedPeopleWithGroups(
      unconnectedPeople, 
      config, 
      lastGenerationY
    )
    layoutNodes.push(...unconnectedLayout)
  }

  return layoutNodes
}

function createFamilyGroups(
  treeNodes: TreeNode[],
  people: Person[],
  relationships: Relationship[]
): FamilyGroup[] {
  const groups: FamilyGroup[] = []
  const processedPeople = new Set<string>()
  
  // Process each tree node to determine generations
  treeNodes.forEach(rootNode => {
    const generations = extractGenerations(rootNode, 0)
    
    generations.forEach(([level, people]) => {
      if (people.length === 0) return
      
      // Group by family branches within generation
      const branches = groupByFamilyBranch(people, relationships)
      
      branches.forEach((branchPeople, branchName) => {
        groups.push({
          generation: level,
          branch: branchName,
          people: branchPeople,
          x: 0,
          y: 0,
          width: 0,
          height: 0
        })
        
        branchPeople.forEach(p => processedPeople.add(p.id))
      })
    })
  })
  
  // Sort by generation level
  return groups.sort((a, b) => a.generation - b.generation)
}

function extractGenerations(node: TreeNode, level: number): [number, Person[]][] {
  const generations: Map<number, Person[]> = new Map()
  
  function traverse(currentNode: TreeNode, currentLevel: number) {
    if (!generations.has(currentLevel)) {
      generations.set(currentLevel, [])
    }
    generations.get(currentLevel)!.push(currentNode.person)
    
    // Add spouses at the same level
    currentNode.spouses.forEach(spouse => {
      generations.get(currentLevel)!.push(spouse)
    })
    
    // Process children at next level
    currentNode.children.forEach(child => {
      traverse(child, currentLevel + 1)
    })
  }
  
  traverse(node, level)
  return Array.from(generations.entries())
}

function groupByFamilyBranch(
  people: Person[], 
  relationships: Relationship[]
): Map<string, Person[]> {
  const branches = new Map<string, Person[]>()
  
  // Simple grouping by surname for now
  people.forEach(person => {
    const branchKey = person.surname || person.full_name.split(' ').pop() || 'Unknown'
    
    if (!branches.has(branchKey)) {
      branches.set(branchKey, [])
    }
    branches.get(branchKey)!.push(person)
  })
  
  return branches
}

function layoutGenerationGroup(
  group: FamilyGroup,
  baseY: number,
  config: LayoutConfig
): LayoutNode[] {
  const nodes: LayoutNode[] = []
  const peoplePerRow = Math.max(1, Math.floor(1200 / (config.nodeWidth + config.horizontalSpacing)))
  
  group.people.forEach((person, index) => {
    const row = Math.floor(index / peoplePerRow)
    const col = index % peoplePerRow
    
    // Center the row
    const rowWidth = Math.min(group.people.length, peoplePerRow) * (config.nodeWidth + config.horizontalSpacing)
    const startX = -rowWidth / 2
    
    const x = startX + col * (config.nodeWidth + config.horizontalSpacing)
    const y = baseY + (row * (config.nodeHeight + config.verticalSpacing))
    
    nodes.push({
      id: person.id,
      person,
      children: [],
      spouses: [],
      x,
      y,
      level: group.generation,
      width: config.nodeWidth,
      height: config.nodeHeight
    })
  })
  
  return nodes
}

function layoutUnconnectedPeopleWithGroups(
  people: Person[],
  config: LayoutConfig,
  startY: number = 100
): LayoutNode[] {
  const nodes: LayoutNode[] = []
  
  // Group by birth decade for better organization
  const groups = new Map<string, Person[]>()
  
  people.forEach(person => {
    const decade = person.birth_year 
      ? `${Math.floor(person.birth_year / 10) * 10}s` 
      : 'Unknown Era'
    
    if (!groups.has(decade)) {
      groups.set(decade, [])
    }
    groups.get(decade)!.push(person)
  })
  
  let currentY = startY
  const groupSpacing = 150
  
  // Sort groups by decade
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
    if (a[0] === 'Unknown Era') return 1
    if (b[0] === 'Unknown Era') return -1
    return a[0].localeCompare(b[0])
  })
  
  sortedGroups.forEach(([decade, groupPeople]) => {
    const itemsPerRow = Math.max(1, Math.floor(1000 / (config.nodeWidth + config.horizontalSpacing)))
    const totalRows = Math.ceil(groupPeople.length / itemsPerRow)
    
    groupPeople.forEach((person, index) => {
      const row = Math.floor(index / itemsPerRow)
      const col = index % itemsPerRow
      
      // Center each row
      const itemsInThisRow = Math.min(itemsPerRow, groupPeople.length - row * itemsPerRow)
      const rowWidth = itemsInThisRow * (config.nodeWidth + config.horizontalSpacing)
      const startX = -rowWidth / 2 + (config.nodeWidth + config.horizontalSpacing) / 2
      
      const x = startX + col * (config.nodeWidth + config.horizontalSpacing)
      const y = currentY + (row * (config.nodeHeight + config.verticalSpacing))
      
      nodes.push({
        id: person.id,
        person,
        children: [],
        spouses: [],
        x,
        y,
        level: 999, // Special level for unconnected
        width: config.nodeWidth,
        height: config.nodeHeight
      })
    })
    
    currentY += totalRows * (config.nodeHeight + config.verticalSpacing) + groupSpacing
  })
  
  return nodes
}

export function centerLayout(nodes: LayoutNode[]): LayoutNode[] {
  if (nodes.length === 0) return nodes
  
  // Find bounds
  const minX = Math.min(...nodes.map(n => n.x))
  const maxX = Math.max(...nodes.map(n => n.x + n.width))
  const minY = Math.min(...nodes.map(n => n.y))
  
  // Center horizontally and ensure positive coordinates
  const centerOffsetX = -(minX + maxX) / 2
  const offsetY = Math.max(100, -minY + 100)
  
  return nodes.map(node => ({
    ...node,
    x: node.x + centerOffsetX + 600, // Add padding from left edge
    y: node.y + offsetY
  }))
}

export function detectCollisions(nodes: LayoutNode[]): boolean {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]
      const b = nodes[j]
      
      const buffer = 20 // Add buffer zone
      
      if (a.x < b.x + b.width + buffer &&
          a.x + a.width + buffer > b.x &&
          a.y < b.y + b.height + buffer &&
          a.y + a.height + buffer > b.y) {
        return true
      }
    }
  }
  return false
}

export function autoSpace(nodes: LayoutNode[], config: LayoutConfig): LayoutNode[] {
  // Simple collision resolution by spreading nodes horizontally
  const levelGroups = new Map<number, LayoutNode[]>()
  
  nodes.forEach(node => {
    if (!levelGroups.has(node.level)) {
      levelGroups.set(node.level, [])
    }
    levelGroups.get(node.level)!.push(node)
  })
  
  levelGroups.forEach(levelNodes => {
    levelNodes.sort((a, b) => a.x - b.x)
    
    for (let i = 1; i < levelNodes.length; i++) {
      const prev = levelNodes[i - 1]
      const curr = levelNodes[i]
      
      const minDistance = config.nodeWidth + config.horizontalSpacing
      const currentDistance = curr.x - (prev.x + prev.width)
      
      if (currentDistance < config.horizontalSpacing) {
        const adjustment = minDistance - currentDistance
        curr.x += adjustment
        
        // Adjust all subsequent nodes
        for (let j = i + 1; j < levelNodes.length; j++) {
          levelNodes[j].x += adjustment
        }
      }
    }
  })
  
  return nodes
}