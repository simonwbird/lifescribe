import { supabase } from '@/integrations/supabase/client'
import type { 
  GedcomPerson, 
  GedcomRelationship, 
  ImportPreview, 
  PersonMatch,
  TreePerson,
  TreeImport 
} from './familyTreeV2Types'

export class GedcomImportService {
  // Parse GEDCOM file to extract people and relationships
  static parseGedcom(gedcomContent: string): { people: GedcomPerson[], relationships: GedcomRelationship[] } {
    const lines = gedcomContent.split('\n').map(line => line.trim()).filter(line => line)
    const people: GedcomPerson[] = []
    const relationships: GedcomRelationship[] = []
    const families: Record<string, any> = {}
    
    let currentPerson: Partial<GedcomPerson> | null = null
    let currentFamily: any = null
    let currentElement = ''

    for (const line of lines) {
      const parts = line.split(' ')
      const level = parseInt(parts[0])
      const tag = parts[1]
      const value = parts.slice(2).join(' ')

      if (level === 0) {
        // Save previous person/family
        if (currentPerson && currentPerson.person_id) {
          people.push(currentPerson as GedcomPerson)
        }
        if (currentFamily && currentFamily.id) {
          families[currentFamily.id] = currentFamily
        }

        // Start new record
        if (tag.startsWith('@') && tag.endsWith('@')) {
          const id = tag
          const type = value

          if (type === 'INDI') {
            currentPerson = { person_id: id, is_living: 'Y', raw_name: '' }
            currentFamily = null
          } else if (type === 'FAM') {
            currentFamily = { id, husb: null, wife: null, children: [] }
            currentPerson = null
          }
        }
        currentElement = ''
      } else if (level === 1) {
        currentElement = tag

        if (currentPerson) {
          switch (tag) {
            case 'NAME':
              currentPerson.raw_name = value
              const nameParts = this.parseName(value)
              currentPerson.given_name = nameParts.given
              currentPerson.surname = nameParts.surname
              break
            case 'SEX':
              currentPerson.sex = value as 'M' | 'F' | 'X'
              break
            case 'FAMC':
              currentPerson.famc = value
              break
            case 'FAMS':
              currentPerson.fams = value
              break
          }
        }

        if (currentFamily) {
          switch (tag) {
            case 'HUSB':
              currentFamily.husb = value
              break
            case 'WIFE':
              currentFamily.wife = value
              break
            case 'CHIL':
              currentFamily.children.push(value)
              break
          }
        }
      } else if (level === 2) {
        if (currentPerson && currentElement === 'BIRT') {
          if (tag === 'DATE') {
            currentPerson.birth_date = value
          } else if (tag === 'PLAC') {
            currentPerson.birth_place = value
          }
        } else if (currentPerson && currentElement === 'DEAT') {
          if (tag === 'DATE') {
            currentPerson.death_date = value
            currentPerson.is_living = 'N'
          } else if (tag === 'PLAC') {
            currentPerson.death_place = value
          }
        }
      }
    }

    // Save last records
    if (currentPerson && currentPerson.person_id) {
      people.push(currentPerson as GedcomPerson)
    }
    if (currentFamily && currentFamily.id) {
      families[currentFamily.id] = currentFamily
    }

    // Convert families to relationships
    Object.values(families).forEach((family: any) => {
      // Spouse relationships
      if (family.husb && family.wife) {
        relationships.push({
          rel_type: 'spouse',
          a_id: family.husb,
          b_id: family.wife,
          family_id: family.id,
          note: ''
        })
      }

      // Parent-child relationships
      family.children.forEach((childId: string) => {
        if (family.husb) {
          relationships.push({
            rel_type: 'parent',
            a_id: family.husb,
            b_id: childId,
            family_id: family.id,
            note: 'father->child'
          })
        }
        if (family.wife) {
          relationships.push({
            rel_type: 'parent',
            a_id: family.wife,
            b_id: childId,
            family_id: family.id,
            note: 'mother->child'
          })
        }
      })
    })

    return { people, relationships }
  }

  // Parse name in GEDCOM format "Given /Surname/"
  static parseName(nameStr: string): { given: string, surname: string } {
    const match = nameStr.match(/^(.+?)\s*\/(.+?)\/?\s*$/)
    if (match) {
      return {
        given: match[1].trim(),
        surname: match[2].trim()
      }
    }
    // Fallback for names without surname markers
    const parts = nameStr.split(' ')
    return {
      given: parts[0] || '',
      surname: parts.slice(1).join(' ')
    }
  }

