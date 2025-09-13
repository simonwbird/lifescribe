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
  // Get family's tree data
  static async getTreeData(familyId: string, homePersonId?: string, depth = 4): Promise<TreeGraph> {
    const { data: people, error: peopleError } = await supabase
      .from('tree_people')
      .select('*')
      .eq('family_id', familyId)
      .order('surname', { ascending: true })

    if (peopleError) throw peopleError

    const { data: families, error: familiesError } = await supabase
      .from('tree_families')
      .select('*')
      .eq('family_id', familyId)

    if (familiesError) throw familiesError

    const { data: children, error: childrenError } = await supabase
      .from('tree_family_children')
      .select('*')
      .in('family_id', families?.map(f => f.id) || [])

    if (childrenError) throw childrenError

    // Determine focus person
    let focusPersonId = homePersonId
    if (!focusPersonId && people && people.length > 0) {
      // Default to first person or person with most connections
      focusPersonId = people[0].id
    }

    return {
      focusPersonId: focusPersonId || '',
      people: people || [],
      families: families || [],
      children: children || []
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
  ): Promise<TreePerson> {
    // Create the new person
    const { data: newPerson, error: personError } = await supabase
      .from('tree_people')
      .insert({
        family_id: familyId,
        given_name: form.given_name,
        surname: form.surname,
        sex: form.sex,
        birth_date: form.birth_date,
        is_living: form.is_living,
        created_by: userId
      })
      .select()
      .single()

    if (personError) throw personError

    // Create relationship based on type
    if (form.relationship_type === 'partner') {
      await this.addPartner(form.target_person_id, newPerson.id, familyId, userId)
    } else if (form.relationship_type === 'child') {
      await this.addChild(form.target_person_id, newPerson.id, familyId, userId)
    } else if (form.relationship_type === 'parent') {
      await this.addParent(form.target_person_id, newPerson.id, familyId, userId)
    }

    return newPerson
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

  // Search people for quick add
  static async searchPeople(familyId: string, query: string): Promise<TreePerson[]> {
    const { data, error } = await supabase
      .from('tree_people')
      .select('*')
      .eq('family_id', familyId)
      .or(`given_name.ilike.%${query}%,surname.ilike.%${query}%`)
      .limit(10)

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