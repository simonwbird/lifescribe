import { supabase } from '@/integrations/supabase/client'
import type { 
  TreePerson, 
  TreeFamily, 
  TreeFamilyChild, 
  TreeGraph, 
  TreePreference,
  QuickAddForm,
  TreeViewState
} from './familyTreeV2Types'

export class FamilyTreeService {
  // Get family's tree data - FIXED: Use main people/relationships tables as source of truth
  static async getTreeData(familyId: string, homePersonId?: string, depth?: number): Promise<TreeGraph> {
    // 1) Raw source of truth - fetch ALL people and relationships for the family (no limits)
    const { data: people, error: pErr } = await supabase
      .from('people')
      .select('*')
      .eq('family_id', familyId)
      .order('surname', { ascending: true })
    
    if (pErr) throw pErr

    const { data: rels, error: rErr } = await supabase
      .from('relationships')
      .select('*')
      .eq('family_id', familyId)
    
    if (rErr) throw rErr

    // 2) Optional enrichment from V2 tables (safe if empty)
    const { data: unions } = await supabase
      .from('tree_families')
      .select('*')
      .eq('family_id', familyId)

    const { data: unionChildren } = await supabase
      .from('tree_family_children')
      .select('*')
      .in('family_id', unions?.map(f => f.id) || [])

    // 3) Build a FULL graph from people and relationships (no node caps)
    const graph = this.buildGraphFromPeopleAndRels(people || [], rels || [], unions || [], unionChildren || [])

    // 4) If depth is set, filter AFTER building the full graph, never before
    const pruned = typeof depth === 'number' && depth < 999 ? this.pruneByDepth(graph, homePersonId || graph.focusPersonId, depth) : graph

    // Determine focus person if not provided
    let focusPersonId = homePersonId
    if (!focusPersonId && people && people.length > 0) {
      focusPersonId = people[0].id
    }

    return {
      ...pruned,
      focusPersonId: focusPersonId || '',
      meta: { 
        source: 'people+relationships', 
        count_people: people?.length ?? 0, 
        count_rels: rels?.length ?? 0 
      }
    }
  }

  // Build graph from people and relationships with proper union modeling
  private static buildGraphFromPeopleAndRels(
    people: any[], 
    rels: any[], 
    unions: any[], 
    unionChildren: any[]
  ): TreeGraph {
    const byId = new Map(people.map(p => [p.id, { 
      ...p, 
      spouses: [], 
      children: [], 
      parents: [] 
    }]))

    // Map spouses from relationships
    for (const r of rels) {
      if (r.relationship_type === 'spouse') {
        const person1 = byId.get(r.from_person_id)
        const person2 = byId.get(r.to_person_id)
        if (person1 && person2) {
          if (!person1.spouses.find((s: any) => s.id === person2.id)) {
            person1.spouses.push(person2)
          }
          if (!person2.spouses.find((s: any) => s.id === person1.id)) {
            person2.spouses.push(person1)
          }
        }
      }
    }

    // Map parents/children from relationships
    for (const r of rels) {
      if (r.relationship_type === 'parent') {
        const parent = byId.get(r.from_person_id)
        const child = byId.get(r.to_person_id)
        if (parent && child) {
          if (!parent.children.find((c: any) => c.id === child.id)) {
            parent.children.push(child)
          }
          if (!child.parents.find((p: any) => p.id === parent.id)) {
            child.parents.push(parent)
          }
        }
      }
    }

    // Optional: strengthen parent–parent unions from V2 tables
    const unionsById = new Map(unions.map(u => [u.id, u]))
    for (const link of unionChildren) {
      const union = unionsById.get(link.family_id)
      if (!union) continue
      
      const p1 = byId.get(union.partner1_id)
      const p2 = byId.get(union.partner2_id)
      const ch = byId.get(link.child_id)
      
      // Ensure spouses are connected
      if (p1 && p2) {
        if (!p1.spouses.find((s: any) => s.id === p2.id)) p1.spouses.push(p2)
        if (!p2.spouses.find((s: any) => s.id === p1.id)) p2.spouses.push(p1)
      }
      
      // Ensure parent-child relationships
      if (p1 && ch && !p1.children.find((c: any) => c.id === ch.id)) p1.children.push(ch)
      if (p2 && ch && !p2.children.find((c: any) => c.id === ch.id)) p2.children.push(ch)
      if (ch) {
        if (p1 && !ch.parents.find((pp: any) => pp.id === p1.id)) ch.parents.push(p1)
        if (p2 && !ch.parents.find((pp: any) => pp.id === p2.id)) ch.parents.push(p2)
      }
    }

    // Convert to old format for compatibility
    const treePeople = Array.from(byId.values())
    const treeFamilies = unions || []
    const treeChildren = unionChildren || []

    return {
      focusPersonId: '',
      people: treePeople,
      families: treeFamilies,
      children: treeChildren,
      relationships: rels || [],
      components: this.buildConnectedComponents(treePeople)
    }
  }

