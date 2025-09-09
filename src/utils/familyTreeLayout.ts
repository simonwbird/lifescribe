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
}

const defaultConfig: LayoutConfig = {
  nodeWidth: 200,
  nodeHeight: 120,
  horizontalSpacing: 50,
  verticalSpacing: 80,
  levelHeight: 200
}

export function calculateFamilyTreeLayout(
  treeNodes: TreeNode[],
  people: Person[],
  relationships: Relationship[],
  config: LayoutConfig = defaultConfig
): LayoutNode[] {
  if (treeNodes.length === 0 && people.length === 0) return []

  // Convert all people to layout nodes if no tree structure exists
  if (treeNodes.length === 0) {
    return layoutUnconnectedPeople(people, config)
  }

  const layoutNodes: LayoutNode[] = []
  let currentY = 100

  // Process each root node
  treeNodes.forEach((rootNode, rootIndex) => {
    const rootLayout = processNodeHierarchy(rootNode, 0, currentY, config)
    layoutNodes.push(...rootLayout.nodes)
    currentY = rootLayout.maxY + config.levelHeight
  })

  // Add unconnected people at the bottom
  const connectedPersonIds = new Set(layoutNodes.map(n => n.person.id))
  const unconnectedPeople = people.filter(p => !connectedPersonIds.has(p.id))
  
  if (unconnectedPeople.length > 0) {
    const unconnectedLayout = layoutUnconnectedPeople(
      unconnectedPeople, 
      config, 
      currentY + config.levelHeight
    )
    layoutNodes.push(...unconnectedLayout)
  }

  return layoutNodes
}

function processNodeHierarchy(
  node: TreeNode,
  level: number,
  startY: number,
  config: LayoutConfig
): { nodes: LayoutNode[]; maxY: number; width: number } {
  const nodes: LayoutNode[] = []
  
  // Calculate this level's Y position
  const currentY = startY + (level * config.levelHeight)
  
  // Process children first to determine width requirements
  let childrenResults: Array<{ nodes: LayoutNode[]; maxY: number; width: number }> = []
  let totalChildrenWidth = 0
  
  if (node.children.length > 0) {
    node.children.forEach(child => {
      const childResult = processNodeHierarchy(child, level + 1, startY, config)
      childrenResults.push(childResult)
      totalChildrenWidth += childResult.width
    })
    
    // Add spacing between children
    totalChildrenWidth += (node.children.length - 1) * config.horizontalSpacing
  }

  // Determine node width (minimum node width or children width)
  const nodeWidth = Math.max(config.nodeWidth, totalChildrenWidth)
  
  // Position this node
  const nodeX = 0 // Will be adjusted later based on parent positioning
  
  const layoutNode: LayoutNode = {
    ...node,
    x: nodeX,
    y: currentY,
    level,
    width: config.nodeWidth,
    height: config.nodeHeight
  }
  
  nodes.push(layoutNode)
  
  // Position children centered under this node
  if (childrenResults.length > 0) {
    let childX = -(totalChildrenWidth / 2) + (childrenResults[0].width / 2)
    
    childrenResults.forEach((childResult, index) => {
      // Adjust all child nodes' X positions
      childResult.nodes.forEach(childNode => {
        childNode.x += childX
      })
      
      nodes.push(...childResult.nodes)
      
      // Move to next child position
      if (index < childrenResults.length - 1) {
        childX += childResult.width + config.horizontalSpacing
      }
    })
  }
  
  const maxY = Math.max(currentY, ...childrenResults.map(r => r.maxY))
  
  return {
    nodes,
    maxY: maxY + config.nodeHeight,
    width: nodeWidth
  }
}

function layoutUnconnectedPeople(
  people: Person[],
  config: LayoutConfig,
  startY: number = 100
): LayoutNode[] {
  const nodes: LayoutNode[] = []
  const itemsPerRow = Math.max(1, Math.floor(1200 / (config.nodeWidth + config.horizontalSpacing)))
  
  people.forEach((person, index) => {
    const row = Math.floor(index / itemsPerRow)
    const col = index % itemsPerRow
    
    const x = col * (config.nodeWidth + config.horizontalSpacing) - 
              ((itemsPerRow - 1) * (config.nodeWidth + config.horizontalSpacing) / 2)
    const y = startY + (row * config.levelHeight)
    
    nodes.push({
      id: person.id,
      person,
      children: [],
      spouses: [],
      x,
      y,
      level: 0,
      width: config.nodeWidth,
      height: config.nodeHeight
    })
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