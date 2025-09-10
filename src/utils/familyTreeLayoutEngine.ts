import type { Person, Relationship } from '@/lib/familyTreeTypes'
import { validateFamily } from './validateFamily'

export interface LayoutNode {
  person: Person
  x: number
  y: number
  depth: number
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
  depth: number
  branchColor: string
  explicit: boolean
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
  gridX: number
  gridY: number
  spouseGap: number
  siblingGap: number
  childGap: number
  padding: number
  minGap: number
}

const DEFAULT_CONFIG: LayoutConfig = {
  personWidth: 160,
  personHeight: 100,
  gridX: 220,
  gridY: 170,
  spouseGap: 40,
  siblingGap: 40,
  childGap: 180,
  padding: 100,
  minGap: 40
}

// Color palette for family branches
const BRANCH_COLORS = [
  '#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#14B8A6',
  '#EF4444', '#EAB308', '#EC4899', '#6366F1', '#84CC16'
]

interface PersonWithDepth {
  person: Person
  depth: number
  subtreeWidth: number
}

interface MarriageNode {
  id: string
  parentA?: Person
  parentB?: Person
  children: Person[]
  x: number
  y: number
  depth: number
  subtreeWidth: number
  explicit: boolean
}

export class FamilyTreeLayoutEngine {
  private config: LayoutConfig
  private childrenMap = new Map<string, string[]>()
  private parentsMap = new Map<string, string[]>()
  private spouseMap = new Map<string, string[]>()
  private branchColors = new Map<string, string>()
  private peopleById = new Map<string, Person>()
  private explicitSpouseSet = new Set<string>()

  constructor(config: Partial<LayoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  public generateLayout(people: Person[], relationships: Relationship[]): LayoutResult {
    console.log('=== FamilyTreeLayoutEngine.generateLayout ===')
    console.log('People:', people.map(p => `${p.full_name} (${p.id})`))
    console.log('Relationships:', relationships.map(r => `${r.from_person_id} --${r.relationship_type}--> ${r.to_person_id}`))

    // Validate family data before processing
    const validationErrors = validateFamily(people, relationships)
    if (validationErrors.length) {
      console.warn('Family data issues:\n' + validationErrors.join('\n'))
    }

    // Clear previous state
    this.childrenMap.clear()
    this.parentsMap.clear()
    this.spouseMap.clear()
    this.branchColors.clear()
    this.peopleById.clear()
    this.explicitSpouseSet.clear()

    // Index people by ID
    people.forEach(p => this.peopleById.set(p.id, p))

    // Step 1: Build relationship maps and marriages
    this.buildRelationshipMaps(relationships)
    const marriages = this.buildMarriageNodes(people)

    // Step 2: Assign generation depths using ancestry BFS (not birth years)
    const depths = this.assignDepthsByAncestry(people, marriages)
    
    // Step 2.5: Force spouses to same depth, re-enforce constraints, normalize
    // 1) keep spouses at the SAME depth (row)
    const forceSpousesSameDepth = () => {
      // move both spouses to the shallower (smaller) depth
      this.spouseMap.forEach((spouses, aId) => {
        const a = depths.get(aId) ?? 0;
        spouses.forEach(bId => {
          const b = depths.get(bId) ?? a;
          const target = Math.min(a, b);
          if ((depths.get(aId) ?? 0) !== target) depths.set(aId, target);
          if ((depths.get(bId) ?? 0) !== target) depths.set(bId, target);
        });
      });
    };
    forceSpousesSameDepth();

    // 2) children must be STRICTLY below their deepest parent
    this.enforceParentChildConstraints(people, marriages, depths);

    // 3) normalize so oldest generation is always depth 0 (top row)
    const allDepths = Array.from(depths.values());
    const minDepth = Math.min(...allDepths);
    if (isFinite(minDepth) && minDepth !== 0) {
      depths.forEach((d, id) => depths.set(id, d - minDepth));
    }

    // marriages live on the SAME row as their parents' pair
    marriages.forEach(m => {
      const da = m.parentA ? (depths.get(m.parentA.id) ?? 0) : 0;
      const db = m.parentB ? (depths.get(m.parentB.id) ?? da) : da;
      m.depth = Math.min(da, db); // important: MIN, not max
    });

    // one more pass to ensure all children are below the union row
    this.enforceParentChildConstraints(people, marriages, depths);

    // and normalize again to keep the top at 0
    {
      const vals = Array.from(depths.values());
      const m = Math.min(...vals);
      if (isFinite(m) && m !== 0) depths.forEach((d, id) => depths.set(id, d - m));
    }

    // Step 3: Calculate subtree widths (bottom-up)
    this.calculateSubtreeWidths(people, marriages, depths)

    // Step 4: Assign branch colors
    this.assignBranchColors(people, depths)

    // Step 5: Calculate positions using org-chart algorithm
    const positions = this.calculateOrgChartPositions(people, marriages, depths)

    // Step 6: Create layout nodes
    const nodes = this.createLayoutNodes(people, positions, depths)
    const marriageNodes = this.createMarriageLayout(marriages, positions)

    // Step 7: Calculate dimensions
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
        const a = rel.from_person_id
        const b = rel.to_person_id
        const key = [a, b].sort().join('-')
        this.explicitSpouseSet.add(key) // mark as explicit spouse pair
        
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

  private buildMarriageNodes(people: Person[]): MarriageNode[] {
    const marriages = new Map<string, MarriageNode>()
    
    // First, create marriages from spouse relationships (explicit)
    people.forEach(person => {
      const spouses = this.spouseMap.get(person.id) || []
      spouses.forEach(spouseId => {
        // Create consistent marriage ID (smaller ID first)
        const sortedIds = [person.id, spouseId].sort()
        const marriageId = sortedIds.join('-')
        
        if (!marriages.has(marriageId)) {
          const parentA = this.peopleById.get(sortedIds[0])
          const parentB = this.peopleById.get(sortedIds[1])
          
          marriages.set(marriageId, {
            id: marriageId,
            parentA,
            parentB,
            children: [],
            x: 0,
            y: 0,
            depth: 0,
            subtreeWidth: 0,
            explicit: this.explicitSpouseSet.has(marriageId)
          })
        }
      })
    })
    
    // Children always belong to the *union* of their parents
    people.forEach(person => {
      const parents = this.parentsMap.get(person.id) || []
      if (parents.length === 0) return

      const sortedParents = [...parents].sort()
      const marriageId = sortedParents.join('-')

      // If parents are not marked spouses, still create a pseudo-marriage
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
          depth: 0,
          subtreeWidth: 0,
          explicit: this.explicitSpouseSet.has(marriageId),
        })
      }

      // Always attach child to the union node, not a single parent
      const marriage = marriages.get(marriageId)!
      if (!marriage.children.some(c => c.id === person.id)) {
        marriage.children.push(person)
      }
    })

