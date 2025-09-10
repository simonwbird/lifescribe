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
  personWidth: 170,
  personHeight: 108,
  gridX: 220,
  gridY: 200,
  spouseGap: 60,
  siblingGap: 120,
  childGap: 300,
  padding: 150,
  minGap: 80
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
    console.log('=== FamilyTreeLayoutEngine STARTING (NEW UNIT ALGORITHM) ===')
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
    // 1) keep spouses at the SAME depth (row) - use DEEPER depth
    const forceSpousesSameDepth = () => {
      // move both spouses to the deeper (larger) depth to ensure children stay below
      this.spouseMap.forEach((spouses, aId) => {
        const a = depths.get(aId) ?? 0;
        spouses.forEach(bId => {
          const b = depths.get(bId) ?? a;
          const target = Math.max(a, b); // Use MAX, not min!
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
      console.log(`Marriage ${m.parentA?.full_name || 'none'} + ${m.parentB?.full_name || 'none'}: depths ${da},${db} -> marriage depth ${m.depth}`);
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

    // Debug X positioning for overlapping issue
    console.log('=== X POSITIONING DEBUG ===')
    people.forEach(person => {
      const pos = positions.get(person.id)
      if (pos) {
        console.log(`${person.full_name}: x=${pos.x}, y=${pos.y}, depth=${depths.get(person.id)}`)
      }
    })

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
    
    console.log('=== BUILDING MARRIAGE NODES ===');
    console.log('Explicit spouse set:', Array.from(this.explicitSpouseSet));
    
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
          const isExplicit = this.explicitSpouseSet.has(marriageId);
          
          console.log(`Creating marriage ${marriageId}: ${parentA?.full_name} + ${parentB?.full_name}, explicit: ${isExplicit}`);
          
          marriages.set(marriageId, {
            id: marriageId,
            parentA,
            parentB,
            children: [],
            x: 0,
            y: 0,
            depth: 0,
            subtreeWidth: 0,
            explicit: isExplicit
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

    const finalMarriages = Array.from(marriages.values());
    console.log('=== FINAL MARRIAGES ===');
    finalMarriages.forEach(m => {
      console.log(`Marriage ${m.id}: ${m.parentA?.full_name} + ${m.parentB?.full_name}, explicit: ${m.explicit}, children: ${m.children.length}`);
    });

    return finalMarriages
  }

  private assignDepthsByAncestry(people: Person[], marriages: MarriageNode[]): Map<string, number> {
    const depths = new Map<string, number>()
    const visited = new Set<string>()

    console.log('=== DEPTH ASSIGNMENT DEBUG ===')
    console.log('People:', people.map(p => `${p.full_name} (${p.id})`))
    console.log('ParentsMap:', Array.from(this.parentsMap.entries()))
    console.log('ChildrenMap:', Array.from(this.childrenMap.entries()))

    // Find TRUE root people (those with no parents AND not spouses of people with parents)
    const rootPeople = people.filter(p => {
      const parents = this.parentsMap.get(p.id) || []
      if (parents.length > 0) return false // Has parents, not a root
      
      // Check if this person is a spouse of someone who has parents
      const spouses = this.spouseMap.get(p.id) || []
      const isSpouseOfNonRoot = spouses.some(spouseId => {
        const spouseParents = this.parentsMap.get(spouseId) || []
        return spouseParents.length > 0
      })
      
      return !isSpouseOfNonRoot // Only true roots (not spouses of people with parents)
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

    // Final pass: ensure TRUE roots stay at depth 0 and fix any inversion
    // Don't include spouses as roots - they should maintain their spouse's depth
    const trueRoots = people.filter(p => {
      const hasNoParents = (this.parentsMap.get(p.id) || []).length === 0
      const isSpouse = (this.spouseMap.get(p.id) || []).length > 0
      return hasNoParents && !isSpouse // Only true roots, not spouses
    })
    trueRoots.forEach(r => depths.set(r.id, 0)) // force true roots to depth 0

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
    console.log('\n=== UNIT-BASED ORG CHART POSITIONING (v3) ===');
    
    const pos = new Map<string, { x: number; y: number }>();
    const lockedIds = new Set<string>(); // People placed as part of spouse pairs
    const marriageCenter = new Map<string, number>(); // Marriage ID -> centerX for children
    
    // Group people by generation depth
    const generations = new Map<number, Person[]>();
    people.forEach(person => {
      const depth = depths.get(person.id) ?? 0;
      if (!generations.has(depth)) {
        generations.set(depth, []);
      }
      generations.get(depth)!.push(person);
    });

    // Sort generations by depth
    const genKeys = Array.from(generations.keys()).sort((a, b) => a - b);
    console.log(`Generations: ${genKeys.map(d => `Depth ${d}: ${generations.get(d)!.map(p => p.full_name).join(', ')}`).join(', ')}`);

    // Define unit types
    type Unit = 
      | { kind: 'pair'; a: Person; b: Person; left: number; width: number; centerX: number; marriage: Marriage }
      | { kind: 'single'; a: Person; left: number; width: number; centerX: number };

    type Marriage = typeof marriages[0];

    // Process each generation
    genKeys.forEach(depth => {
      const genPeople = generations.get(depth)!;
      const yTop = depth * this.config.gridY;
      
      console.log(`\n=== Processing Generation ${depth + 1} (depth ${depth}) ===`);
      
      // Get marriages at this depth
      const marriagesAtDepth = marriages.filter(m => m.depth === depth);
      const units: Unit[] = [];
      let cursorX = this.config.padding;

      // Sort marriages by earliest birth year in the unit, then by name
      const sortedMarriages = marriagesAtDepth
        .filter(m => {
          // Only include marriages where at least one spouse is in this generation
          return (m.parentA && genPeople.includes(m.parentA)) || 
                 (m.parentB && genPeople.includes(m.parentB));
        })
        .sort((a, b) => {
          const aEarliest = Math.min(
            a.parentA?.birth_year || 9999,
            a.parentB?.birth_year || 9999
          );
          const bEarliest = Math.min(
            b.parentA?.birth_year || 9999,
            b.parentB?.birth_year || 9999
          );
          if (aEarliest !== bEarliest) return aEarliest - bEarliest;
          
          const aName = (a.parentA?.full_name || '') + (a.parentB?.full_name || '');
          const bName = (b.parentA?.full_name || '') + (b.parentB?.full_name || '');
          return aName.localeCompare(bName);
        });

      // First pass: Create units for spouse pairs
      sortedMarriages.forEach(marriage => {
        const spousesInGen = [];
        if (marriage.parentA && genPeople.includes(marriage.parentA)) {
          spousesInGen.push(marriage.parentA);
        }
        if (marriage.parentB && genPeople.includes(marriage.parentB)) {
          spousesInGen.push(marriage.parentB);
        }

        if (spousesInGen.length === 2) {
          // Create pair unit
          const [a, b] = spousesInGen;
          const width = this.config.personWidth * 2 + this.config.spouseGap;
          const centerX = cursorX + width / 2;
          
          const unit: Unit = {
            kind: 'pair',
            a, b,
            left: cursorX,
            width,
            centerX,
            marriage
          };
          
          units.push(unit);
          lockedIds.add(a.id);
          lockedIds.add(b.id);
          marriageCenter.set(marriage.id, centerX);
          
          console.log(`✓ Created pair unit: ${a.full_name} + ${b.full_name} at centerX=${centerX}`);
          cursorX += width + this.config.siblingGap;
        } else if (spousesInGen.length === 1) {
          // Create single parent unit
          const a = spousesInGen[0];
          const width = this.config.personWidth;
          const centerX = cursorX + width / 2;
          
          const unit: Unit = {
            kind: 'single',
            a,
            left: cursorX,
            width,
            centerX
          };
          
          units.push(unit);
          lockedIds.add(a.id);
          marriageCenter.set(marriage.id, centerX);
          
          console.log(`✓ Created single parent unit: ${a.full_name} at centerX=${centerX}`);
          cursorX += width + this.config.siblingGap;
        }
      });

      // Second pass: Create units for remaining singles (not locked)
      const remainingSingles = genPeople
        .filter(p => !lockedIds.has(p.id))
        .sort((a, b) => {
          if ((a.birth_year || 0) !== (b.birth_year || 0)) {
            return (a.birth_year || 0) - (b.birth_year || 0);
          }
          return a.full_name.localeCompare(b.full_name);
        });

      remainingSingles.forEach(person => {
        const width = this.config.personWidth;
        const centerX = cursorX + width / 2;
        
        const unit: Unit = {
          kind: 'single',
          a: person,
          left: cursorX,
          width,
          centerX
        };
        
        units.push(unit);
        console.log(`✓ Created single unit: ${person.full_name} at centerX=${centerX}`);
        cursorX += width + this.config.siblingGap;
      });

      // Collision resolution on units
      for (let i = 1; i < units.length; i++) {
        const prev = units[i - 1];
        const cur = units[i];
        const requiredGap = this.config.siblingGap;
        const overlap = (prev.left + prev.width + requiredGap) - cur.left;
        
        if (overlap > 0) {
          console.log(`  Collision detected, shifting unit ${i} by ${overlap}`);
          cur.left += overlap;
          cur.centerX += overlap;
        }
      }

      // Position people from units
      units.forEach(unit => {
        if (unit.kind === 'pair') {
          // Position both spouses
          pos.set(unit.a.id, { x: unit.left, y: yTop });
          pos.set(unit.b.id, { x: unit.left + this.config.personWidth + this.config.spouseGap, y: yTop });
          
          // Set marriage union position - CENTER it between the CENTER of each person card
          const personACenterX = unit.left + this.config.personWidth / 2;
          const personBCenterX = unit.left + this.config.personWidth + this.config.spouseGap + this.config.personWidth / 2;
          unit.marriage.x = (personACenterX + personBCenterX) / 2;
          unit.marriage.y = yTop + this.config.personHeight / 2;
          
          // Update the marriage center for children positioning
          marriageCenter.set(unit.marriage.id, unit.marriage.x);
          
          console.log(`✓ Positioned pair: ${unit.a.full_name} at x=${unit.left}, ${unit.b.full_name} at x=${unit.left + this.config.personWidth + this.config.spouseGap}, heart at x=${unit.marriage.x}`);
        } else {
          // Position single person
          pos.set(unit.a.id, { x: unit.left, y: yTop });
          console.log(`✓ Positioned single: ${unit.a.full_name} at x=${unit.left}`);
        }
      });
    });

    // Children positioning pass - only move unlocked people
    console.log('\n=== Positioning children (unlocked only) ===');
    marriages.forEach(marriage => {
      if (marriage.children.length === 0) return;
      
      const centerX = marriageCenter.get(marriage.id);
      if (!centerX) return; // No center recorded, skip
      
      const childDepth = marriage.depth + 1;
      const childY = childDepth * this.config.gridY;

      // Only position children not already locked as spouses
      const freeChildren = marriage.children
        .filter(child => !lockedIds.has(child.id))
        .sort((a, b) => {
          if ((a.birth_year || 0) !== (b.birth_year || 0)) {
            return (a.birth_year || 0) - (b.birth_year || 0);
          }
          return a.full_name.localeCompare(b.full_name);
        });
      
      if (freeChildren.length === 0) {
        console.log(`  All children of ${marriage.parentA?.full_name || 'none'} + ${marriage.parentB?.full_name || 'none'} are locked, skipping`);
        return;
      }

      console.log(`Children for ${marriage.parentA?.full_name || 'none'} + ${marriage.parentB?.full_name || 'none'}: ${freeChildren.map(c => c.full_name).join(', ')}`);

      if (freeChildren.length === 1) {
        // Single child centered under union
        const child = freeChildren[0];
        pos.set(child.id, { x: centerX - this.config.personWidth / 2, y: childY });
        console.log(`✓ Positioned single child ${child.full_name} under union at x=${centerX - this.config.personWidth / 2}`);
      } else {
        // Multiple children spread evenly
        const span = (freeChildren.length - 1) * this.config.childGap;
        let childX = centerX - span / 2;
        
        freeChildren.forEach(child => {
          pos.set(child.id, { x: childX - this.config.personWidth / 2, y: childY });
          console.log(`✓ Positioned child ${child.full_name} under union at x=${childX - this.config.personWidth / 2}`);
          childX += this.config.childGap;
        });
      }
    });

    console.log('\n=== FINAL UNIT-BASED POSITIONS ===');
    people.forEach(person => {
      const position = pos.get(person.id);
      if (position) {
        console.log(`${person.full_name}: x=${position.x}`);
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