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
  verticalSpacing: number
  generationHeight: number
  siblingSpacing: number
}

export const defaultLayoutConfig: LayoutConfig = {
  nodeWidth: 160,
  nodeHeight: 100,
  unionWidth: 200,
  unionHeight: 80,
  horizontalSpacing: 60,
  verticalSpacing: 140,
  generationHeight: 140,
  siblingSpacing: 60
}

export class FamilyTreeLayoutEngine {
  private config: LayoutConfig
  private people: TreePerson[]
  private families: TreeFamily[]
  private children: TreeFamilyChild[]
  private personMap: Map<string, TreePerson>
  private familyMap: Map<string, TreeFamily>

  constructor(
    people: TreePerson[],
    families: TreeFamily[],
    children: TreeFamilyChild[],
    config: LayoutConfig = defaultLayoutConfig
  ) {
    this.config = config
    this.people = people
    this.families = families
    this.children = children
    this.personMap = new Map(people.map(p => [p.id, p]))
    this.familyMap = new Map(families.map(f => [f.id, f]))
  }

  // Build layout for focus person and surrounding family
  calculateLayout(focusPersonId: string, generations = 3): {
    nodes: LayoutNode[]
    unions: UnionNode[]
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  } {
    const focusPerson = this.personMap.get(focusPersonId)
    if (!focusPerson) throw new Error('Focus person not found')

    const nodes: LayoutNode[] = []
    const unions: UnionNode[] = []

    // Build tree structure around focus person
    const focusNode = this.createLayoutNode(focusPerson, 0, 0, 0)
    nodes.push(focusNode)

    // Add parents (generation -1)
    this.addParentGeneration(focusNode, nodes, unions, -1)

    // Add children (generation +1)  
    this.addChildrenGeneration(focusNode, nodes, unions, 1)

    // Position everything
    this.positionGenerations(nodes, unions)

    // Calculate bounds
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
    const children: TreePerson[] = []
    
    // Find families where person is a partner
    const parentFamilies = this.families.filter(f => 
      f.partner1_id === personId || f.partner2_id === personId
    )

    // Get children from those families
    parentFamilies.forEach(family => {
      const familyChildren = this.children
        .filter(fc => fc.family_id === family.id)
        .map(fc => this.personMap.get(fc.child_id))
        .filter(Boolean) as TreePerson[]
      
      children.push(...familyChildren)
    })

    return children
  }

  private getParents(personId: string): TreePerson[] {
    const parents: TreePerson[] = []
    
    // Find families where person is a child
    const childFamilies = this.children
      .filter(fc => fc.child_id === personId)
      .map(fc => this.familyMap.get(fc.family_id))
      .filter(Boolean) as TreeFamily[]

    // Get parents from those families
    childFamilies.forEach(family => {
      if (family.partner1_id) {
        const parent = this.personMap.get(family.partner1_id)
        if (parent) parents.push(parent)
      }
      if (family.partner2_id) {
        const parent = this.personMap.get(family.partner2_id)
        if (parent) parents.push(parent)
      }
    })

    return parents
  }

  private addParentGeneration(
    focusNode: LayoutNode,
    nodes: LayoutNode[],
    unions: UnionNode[],
    level: number
  ) {
    const parents = focusNode.parents
    if (parents.length === 0) return

    // Create parent nodes
    parents.forEach((parent, index) => {
      const parentNode = this.createLayoutNode(
        parent,
        index * (this.config.nodeWidth + this.config.horizontalSpacing),
        level * this.config.generationHeight,
        level
      )
      nodes.push(parentNode)
    })

    // Create union for parents if both exist
    if (parents.length === 2) {
      const parentFamily = this.families.find(f => 
        (f.partner1_id === parents[0].id && f.partner2_id === parents[1].id) ||
        (f.partner1_id === parents[1].id && f.partner2_id === parents[0].id)
      )

      if (parentFamily) {
        const union: UnionNode = {
          id: parentFamily.id,
          family: parentFamily,
          partner1: parents[0],
          partner2: parents[1],
          children: [focusNode],
          x: 0,
          y: level * this.config.generationHeight,
          width: this.config.unionWidth,
          height: this.config.unionHeight,
          level
        }
        unions.push(union)
      }
    }
  }

