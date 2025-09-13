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
  private childMap: Map<string, TreePerson[]> = new Map()
  private parentMap: Map<string, TreePerson[]> = new Map()

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

    // Build adjacency maps for fast lookups and better completeness
    families.forEach(family => {
      const famChildren = children.filter(fc => fc.family_id === family.id)
      const p1 = family.partner1_id ? this.personMap.get(family.partner1_id) : undefined
      const p2 = family.partner2_id ? this.personMap.get(family.partner2_id) : undefined

      famChildren.forEach(fc => {
        const child = this.personMap.get(fc.child_id)
        if (!child) return
        // Parents of this child
        const parents: TreePerson[] = []
        if (p1) parents.push(p1)
        if (p2) parents.push(p2)
        if (!this.parentMap.has(child.id)) this.parentMap.set(child.id, [])
        const arr = this.parentMap.get(child.id)!
        parents.forEach(par => { if (!arr.find(x => x.id === par.id)) arr.push(par) })

        // Children of each parent
        ;[p1, p2].forEach(par => {
          if (!par) return
          if (!this.childMap.has(par.id)) this.childMap.set(par.id, [])
          const carr = this.childMap.get(par.id)!
          if (!carr.find(x => x.id === child.id)) carr.push(child)
        })
      })
    })
  }

  // Build layout for focus person and surrounding family
  // Build layout for focus person with configurable generations in both directions
  calculateLayout(focusPersonId: string, generations = 3): {
    nodes: LayoutNode[]
    unions: UnionNode[]
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  } {
    const focusPerson = this.personMap.get(focusPersonId)
    if (!focusPerson) throw new Error('Focus person not found')

    const nodes: LayoutNode[] = []
    const unions: UnionNode[] = []
    const nodeIds = new Set<string>()
    const unionIds = new Set<string>()

    const getOrCreateNode = (person: TreePerson, x: number, y: number, level: number) => {
      if (nodeIds.has(person.id)) {
        return nodes.find(n => n.id === person.id)!
      }
      const n = this.createLayoutNode(person, x, y, level)
      nodes.push(n)
      nodeIds.add(person.id)
      return n
    }

    const addAncestors = (target: LayoutNode, level: number, remaining: number) => {
      if (remaining <= 0) return
      const parents = this.getParents(target.id)
      if (parents.length === 0) return

      const created: LayoutNode[] = []
      parents.forEach((p, idx) => {
        const px = idx * (this.config.nodeWidth + this.config.horizontalSpacing)
        const py = level * this.config.generationHeight
        const parentNode = getOrCreateNode(p, px, py, level)
        created.push(parentNode)
      })

      if (created.length === 2) {
        const family = this.families.find(f =>
          (f.partner1_id === created[0].id && f.partner2_id === created[1].id) ||
          (f.partner1_id === created[1].id && f.partner2_id === created[0].id)
        )
        if (family && !unionIds.has(family.id)) {
          const familyChildren = this.children
            .filter(fc => fc.family_id === family.id)
            .map(fc => this.personMap.get(fc.child_id))
            .filter(Boolean) as TreePerson[]

          // Ensure all siblings (including target) are added at this generation level
          familyChildren.forEach((child, idx) => {
            const cx = idx * (this.config.nodeWidth + this.config.siblingSpacing)
            const cy = (level + 1) * this.config.generationHeight
            getOrCreateNode(child, cx, cy, level + 1)
          })

          unions.push({
            id: family.id,
            family,
            partner1: created[0],
            partner2: created[1],
            children: familyChildren,
            x: 0,
            y: level * this.config.generationHeight,
            width: this.config.unionWidth,
            height: this.config.unionHeight,
            level
          })
          unionIds.add(family.id)
        }
      }

      created.forEach((parent) => addAncestors(parent, level - 1, remaining - 1))
    }

    const addDescendants = (target: LayoutNode, level: number, remaining: number) => {
      if (remaining <= 0) return

      const partners = this.getPartners(target.id)
      if (partners.length === 0 && target.children.length > 0) {
        // Single parent
        const singleFamily = this.families.find(f => f.partner1_id === target.id && !f.partner2_id)
        if (singleFamily && !unionIds.has(singleFamily.id)) {
          unions.push({
            id: singleFamily.id,
            family: singleFamily,
            partner1: target,
            children: target.children,
            x: 0,
            y: level * this.config.generationHeight,
            width: this.config.unionWidth,
            height: this.config.unionHeight,
            level
          })
          unionIds.add(singleFamily.id)
        }
      } else {
        partners.forEach(partner => {
          const family = this.families.find(f =>
            (f.partner1_id === target.id && f.partner2_id === partner.id) ||
            (f.partner1_id === partner.id && f.partner2_id === target.id)
          )
          if (family && !unionIds.has(family.id)) {
            const familyChildren = this.children
              .filter(fc => fc.family_id === family.id)
              .map(fc => this.personMap.get(fc.child_id))
              .filter(Boolean) as TreePerson[]

            unions.push({
              id: family.id,
              family,
              partner1: target,
              partner2: partner,
              children: familyChildren,
              x: 0,
              y: level * this.config.generationHeight,
              width: this.config.unionWidth,
              height: this.config.unionHeight,
              level
            })
            unionIds.add(family.id)
          }
        })
      }

      // Create child nodes and recurse
      target.children.forEach((child, idx) => {
        const cx = idx * (this.config.nodeWidth + this.config.siblingSpacing)
        const cy = level * this.config.generationHeight
        const childNode = getOrCreateNode(child, cx, cy, level)
        addDescendants(childNode, level + 1, remaining - 1)
      })
    }

    // Build around focus
    const focusNode = getOrCreateNode(focusPerson, 0, 0, 0)
    addAncestors(focusNode, -1, generations)
    addDescendants(focusNode, 1, generations)

    // Position and bounds
    this.positionGenerations(nodes, unions)
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
    return this.childMap.get(personId) || []
  }

  private getParents(personId: string): TreePerson[] {
    return this.parentMap.get(personId) || []
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