  // Helper to build connected components
  private static buildConnectedComponents(people: any[]): any[] {
    const visited = new Set()
    const components = []

    for (const person of people) {
      if (visited.has(person.id)) continue
      
      const component = []
      const stack = [person]
      
      while (stack.length > 0) {
        const current = stack.pop()
        if (!current || visited.has(current.id)) continue
        
        visited.add(current.id)
        component.push(current)
        
        // Add connected people (spouses, parents, children)
        for (const spouse of current.spouses || []) {
          if (!visited.has(spouse.id)) stack.push(spouse)
        }
        for (const parent of current.parents || []) {
          if (!visited.has(parent.id)) stack.push(parent)
        }
        for (const child of current.children || []) {
          if (!visited.has(child.id)) stack.push(child)
        }
      }
      
      components.push(component)
    }
    
    return components
  }

  // Prune graph by depth (view filter only) - PUBLIC for use in components
  public static pruneByDepth(graph: TreeGraph, focusPersonId: string, depth: number): TreeGraph {
    if (!focusPersonId || depth >= 999) return graph
    
    const visited = new Set()
    const queue = [{ personId: focusPersonId, currentDepth: 0 }]
    
    while (queue.length > 0) {
      const { personId, currentDepth } = queue.shift()!
      
      if (visited.has(personId) || currentDepth > depth) continue
      visited.add(personId)
      
      const person = graph.people.find(p => p.id === personId)
      if (!person) continue
      
      // Add connected people within depth
      for (const spouse of person.spouses || []) {
        if (!visited.has(spouse.id) && currentDepth < depth) {
          queue.push({ personId: spouse.id, currentDepth: currentDepth })
        }
      }
      for (const parent of person.parents || []) {
        if (!visited.has(parent.id) && currentDepth < depth) {
          queue.push({ personId: parent.id, currentDepth: currentDepth + 1 })
        }
      }
      for (const child of person.children || []) {
        if (!visited.has(child.id) && currentDepth < depth) {
          queue.push({ personId: child.id, currentDepth: currentDepth + 1 })
        }
      }
    }
    
    const prunedPeople = graph.people.filter(p => visited.has(p.id))
    
    return {
      ...graph,
      people: prunedPeople,
      components: this.buildConnectedComponents(prunedPeople)
    }
  }

  // Get/Set home person preference
  static async getHomePersonId(familyId: string, userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('tree_preferences')
      .select('root_person_id')
      .eq('family_id', familyId)
      .eq('user_id', userId)
      .single()

    return data?.root_person_id || null
  }

  static async setHomePersonId(familyId: string, userId: string, homePersonId: string): Promise<void> {
    await supabase
      .from('tree_preferences')
      .upsert({
        family_id: familyId,
        user_id: userId,
        root_person_id: homePersonId
      })
  }