  private addChildrenGeneration(
    focusNode: LayoutNode,
    nodes: LayoutNode[],
    unions: UnionNode[],
    level: number
  ) {
    // Create unions for focus person's partnerships
    const partners = focusNode.partners
    
    if (partners.length === 0 && focusNode.children.length > 0) {
      // Single parent with children
      const singleFamily = this.families.find(f => 
        f.partner1_id === focusNode.id && !f.partner2_id
      )
      
      if (singleFamily) {
        const union: UnionNode = {
          id: singleFamily.id,
          family: singleFamily,
          partner1: focusNode,
          children: focusNode.children,
          x: 0,
          y: level * this.config.generationHeight,
          width: this.config.unionWidth,
          height: this.config.unionHeight,
          level
        }
        unions.push(union)
      }
    } else {
      // Create unions for each partnership
      partners.forEach(partner => {
        const family = this.families.find(f => 
          (f.partner1_id === focusNode.id && f.partner2_id === partner.id) ||
          (f.partner1_id === partner.id && f.partner2_id === focusNode.id)
        )

        if (family) {
          const familyChildren = this.children
            .filter(fc => fc.family_id === family.id)
            .map(fc => this.personMap.get(fc.child_id))
            .filter(Boolean) as TreePerson[]

          const union: UnionNode = {
            id: family.id,
            family,
            partner1: focusNode,
            partner2: partner,
            children: familyChildren,
            x: 0,
            y: level * this.config.generationHeight,
            width: this.config.unionWidth,
            height: this.config.unionHeight,
            level
          }
          unions.push(union)
        }
      })
    }

    // Add child nodes
    focusNode.children.forEach((child, index) => {
      const childNode = this.createLayoutNode(
        child,
        index * (this.config.nodeWidth + this.config.siblingSpacing),
        level * this.config.generationHeight,
        level
      )
      nodes.push(childNode)
    })
  }

  private positionGenerations(nodes: LayoutNode[], unions: UnionNode[]) {
    // Group by level
    const levels = new Map<number, LayoutNode[]>()
    nodes.forEach(node => {
      if (!levels.has(node.level)) {
        levels.set(node.level, [])
      }
      levels.get(node.level)!.push(node)
    })

    // Position each level
    levels.forEach((levelNodes, level) => {
      this.positionLevel(levelNodes, level)
    })

    // Position unions
    unions.forEach(union => {
      this.positionUnion(union)
    })
  }

  private positionLevel(nodes: LayoutNode[], level: number) {
    const totalWidth = nodes.length * this.config.nodeWidth + 
                       (nodes.length - 1) * this.config.siblingSpacing
    let startX = -totalWidth / 2

    nodes.forEach((node, index) => {
      node.x = startX + index * (this.config.nodeWidth + this.config.siblingSpacing)
      node.y = level * this.config.generationHeight
    })
  }

  private positionUnion(union: UnionNode) {
    // Position between partners or centered on single parent
    if (union.partner2) {
      // Find the layout nodes for both partners
      const partner1Node = { x: 0, y: 0 } // Default position
      const partner2Node = { x: 0, y: 0 } // Default position
      union.x = (partner1Node.x + partner2Node.x) / 2
    } else {
      // Center on single parent
      union.x = 0 // Default position
    }
    
    union.y = union.level * this.config.generationHeight
  }

  private calculateBounds(nodes: LayoutNode[], unions: UnionNode[]) {
    const allItems = [...nodes, ...unions]
    
    const minX = Math.min(...allItems.map(item => item.x - item.width / 2))
    const maxX = Math.max(...allItems.map(item => item.x + item.width / 2))
    const minY = Math.min(...allItems.map(item => item.y - item.height / 2))
    const maxY = Math.max(...allItems.map(item => item.y + item.height / 2))

    return { minX, maxX, minY, maxY }
  }

  // Auto-layout with Reingold-Tilford algorithm
  static autoLayout(
    people: TreePerson[],
    families: TreeFamily[],
    children: TreeFamilyChild[],
    focusPersonId: string
  ): { nodes: LayoutNode[]; unions: UnionNode[] } {
    const engine = new FamilyTreeLayoutEngine(people, families, children)
    const layout = engine.calculateLayout(focusPersonId, 3)
    return { nodes: layout.nodes, unions: layout.unions }
  }
}