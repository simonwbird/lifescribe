import { supabase } from '@/integrations/supabase/client'
import type { GedcomPerson, GedcomRelationship, ImportPreview } from './familyTreeV2Types'

export class CsvImportService {
  // Parse combined CSV with people and relationships in one file
  static parseCombinedCsv(csvContent: string): { people: GedcomPerson[], relationships: GedcomRelationship[] } {
    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) return { people: [], relationships: [] }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const people: GedcomPerson[] = []
    const relationships: GedcomRelationship[] = []

    type TempRow = {
      person: GedcomPerson
      spouseId?: string
      parent1Id?: string
      parent2Id?: string
      familyId?: string
      marriageDate?: string
    }

    const tempRows: TempRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = CsvImportService.parseCsvLine(lines[i])
      if (values.length < headers.length) continue

      const person: Partial<GedcomPerson> = {}
      let spouseId = ''
      let parent1Id = ''
      let parent2Id = ''
      let familyId = ''
      let marriageDate = ''

      headers.forEach((header, index) => {
        const value = values[index]?.trim().replace(/"/g, '') || ''
        switch (header.toLowerCase()) {
          case 'person_id':
            person.person_id = value
            break
          case 'given_name':
            person.given_name = value
            break
          case 'surname':
            person.surname = value
            break
          case 'sex':
            person.sex = value as 'M' | 'F' | 'X'
            break
          case 'birth_date':
            person.birth_date = value
            break
          case 'birth_place':
            person.birth_place = value
            break
          case 'death_date':
            person.death_date = value
            break
          case 'death_place':
            person.death_place = value
            break
          case 'is_living':
            person.is_living = value.toUpperCase() === 'Y' || value.toLowerCase() === 'true' ? 'Y' : 'N'
            break
          // Relationship fields
          case 'spouse_id':
            spouseId = value
            break
          case 'parent1_id':
            parent1Id = value
            break
          case 'parent2_id':
            parent2Id = value
            break
          case 'family_id':
            familyId = value
            break
          case 'marriage_date':
            marriageDate = value
            break
        }
      })

      if (person.person_id) {
        person.is_living = person.is_living || 'Y'
        person.raw_name = person.raw_name || `${person.given_name || ''} /${person.surname || ''}/`
        const finalized = person as GedcomPerson
        people.push(finalized)
        tempRows.push({ person: finalized, spouseId, parent1Id, parent2Id, familyId, marriageDate })
      }
    }

    // Build a map of spouse families from rows: key = sorted pair "A|B" => family_xref
    const pairKey = (a: string, b: string) => [a, b].sort().join('|')
    const spouseFamilyMap = new Map<string, string>()

    tempRows.forEach(r => {
      if (r.spouseId && r.familyId) {
        spouseFamilyMap.set(pairKey(r.person.person_id, r.spouseId), r.familyId)
      }
    })

    // Build relationships with correct family IDs
    const spouseDedup = new Set<string>()
    const parentDedup = new Set<string>()

    tempRows.forEach(r => {
      // Spouse
      if (r.spouseId && r.familyId) {
        const key = `${r.familyId}|${pairKey(r.person.person_id, r.spouseId)}`
        if (!spouseDedup.has(key)) {
          relationships.push({
            rel_type: 'spouse',
            a_id: r.person.person_id,
            b_id: r.spouseId,
            family_id: r.familyId,
            marriage_date: r.marriageDate || '',
            divorce_date: '',
            note: ''
          })
          spouseDedup.add(key)
        }
      }

      // Parents -> child
      if (r.parent1Id || r.parent2Id) {
        let parentsFamilyXref = ''
        if (r.parent1Id && r.parent2Id) {
          parentsFamilyXref = spouseFamilyMap.get(pairKey(r.parent1Id, r.parent2Id)) || `F_${pairKey(r.parent1Id, r.parent2Id)}`
        } else if (r.parent1Id) {
          parentsFamilyXref = `F_single_${r.parent1Id}`
        } else if (r.parent2Id) {
          parentsFamilyXref = `F_single_${r.parent2Id}`
        }

        if (r.parent1Id) {
          const k1 = `${parentsFamilyXref}|${r.parent1Id}|${r.person.person_id}`
          if (!parentDedup.has(k1)) {
            relationships.push({
              rel_type: 'parent',
              a_id: r.parent1Id,
              b_id: r.person.person_id,
              family_id: parentsFamilyXref,
              marriage_date: '',
              divorce_date: '',
              note: 'parent->child'
            })
            parentDedup.add(k1)
          }
        }
        if (r.parent2Id) {
          const k2 = `${parentsFamilyXref}|${r.parent2Id}|${r.person.person_id}`
          if (!parentDedup.has(k2)) {
            relationships.push({
              rel_type: 'parent',
              a_id: r.parent2Id,
              b_id: r.person.person_id,
              family_id: parentsFamilyXref,
              marriage_date: '',
              divorce_date: '',
              note: 'parent->child'
            })
            parentDedup.add(k2)
          }
        }
      }
    })