  // Quick Add functionality
  static async quickAddPerson(
    form: QuickAddForm,
    familyId: string,
    userId: string
  ): Promise<any> {
    // Create the new person in the main people table
    const { data: newPerson, error: personError } = await supabase
      .from('people')
      .insert({
        family_id: familyId,
        given_name: form.given_name,
        surname: form.surname || null,
        gender: form.sex === 'M' ? 'male' : form.sex === 'F' ? 'female' : 'other',
        birth_date: form.birth_date || null,
        created_by: userId,
        full_name: `${form.given_name} ${form.surname || ''}`.trim()
      })
      .select()
      .single()

    if (personError) throw personError

    // Create relationship based on type
    if (form.relationship_type === 'partner') {
      await this.addSpouseRelationship(form.target_person_id, newPerson.id, familyId, userId)
    } else if (form.relationship_type === 'child') {
      await this.addParentChildRelationship(form.target_person_id, newPerson.id, familyId, userId)
    } else if (form.relationship_type === 'parent') {
      await this.addParentChildRelationship(newPerson.id, form.target_person_id, familyId, userId)
    }

    return newPerson
  }

  // Add spouse relationship
  static async addSpouseRelationship(
    personId: string, 
    spouseId: string, 
    familyId: string, 
    userId: string
  ): Promise<void> {
    await supabase
      .from('relationships')
      .insert({
        family_id: familyId,
        from_person_id: personId,
        to_person_id: spouseId,
        relationship_type: 'spouse',
        created_by: userId
      })
  }

  // Add parent-child relationship  
  static async addParentChildRelationship(
    parentId: string,
    childId: string,
    familyId: string,
    userId: string
  ): Promise<void> {
    await supabase
      .from('relationships')
      .insert({
        family_id: familyId,
        from_person_id: parentId,
        to_person_id: childId,
        relationship_type: 'parent',
        created_by: userId
      })
  }

  // Add partner relationship
  static async addPartner(
    personId: string, 
    partnerId: string, 
    familyId: string, 
    userId: string
  ): Promise<TreeFamily> {
    const { data: family, error } = await supabase
      .from('tree_families')
      .insert({
        family_id: familyId,
        partner1_id: personId,
        partner2_id: partnerId,
        relationship_type: 'married',
        created_by: userId
      })
      .select()
      .single()

    if (error) throw error
    return family
  }

  // Add child to existing family or create new family
  static async addChild(
    parentId: string,
    childId: string,
    familyId: string,
    userId: string
  ): Promise<void> {
    // Find existing family where parentId is a partner
    const { data: existingFamily } = await supabase
      .from('tree_families')
      .select('*')
      .eq('family_id', familyId)
      .or(`partner1_id.eq.${parentId},partner2_id.eq.${parentId}`)
      .limit(1)
      .single()

    let targetFamilyId: string

    if (existingFamily) {
      targetFamilyId = existingFamily.id
    } else {
      // Create new family with just one parent
      const { data: newFamily, error } = await supabase
        .from('tree_families')
        .insert({
          family_id: familyId,
          partner1_id: parentId,
          relationship_type: 'unknown',
          created_by: userId
        })
        .select()
        .single()

      if (error) throw error
      targetFamilyId = newFamily.id
    }

    // Link child to family
    await supabase
      .from('tree_family_children')
      .insert({
        family_id: targetFamilyId,
        child_id: childId
      })
  }

  // Add parent by creating/updating family relationships
  static async addParent(
    childId: string,
    parentId: string,
    familyId: string,
    userId: string
  ): Promise<void> {
    // Find existing family where childId is already a child
    const { data: existingLink } = await supabase
      .from('tree_family_children')
      .select('family_id, tree_families!inner(*)')
      .eq('child_id', childId)
      .limit(1)
      .single()

    if (existingLink) {
      // Update existing family to add second parent
      const family = existingLink.tree_families
      if (!family.partner2_id) {
        await supabase
          .from('tree_families')
          .update({ partner2_id: parentId })
          .eq('id', family.id)
      }
    } else {
      // Create new family with parent and link child
      const { data: newFamily, error } = await supabase
        .from('tree_families')
        .insert({
          family_id: familyId,
          partner1_id: parentId,
          relationship_type: 'unknown',
          created_by: userId
        })
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('tree_family_children')
        .insert({
          family_id: newFamily.id,
          child_id: childId
        })
    }
  }

