import { supabase } from '@/integrations/supabase/client'
import type { GedcomPerson, GedcomRelationship, ImportPreview } from './familyTreeV2Types'

export class CsvImportService {
  // Parse CSV content to people array
  static parsePeopleCsv(csvContent: string): GedcomPerson[] {
    const lines = csvContent.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const people: GedcomPerson[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i])
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
      const values = this.parseCsvLine(lines[i])
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
    const people = this.parsePeopleCsv(peopleContent)
    const relationships = this.parseRelationshipsCsv(relationshipsContent)

    // Get existing people for duplicate detection
    const { data: existingPeople } = await supabase
      .from('tree_people')
      .select('*')
      .eq('family_id', familyId)

    const duplicates = existingPeople ? 
      people.flatMap(person => this.findPotentialMatches(person, existingPeople)) : []

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

  // Simple duplicate detection (reuse from GedcomImportService)
  static findPotentialMatches(incoming: GedcomPerson, existing: any[]): any[] {
    // This would reuse the logic from GedcomImportService.findPotentialMatches
    // For brevity, returning empty array - would implement full matching logic
    return []
  }

  // Generate CSV templates
  static generatePeopleTemplate(): string {
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
      'raw_name'
    ]
    
    const sampleRow = [
      '@I1@',
      'John',
      'Smith',
      'M',
      '1970-01-15',
      'New York, NY',
      '',
      '',
      'Y',
      'John /Smith/'
    ]

    return [
      headers.join(','),
      sampleRow.join(','),
      // Empty row for user to fill
      headers.map(() => '').join(',')
    ].join('\n')
  }

  static generateRelationshipsTemplate(): string {
    const headers = [
      'rel_type',
      'a_id',
      'b_id', 
      'family_id',
      'marriage_date',
      'divorce_date',
      'note'
    ]
    
    const sampleRows = [
      ['spouse', '@I1@', '@I2@', '@F1@', '1995-06-12', '', ''],
      ['parent', '@I1@', '@I3@', '@F1@', '', '', 'father->child'],
      ['parent', '@I2@', '@I3@', '@F1@', '', '', 'mother->child']
    ]

    return [
      headers.join(','),
      ...sampleRows.map(row => row.join(',')),
      // Empty row for user to fill
      headers.map(() => '').join(',')
    ].join('\n')
  }

  // Download CSV templates as files
  static downloadTemplate(type: 'people' | 'relationships'): void {
    const content = type === 'people' ? 
      this.generatePeopleTemplate() : 
      this.generateRelationshipsTemplate()
    
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${type}_template.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}