    return { people, relationships }
  }

  // Parse a single CSV line handling quotes and commas
  static parseCsvLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    
    // Add final field
    result.push(current)
    return result
  }

  // Preview CSV import
  static async previewCsvImport(
    peopleContent: string,
    relationshipsContent: string,
    familyId: string
  ): Promise<ImportPreview> {
    const people = CsvImportService.parsePeopleCsv(peopleContent)
    const relationships = CsvImportService.parseRelationshipsCsv(relationshipsContent)

    // Get existing people for duplicate detection
    const { data: existingPeople } = await supabase
      .from('tree_people')
      .select('*')
      .eq('family_id', familyId)

    const duplicates = existingPeople ? 
      people.flatMap(person => CsvImportService.findPotentialMatches(person, existingPeople)) : []

    const uniqueFamilies = new Set(relationships.map(r => r.family_id)).size
    const childrenCount = relationships.filter(r => r.rel_type === 'parent').length

    return {
      people,
      relationships,
      peopleCount: people.length,
      familiesCount: uniqueFamilies,
      childrenCount,
      duplicates
    }
  }

  // Legacy method for backward compatibility
  static parsePeopleCsv(csvContent: string): GedcomPerson[] {
    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const people: GedcomPerson[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = CsvImportService.parseCsvLine(lines[i])
      if (values.length < headers.length) continue

      const person: Partial<GedcomPerson> = {}
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim().replace(/"/g, '') || ''
        
        switch (header.toLowerCase()) {
          case 'person_id':
            person.person_id = value
            break
          case 'given_name':
            person.given_name = value
            break
          case 'surname':
            person.surname = value
            break
          case 'sex':
            person.sex = value as 'M' | 'F' | 'X'
            break
          case 'birth_date':
            person.birth_date = value
            break
          case 'birth_place':
            person.birth_place = value
            break
          case 'death_date':
            person.death_date = value
            break
          case 'death_place':
            person.death_place = value
            break
          case 'is_living':
            person.is_living = value.toUpperCase() === 'Y' || value.toLowerCase() === 'true' ? 'Y' : 'N'
            break
          case 'raw_name':
            person.raw_name = value
            break
        }
      })

      if (person.person_id) {
        // Set defaults
        person.is_living = person.is_living || 'Y'
        person.raw_name = person.raw_name || `${person.given_name || ''} /${person.surname || ''}/`
        people.push(person as GedcomPerson)
      }
    }

    return people
  }

  // Parse CSV content to relationships array
  static parseRelationshipsCsv(csvContent: string): GedcomRelationship[] {
    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const relationships: GedcomRelationship[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = CsvImportService.parseCsvLine(lines[i])
      if (values.length < headers.length) continue

      const rel: Partial<GedcomRelationship> = {}
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim().replace(/"/g, '') || ''
        
        switch (header.toLowerCase()) {
          case 'rel_type':
            rel.rel_type = value as 'spouse' | 'parent'
            break
          case 'a_id':
            rel.a_id = value
            break
          case 'b_id':
            rel.b_id = value
            break
          case 'family_id':
            rel.family_id = value
            break
          case 'marriage_date':
            rel.marriage_date = value
            break
          case 'divorce_date':
            rel.divorce_date = value
            break
          case 'note':
            rel.note = value
            break
        }
      })

      if (rel.rel_type && rel.a_id && rel.b_id && rel.family_id) {
        relationships.push(rel as GedcomRelationship)
      }
    }

    return relationships
  }

  // Simple duplicate detection (reuse from GedcomImportService)
  static findPotentialMatches(incoming: GedcomPerson, existing: any[]): any[] {
    // This would reuse the logic from GedcomImportService.findPotentialMatches
    // For brevity, returning empty array - would implement full matching logic
    return []
  }

  // Commit CSV import to database
  static async commitCsvImport(
    preview: ImportPreview,
    familyId: string,
    userId: string
  ): Promise<void> {
    const { people, relationships } = preview

    // Helper function to parse dates safely
    const parseDate = (dateStr: string): string | null => {
      if (!dateStr || dateStr.trim() === '') return null
      let cleanDateStr = dateStr.replace(/\.0$/, '')
      if (/^\d{4}$/.test(cleanDateStr)) {
        cleanDateStr = `${cleanDateStr}-01-01`
      }
      const date = new Date(cleanDateStr)
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date format: ${dateStr}`)
        return null
      }
      return date.toISOString().split('T')[0]
    }

    // 0) CLEAN OUT EXISTING DATA FOR THIS FAMILY (V2 + Legacy)
    try {
      // V2: remove children for this family's unions, then unions, then people
      const { data: v2Families } = await supabase
        .from('tree_families')
        .select('id')
        .eq('family_id', familyId)

      const v2FamilyIds = (v2Families || []).map((f: any) => f.id)
      if (v2FamilyIds.length > 0) {
        await supabase
          .from('tree_family_children')
          .delete()
          .in('family_id', v2FamilyIds)
      }
      await supabase.from('tree_families').delete().eq('family_id', familyId)
      await supabase.from('tree_people').delete().eq('family_id', familyId)

      // Legacy: delete relationships first, then people
      await supabase.from('relationships').delete().eq('family_id', familyId)
      await supabase.from('people').delete().eq('family_id', familyId)
    } catch (cleanupErr) {
      console.warn('Cleanup warning (non-fatal):', cleanupErr)
    }

    // 1) INSERT INTO V2 TABLES (tree_people, tree_families, tree_family_children)
    // Fetch existing tree_people after cleanup (should be empty but keep logic safe)
    const { data: existingTreePeople } = await supabase
      .from('tree_people')
      .select('id, source_xref')
      .eq('family_id', familyId)

    const existingTreeMap = new Map<string, string>()
    existingTreePeople?.forEach(p => {
      if (p.source_xref) existingTreeMap.set(p.source_xref, p.id)
    })

    const v2ToInsert = people
      .filter(person => !existingTreeMap.has(person.person_id))
      .map(person => ({
        family_id: familyId,
        given_name: person.given_name || null,
        surname: person.surname || null,
        sex: person.sex || null,
        birth_date: parseDate(person.birth_date || ''),
        death_date: parseDate(person.death_date || ''),
        is_living: person.is_living === 'Y',
        source_xref: person.person_id,
        created_by: userId
      }))

    let insertedTreePeople: Array<{ id: string; source_xref: string | null }> = []
    if (v2ToInsert.length > 0) {
      const { data, error: peopleError } = await supabase
        .from('tree_people')
        .insert(v2ToInsert)
        .select('id, source_xref')
      if (peopleError) throw peopleError
      insertedTreePeople = data || []
    }

    // Mapping (xref -> tree_people.id)
    const idMapV2 = new Map<string, string>()
    existingTreeMap.forEach((id, xref) => idMapV2.set(xref, id))
    insertedTreePeople.forEach(person => {
      if (person.source_xref) {
        idMapV2.set(person.source_xref, person.id)
      }
    })

    // Group relationships by family and type for V2 unions/children
    const childrenToInsertV2: Array<{ family_id: string; child_id: string }> = []
    const childKeysV2 = new Set<string>()
    const familyGroups = new Map<string, {
      spouses: Array<{ a_id: string, b_id: string }>,
      children: Array<{ parent_id: string, child_id: string }>
    }>()

    relationships.forEach(rel => {
      if (!familyGroups.has(rel.family_id)) {
        familyGroups.set(rel.family_id, { spouses: [], children: [] })
      }
      const group = familyGroups.get(rel.family_id)!
      if (rel.rel_type === 'spouse') {
        group.spouses.push({ a_id: rel.a_id, b_id: rel.b_id })
      } else if (rel.rel_type === 'parent') {
        group.children.push({ parent_id: rel.a_id, child_id: rel.b_id })
      }
    })

    // Insert unions and collect children for V2
    for (const [familyXref, group] of familyGroups) {
      if (group.spouses.length > 0) {
        const spouse = group.spouses[0]
        const partner1Id = idMapV2.get(spouse.a_id)
        const partner2Id = idMapV2.get(spouse.b_id)
        if (partner1Id && partner2Id) {
          const { data: insertedFamily } = await supabase
            .from('tree_families')
            .insert({
              family_id: familyId,
              partner1_id: partner1Id,
              partner2_id: partner2Id,
              relationship_type: 'married',
              source_xref: familyXref,
              created_by: userId
            })
            .select('id')
            .single()

          if (insertedFamily) {
            group.children.forEach(child => {
              const childDbId = idMapV2.get(child.child_id)
              if (childDbId) {
                const key = `${insertedFamily.id}-${childDbId}`
                if (!childKeysV2.has(key)) {
                  childrenToInsertV2.push({ family_id: insertedFamily.id, child_id: childDbId })
                  childKeysV2.add(key)
                }
              }
            })
          }
        }
      } else if (group.children.length > 0) {
        // Single parent V2 family
        const parentChild = group.children[0]
        const parentId = idMapV2.get(parentChild.parent_id)
        if (parentId) {
          const { data: insertedFamily } = await supabase
            .from('tree_families')
            .insert({
              family_id: familyId,
              partner1_id: parentId,
              relationship_type: 'single',
              source_xref: familyXref,
              created_by: userId
            })
            .select('id')
            .single()

          if (insertedFamily) {
            group.children.forEach(child => {
              const childDbId = idMapV2.get(child.child_id)
              if (childDbId) {
                const key = `${insertedFamily.id}-${childDbId}`
                if (!childKeysV2.has(key)) {
                  childrenToInsertV2.push({ family_id: insertedFamily.id, child_id: childDbId })
                  childKeysV2.add(key)
                }
              }
            })
          }
        }
      }
    }

    if (childrenToInsertV2.length > 0) {
      const { error: childrenError } = await supabase
        .from('tree_family_children')
        .upsert(childrenToInsertV2, { onConflict: 'family_id,child_id', ignoreDuplicates: true })
      if (childrenError) throw childrenError
    }

    // 2) INSERT INTO LEGACY TABLES (people, relationships) FOR BACKWARD COMPAT
    // Build deterministic IDs for people we will insert
    const legacyIdMap = new Map<string, string>() // xref -> people.id
    const legacyPeopleToInsert = people.map(p => {
      const id = crypto.randomUUID()
      legacyIdMap.set(p.person_id, id)
      const fullName = `${p.given_name || ''} ${p.surname || ''}`.trim() || p.person_id
      return {
        id,
        family_id: familyId,
        given_name: p.given_name || null,
        surname: p.surname || null,
        full_name: fullName,
        gender: p.sex || null,
        birth_date: parseDate(p.birth_date || ''),
        death_date: parseDate(p.death_date || ''),
        created_by: userId
      }
    })

    if (legacyPeopleToInsert.length > 0) {
      const { error: legacyPeopleErr } = await supabase
        .from('people')
        .insert(legacyPeopleToInsert)
      if (legacyPeopleErr) throw legacyPeopleErr
    }

    // Relationships
    const relDedup = new Set<string>()
    const legacyRelsToInsert = relationships.flatMap(rel => {
      const fromId = legacyIdMap.get(rel.a_id)
      const toId = legacyIdMap.get(rel.b_id)
      if (!fromId || !toId) return []
      const key = `${fromId}-${toId}-${rel.rel_type}`
      if (relDedup.has(key)) return []
      relDedup.add(key)
      return [{
        family_id: familyId,
        from_person_id: fromId,
        to_person_id: toId,
        relationship_type: rel.rel_type,
        created_by: userId
      }]
    })

    if (legacyRelsToInsert.length > 0) {
      const { error: legacyRelErr } = await supabase
        .from('relationships')
        .insert(legacyRelsToInsert)
      if (legacyRelErr) throw legacyRelErr
    }
  }

  // Generate combined CSV template with all fields
  static generateCombinedTemplate(): string {
    const headers = [
      'person_id',
      'given_name', 
      'surname',
      'sex',
      'birth_date',
      'birth_place',
      'death_date',
      'death_place',
      'is_living',
      'spouse_id',
      'parent1_id',
      'parent2_id',
      'family_id',
      'marriage_date'
    ]
    
    const sampleRows = [
      // Parents generation
      ['@I1@', 'John', 'Smith', 'M', '1950-01-15', 'New York, NY', '', '', 'Y', '@I2@', '', '', '@F1@', '1970-06-12'],
      ['@I2@', 'Jane', 'Smith', 'F', '1952-03-20', 'Boston, MA', '', '', 'Y', '@I1@', '', '', '@F1@', '1970-06-12'],
      // Children
      ['@I3@', 'Michael', 'Smith', 'M', '1975-08-10', 'Chicago, IL', '', '', 'Y', '@I4@', '@I1@', '@I2@', '@F2@', '2000-05-15'],
      ['@I4@', 'Sarah', 'Smith', 'F', '1977-12-05', 'Chicago, IL', '', '', 'Y', '@I3@', '', '', '@F2@', '2000-05-15'],
      // Grandchildren
      ['@I5@', 'Emma', 'Smith', 'F', '2005-04-22', 'Denver, CO', '', '', 'Y', '', '@I3@', '@I4@', '@F3@', ''],
    ]

    return [
      headers.join(','),
      ...sampleRows.map(row => row.join(',')),
      // Empty row for user to fill
      headers.map(() => '').join(',')
    ].join('\n')
  }

  // Download CSV template
  static downloadCombinedTemplate(): void {
    const content = CsvImportService.generateCombinedTemplate()
    
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'family_tree_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}