  // Delete person and all relationships
  static async deletePerson(personId: string): Promise<void> {
    // Delete as partner in families
    await supabase
      .from('tree_families')
      .delete()
      .or(`partner1_id.eq.${personId},partner2_id.eq.${personId}`)

    // Delete as child
    await supabase
      .from('tree_family_children')
      .delete()
      .eq('child_id', personId)

    // Delete person
    await supabase
      .from('tree_people')
      .delete()
      .eq('id', personId)
  }

  // Update person
  static async updatePerson(personId: string, updates: Partial<TreePerson>): Promise<TreePerson> {
    const { data, error } = await supabase
      .from('tree_people')
      .update(updates)
      .eq('id', personId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Search people for quick add - REMOVED LIMIT
  static async searchPeople(familyId: string, query: string): Promise<TreePerson[]> {
    const { data, error } = await supabase
      .from('tree_people')
      .select('*')
      .eq('family_id', familyId)
      .or(`given_name.ilike.%${query}%,surname.ilike.%${query}%`)

    if (error) throw error
    return data || []
  }

  // Get person with relationships
  static async getPersonWithRelationships(personId: string): Promise<{
    person: TreePerson
    partners: TreePerson[]
    children: TreePerson[]
    parents: TreePerson[]
  }> {
    const { data: person, error: personError } = await supabase
      .from('tree_people')
      .select('*')
      .eq('id', personId)
      .single()

    if (personError) throw personError

    // Get families where person is a partner
    const { data: partnerFamilies } = await supabase
      .from('tree_families')
      .select('*')
      .or(`partner1_id.eq.${personId},partner2_id.eq.${personId}`)

    const partners: TreePerson[] = []
    const partnerFamilyIds: string[] = []

    // Get partner details separately
    for (const family of partnerFamilies || []) {
      if (family.partner1_id === personId && family.partner2_id) {
        const { data: partner } = await supabase
          .from('tree_people')
          .select('*')
          .eq('id', family.partner2_id)
          .single()
        if (partner) partners.push(partner as TreePerson)
      } else if (family.partner2_id === personId && family.partner1_id) {
        const { data: partner } = await supabase
          .from('tree_people')
          .select('*')
          .eq('id', family.partner1_id)
          .single()
        if (partner) partners.push(partner as TreePerson)
      }
      partnerFamilyIds.push(family.id)
    }

    // Get children from partner families
    const { data: childrenLinks } = await supabase
      .from('tree_family_children')
      .select('child_id')
      .in('family_id', partnerFamilyIds)

    const children: TreePerson[] = []
    for (const link of childrenLinks || []) {
      const { data: child } = await supabase
        .from('tree_people')
        .select('*')
        .eq('id', link.child_id)
        .single()
      if (child) children.push(child as TreePerson)
    }

    // Get parents (families where person is a child)
    const { data: childLinks } = await supabase
      .from('tree_family_children')
      .select('family_id')
      .eq('child_id', personId)

    const parents: TreePerson[] = []
    for (const link of childLinks || []) {
      const { data: family } = await supabase
        .from('tree_families')
        .select('*')
        .eq('id', link.family_id)
        .single()

      if (family) {
        if (family.partner1_id) {
          const { data: parent1 } = await supabase
            .from('tree_people')
            .select('*')
            .eq('id', family.partner1_id)
            .single()
          if (parent1) parents.push(parent1 as TreePerson)
        }
        if (family.partner2_id) {
          const { data: parent2 } = await supabase
            .from('tree_people')
            .select('*')
            .eq('id', family.partner2_id)
            .single()
          if (parent2) parents.push(parent2 as TreePerson)
        }
      }
    }

    return {
      person,
      partners,
      children,
      parents
    }
  }
}