    return Array.from(marriages.values())
  }

  private assignDepthsByAncestry(people: Person[], marriages: MarriageNode[]): Map<string, number> {
    const depths = new Map<string, number>()
    const visited = new Set<string>()

    console.log('=== DEPTH ASSIGNMENT DEBUG ===')
    console.log('People:', people.map(p => `${p.full_name} (${p.id})`))
    console.log('ParentsMap:', Array.from(this.parentsMap.entries()))
    console.log('ChildrenMap:', Array.from(this.childrenMap.entries()))

    // Find TRUE root people (those with no parents) - these are Generation 1 (depth 0)
    const rootPeople = people.filter(p => {
      const parents = this.parentsMap.get(p.id) || []
      return parents.length === 0
    })
    
    console.log('Root people (no parents):', rootPeople.map(p => p.full_name))
    
    if (rootPeople.length === 0 && people.length > 0) {
      // Fallback: if circular or no clear roots, pick oldest by birth year
      const sorted = people.filter(p => p.birth_year).sort((a, b) => (a.birth_year || 9999) - (b.birth_year || 9999))
      if (sorted.length > 0) {
        rootPeople.push(sorted[0])
        console.log('No true roots found, using oldest by birth year:', sorted[0].full_name)
      } else {
        rootPeople.push(people[0]) // Ultimate fallback
        console.log('No birth years, using first person:', people[0].full_name)
      }
    }

    // BFS from root ancestors - they start at depth 0 (Generation 1 - TOP ROW)
    const queue: Array<{ person: Person; depth: number }> = []
    
    // Start with root people at depth 0 (Generation 1 - TOP)
    rootPeople.forEach(person => {
      console.log(`Setting ROOT ${person.full_name} to depth 0 (TOP Generation)`)
      depths.set(person.id, 0)
      visited.add(person.id)
      queue.push({ person, depth: 0 })
    })

    while (queue.length > 0) {
      const { person, depth } = queue.shift()!
      console.log(`Processing ${person.full_name} at depth ${depth}`)
      
      // Handle spouses FIRST (same generation as current person)
      const spouses = this.spouseMap.get(person.id) || []
      console.log(`  Spouses of ${person.full_name}:`, spouses.map(id => this.peopleById.get(id)?.full_name))
      
      spouses.forEach(spouseId => {
        const spouse = this.peopleById.get(spouseId)
        if (spouse && !visited.has(spouse.id)) {
          console.log(`  Setting spouse ${spouse.full_name} to depth ${depth} (same generation)`)
          depths.set(spouse.id, depth) // Same generation as spouse
          visited.add(spouse.id)
          queue.push({ person: spouse, depth })
        }
      })

      // Process direct children AFTER spouses (ancestry-based, not age-based)
      const children = this.childrenMap.get(person.id) || []
      console.log(`  Children of ${person.full_name}:`, children.map(id => this.peopleById.get(id)?.full_name))
      
      children.forEach(childId => {
        const child = this.peopleById.get(childId)
        if (child && !visited.has(child.id)) {
          const childDepth = depth + 1
          console.log(`  Setting child ${child.full_name} to depth ${childDepth} (one generation below parent)`)
          depths.set(child.id, childDepth)
          visited.add(child.id)
          queue.push({ person: child, depth: childDepth })
        }
      })
    }

    // Handle any remaining unvisited people (disconnected components)
    people.forEach(person => {
      if (!visited.has(person.id)) {
        console.log(`Orphaned person ${person.full_name} assigned to depth 0`)
        depths.set(person.id, 0) // Put orphaned people in top generation
      }
    })

    // Enforce parent-child constraints (children must be deeper than parents)
    this.enforceParentChildConstraints(people, marriages, depths)

    // Final pass: ensure roots stay at depth 0 and fix any inversion
    const roots = people.filter(p => (this.parentsMap.get(p.id) || []).length === 0)
    roots.forEach(r => depths.set(r.id, 0)) // force roots to depth 0

    // Make sure every child is at least one deeper than max parent
    people.forEach(p => {
      const ps = this.parentsMap.get(p.id) || []
      if (ps.length) {
        const minDepth = Math.max(...ps.map(id => depths.get(id) ?? 0)) + 1
        if ((depths.get(p.id) ?? 0) < minDepth) depths.set(p.id, minDepth)
      }
    })

    // Normalize depths so the topmost generation is depth 0
    const allDepths = Array.from(depths.values())
    const minDepth = Math.min(...allDepths)
    if (minDepth !== 0 && isFinite(minDepth)) {
      depths.forEach((d, id) => depths.set(id, d - minDepth))
    }

    // Final debug guard against inverted trees
    people.forEach(p => {
      const ps = this.parentsMap.get(p.id) || []
      if (ps.length) {
        const maxParentDepth = Math.max(...ps.map(id => depths.get(id) ?? 0))
        if ((depths.get(p.id) ?? 0) <= maxParentDepth) {
          console.warn(`[DepthFix] Bumping ${p.full_name} below parents: ${maxParentDepth+1}`)
          depths.set(p.id, maxParentDepth + 1)
        }
      }
    })

    // Log final depths
    console.log('Final depths:')
    Array.from(depths.entries()).forEach(([id, depth]) => {
      const person = this.peopleById.get(id)
      console.log(`  ${person?.full_name}: Generation ${depth + 1} (depth ${depth})`)
    })

    // Set marriage depths to match parents (marriages are at same level as parents)
    marriages.forEach(marriage => {
      if (marriage.parentA) {
        marriage.depth = depths.get(marriage.parentA.id) || 0
      }
      if (marriage.parentB && marriage.parentA) {
        // Both parents should be at same depth, use max for safety
        marriage.depth = Math.max(
          depths.get(marriage.parentA.id) || 0,
          depths.get(marriage.parentB.id) || 0
        )
      }
    })

    return depths
  }

  private enforceParentChildConstraints(people: Person[], marriages: MarriageNode[], depths: Map<string, number>) {
    let changed = true
    while (changed) {
      changed = false
      
      people.forEach(person => {
        const parents = this.parentsMap.get(person.id) || []
        if (parents.length > 0) {
          const maxParentDepth = Math.max(...parents.map(pid => depths.get(pid) || 0))
          const currentDepth = depths.get(person.id) || 0
          
          if (currentDepth <= maxParentDepth) {
            depths.set(person.id, maxParentDepth + 1)
            changed = true
          }
        }
      })
    }
  }

  private calculateSubtreeWidths(people: Person[], marriages: MarriageNode[], depths: Map<string, number>) {
    // Calculate from bottom up
    const maxDepth = Math.max(...Array.from(depths.values()))
    
    for (let depth = maxDepth; depth >= 0; depth--) {
      // Process people at this depth
      people.filter(p => depths.get(p.id) === depth).forEach(person => {
        const children = this.childrenMap.get(person.id) || []
        if (children.length === 0) {
          // Leaf node
          return
        }

        // Find marriage containing these children
        const marriage = marriages.find(m => 
          (m.parentA?.id === person.id || m.parentB?.id === person.id) &&
          m.children.some(c => children.includes(c.id))
        )

        if (marriage) {
          // Marriage width is sum of children widths
          marriage.subtreeWidth = Math.max(
            1,
            marriage.children.length * this.config.childGap / this.config.gridX
          )
        }
      })
    }
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

  private calculateOrgChartPositions(
    people: Person[],
    marriages: {
      id: string
      parentA?: Person
      parentB?: Person
      children: Person[]
      x: number
      y: number
      depth: number
      subtreeWidth: number
      explicit: boolean
    }[],
    depths: Map<string, number>
  ): Map<string, { x: number; y: number }> {
    const pos = new Map<string, { x: number; y: number }>();

    // 1) Group people by generation (depth)
    const generations = new Map<number, Person[]>();
    people.forEach(p => {
      const d = depths.get(p.id) ?? 0;
      if (!generations.has(d)) generations.set(d, []);
      generations.get(d)!.push(p);
    });

    // 2) Place spouse pairs and singles left→right per generation
    const rowEntries = Array.from(generations.entries()).sort(([a], [b]) => a - b);
    rowEntries.forEach(([depth, genPeople]) => {
      const yTop = depth * this.config.gridY;                     // card top Y
      const unionY = yTop + this.config.personHeight / 2;        // union bar Y

      const processed = new Set<string>();
      const pairs: Array<{ m: any; people: Person[] }> = [];
      const singles: Person[] = [];

      const currMarriages = marriages.filter(m => m.depth === depth);

      // collect spouse pairs present in this row
      currMarriages.forEach(m => {
        const arr: Person[] = [];
        if (m.parentA && genPeople.includes(m.parentA)) { arr.push(m.parentA); processed.add(m.parentA.id); }
        if (m.parentB && genPeople.includes(m.parentB)) { arr.push(m.parentB); processed.add(m.parentB.id); }
        if (arr.length) pairs.push({ m, people: arr });
      });

      // remaining singles
      genPeople.forEach(p => { if (!processed.has(p.id)) singles.push(p); });

      // Positioning
      let x = this.config.padding;

      // spouse pairs first (keeps unions stable)
      pairs.forEach(({ m, people }) => {
        if (people.length === 2) {
          const [A, B] = people;
          const xA = x;
          const xB = x + this.config.personWidth + this.config.spouseGap;

          pos.set(A.id, { x: xA, y: yTop });
          pos.set(B.id, { x: xB, y: yTop });

          // union midpoint between card CENTERS
          const cA = xA + this.config.personWidth / 2;
          const cB = xB + this.config.personWidth / 2;
          m.x = (cA + cB) / 2;
          m.y = unionY;

          x += (this.config.personWidth * 2) + this.config.spouseGap + this.config.siblingGap;
        } else if (people.length === 1) {
          // single parent union sits at center of the card
          const P = people[0];
          pos.set(P.id, { x, y: yTop });
          m.x = x + this.config.personWidth / 2;
          m.y = unionY;

          x += this.config.personWidth + this.config.siblingGap;
        }
      });

      // then singles
      singles.forEach(P => {
        pos.set(P.id, { x, y: yTop });
        x += this.config.personWidth + this.config.siblingGap;
      });
    });

    // 3) Children pass — ALWAYS centered under union midpoint
    marriages.forEach(m => {
      if (!m.children.length) return;
      const dChild = m.depth + 1;
      const yTop = dChild * this.config.gridY;
      const cx = m.x; // union midpoint

      if (m.children.length === 1) {
        const c = m.children[0];
        pos.set(c.id, { x: cx - this.config.personWidth / 2, y: yTop });
      } else {
        const n = m.children.length;
        const span = (n - 1) * this.config.childGap;                     // span between centers
        let center = cx - span / 2;                                      // first child center
        m.children.forEach(child => {
          pos.set(child.id, { x: center - this.config.personWidth / 2, y: yTop });
          center += this.config.childGap;
        });
      }
    });

    // 4) Resolve horizontal collisions within each row
    const rowsForCollision = new Map<number, Person[]>();
    people.forEach(p => {
      const d = depths.get(p.id) ?? 0;
      if (!rowsForCollision.has(d)) rowsForCollision.set(d, []);
      rowsForCollision.get(d)!.push(p);
    });

    rowsForCollision.forEach(rowPeople => {
      const items = rowPeople
        .map(p => ({ p, pos: pos.get(p.id)! }))
        .filter(x => x.pos)
        .sort((a, b) => a.pos.x - b.pos.x);

      const minGap = this.config.personWidth + this.config.minGap;

      for (let i = 1; i < items.length; i++) {
        const prev = items[i - 1];
        const curr = items[i];
        const gap = curr.pos.x - prev.pos.x;
        if (gap < minGap) {
          const shift = minGap - gap;
          for (let j = i; j < items.length; j++) {
            const it = items[j];
            const np = { x: it.pos.x + shift, y: it.pos.y };
            pos.set(it.p.id, np);
            it.pos = np;
          }
        }
      }
    });

    // 5) Re-center children UNDER unions again (collisions may have shifted parents)
    marriages.forEach(m => {
      if (!m.children.length) return;
      const dChild = m.depth + 1;
      const yTop = dChild * this.config.gridY;

      // recompute union midpoint from spouse positions (in case they moved)
      const ax = m.parentA ? pos.get(m.parentA.id) : undefined;
      const bx = m.parentB ? pos.get(m.parentB.id) : undefined;
      if (ax && bx) {
        const cA = ax.x + this.config.personWidth / 2;
        const cB = bx.x + this.config.personWidth / 2;
        m.x = (cA + cB) / 2;
      }
      const cx = m.x;

      if (m.children.length === 1) {
        const c = m.children[0];
        pos.set(c.id, { x: cx - this.config.personWidth / 2, y: yTop });
      } else {
        const n = m.children.length;
        const span = (n - 1) * this.config.childGap;
        let center = cx - span / 2;
        m.children.forEach(child => {
          pos.set(child.id, { x: center - this.config.personWidth / 2, y: yTop });
          center += this.config.childGap;
        });
      }
    });

    return pos;
  }

  private resolveCollisions(positions: Map<string, { x: number; y: number }>, generations: Map<number, Person[]>) {
    // For each generation, ensure no overlaps
    generations.forEach(genPeople => {
      const genPositions = genPeople
        .map(p => ({ person: p, pos: positions.get(p.id)! }))
        .filter(item => item.pos)
        .sort((a, b) => a.pos.x - b.pos.x)
      
      const minSpacing = this.config.personWidth + this.config.minGap
      
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
      const depth = depths.get(person.id) || 0
      
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
        depth,
        branchColor: this.branchColors.get(person.id) || BRANCH_COLORS[0],
        spouses,
        children,
        parents
      }
    })
  }

  private createMarriageLayout(marriages: MarriageNode[], positions: Map<string, { x: number; y: number }>): Marriage[] {
    return marriages.map(marriage => ({
      id: marriage.id,
      parentA: marriage.parentA,
      parentB: marriage.parentB,
      children: marriage.children,
      x: marriage.x,
      y: marriage.y,
      depth: marriage.depth,
      branchColor: marriage.parentA 
        ? this.branchColors.get(marriage.parentA.id) || BRANCH_COLORS[0]
        : BRANCH_COLORS[0],
      explicit: marriage.explicit
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