  // Preview import and detect duplicates
  static async previewImport(
    gedcomContent: string, 
    familyId: string
  ): Promise<ImportPreview> {
    const { people, relationships } = this.parseGedcom(gedcomContent)
    
    // Get existing people for duplicate detection
    const { data: existingPeople } = await supabase
      .from('tree_people')
      .select('*')
      .eq('family_id', familyId)

    const duplicates: PersonMatch[] = []

    if (existingPeople) {
      people.forEach(incomingPerson => {
        const matches = this.findPotentialMatches(incomingPerson, existingPeople)
        duplicates.push(...matches)
      })
    }

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

  // Find potential duplicate matches
  static findPotentialMatches(
    incoming: GedcomPerson, 
    existing: TreePerson[]
  ): PersonMatch[] {
    const matches: PersonMatch[] = []

    existing.forEach(existingPerson => {
      const matchReasons: string[] = []
      let confidence = 0

      // Name matching
      const incomingName = `${incoming.given_name || ''} ${incoming.surname || ''}`.toLowerCase().trim()
      const existingName = `${existingPerson.given_name || ''} ${existingPerson.surname || ''}`.toLowerCase().trim()
      
      if (incomingName === existingName && incomingName.length > 0) {
        confidence += 50
        matchReasons.push('Exact name match')
      } else if (this.fuzzyNameMatch(incomingName, existingName)) {
        confidence += 30
        matchReasons.push('Similar name')
      }

      // Birth year matching (if both have dates)
      if (incoming.birth_date && existingPerson.birth_date) {
        const incomingYear = this.extractYear(incoming.birth_date)
        const existingYear = this.extractYear(existingPerson.birth_date)
        
        if (incomingYear && existingYear) {
          const yearDiff = Math.abs(incomingYear - existingYear)
          if (yearDiff === 0) {
            confidence += 40
            matchReasons.push('Same birth year')
          } else if (yearDiff <= 1) {
            confidence += 20
            matchReasons.push('Similar birth year')
          }
        }
      }

      // Sex matching
      if (incoming.sex && existingPerson.sex && incoming.sex === existingPerson.sex) {
        confidence += 10
        matchReasons.push('Same sex')
      }

      // Only include potential matches above threshold
      if (confidence >= 40) {
        matches.push({
          incoming,
          existing: existingPerson,
          confidence,
          matchReasons
        })
      }
    })

    return matches.sort((a, b) => b.confidence - a.confidence)
  }

  // Fuzzy name matching
  static fuzzyNameMatch(name1: string, name2: string): boolean {
    // Simple fuzzy matching - could be enhanced with better algorithms
    const words1 = name1.split(' ').filter(w => w.length > 1)
    const words2 = name2.split(' ').filter(w => w.length > 1)
    
    const commonWords = words1.filter(w1 => 
      words2.some(w2 => w1.includes(w2) || w2.includes(w1))
    )
    
    return commonWords.length >= Math.min(words1.length, words2.length) / 2
  }

  // Extract year from various date formats
  static extractYear(dateStr: string): number | null {
    const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/)
    return yearMatch ? parseInt(yearMatch[0]) : null
  }

  // Commit import after user approval
  static async commitImport(
    preview: ImportPreview,
    familyId: string,
    userId: string,
    mergeDecisions: Record<string, 'merge' | 'skip' | 'new'> = {}
  ): Promise<TreeImport> {
    // Create import record
    const { data: importRecord, error: importError } = await supabase
      .from('tree_imports')
      .insert({
        family_id: familyId,
        imported_by: userId,
        import_type: 'gedcom',
        status: 'processing',
        people_count: preview.peopleCount,
        families_count: preview.familiesCount
      })
      .select()
      .single()

    if (importError) throw importError

    try {
      const personIdMap: Record<string, string> = {}

      // Process people first
      for (const person of preview.people) {
        const decision = mergeDecisions[person.person_id] || 'new'
        
        if (decision === 'skip') continue

        if (decision === 'merge') {
          // Find the existing person to merge with
          const duplicate = preview.duplicates.find(d => d.incoming.person_id === person.person_id)
          if (duplicate) {
            personIdMap[person.person_id] = duplicate.existing.id
            // Optionally update existing person with new data
            continue
          }
        }

        // Create new person
        const { data: newPerson, error } = await supabase
          .from('tree_people')
          .insert({
            family_id: familyId,
            given_name: person.given_name,
            surname: person.surname,
            sex: person.sex,
            birth_date: person.birth_date,
            death_date: person.death_date,
            is_living: person.is_living === 'Y',
            birth_place: person.birth_place,
            death_place: person.death_place,
            source_xref: person.person_id,
            created_by: userId
          })
          .select()
          .single()

        if (error) throw error
        personIdMap[person.person_id] = newPerson.id
      }

      // Process families and relationships
      const familyIdMap: Record<string, string> = {}
      const processedFamilies = new Set<string>()

      for (const rel of preview.relationships) {
        if (rel.rel_type === 'spouse' && !processedFamilies.has(rel.family_id)) {
          const partner1Id = personIdMap[rel.a_id]
          const partner2Id = personIdMap[rel.b_id]
          
          if (partner1Id && partner2Id) {
            const { data: newFamily, error } = await supabase
              .from('tree_families')
              .insert({
                family_id: familyId,
                partner1_id: partner1Id,
                partner2_id: partner2Id,
                relationship_type: 'married',
                source_xref: rel.family_id,
                created_by: userId
              })
              .select()
              .single()

            if (error) throw error
            familyIdMap[rel.family_id] = newFamily.id
            processedFamilies.add(rel.family_id)
          }
        }
      }

      // Process parent-child relationships
      for (const rel of preview.relationships) {
        if (rel.rel_type === 'parent') {
          const treeFamilyId = familyIdMap[rel.family_id]
          const childId = personIdMap[rel.b_id]
          
          if (treeFamilyId && childId) {
            await supabase
              .from('tree_family_children')
              .insert({
                family_id: treeFamilyId,
                child_id: childId
              })
          }
        }
      }

      // Mark import as completed
      await supabase
        .from('tree_imports')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', importRecord.id)

      return { ...importRecord, status: 'completed' }

    } catch (error) {
      // Mark import as failed
      await supabase
        .from('tree_imports')
        .update({ 
          status: 'failed',
          errors_log: [{ error: error.message, timestamp: new Date().toISOString() }]
        })
        .eq('id', importRecord.id)

      throw error
    }
  }
}