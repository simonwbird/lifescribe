import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, AlertTriangle, Merge } from 'lucide-react'
import type { Person } from '@/lib/familyTreeTypes'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface DuplicateDetectorProps {
  people: Person[]
  onPersonsUpdated?: () => void
}

interface DuplicateGroup {
  name: string
  people: Person[]
  similarity: string
}

export function DuplicateDetector({ people, onPersonsUpdated }: DuplicateDetectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [merging, setMerging] = useState<string | null>(null)
  const { toast } = useToast()

  // Find potential duplicates based on name similarity and birth years
  const duplicateGroups = useMemo(() => {
    const groups: DuplicateGroup[] = []
    const processed = new Set<string>()

    for (const person of people) {
      if (processed.has(person.id)) continue

      const potentialDuplicates = people.filter(other => {
        if (other.id === person.id || processed.has(other.id)) return false
        
        // Check name similarity
        const personName = person.full_name?.toLowerCase() || ''
        const otherName = other.full_name?.toLowerCase() || ''
        
        if (personName === otherName) return true
        
        // Check if names are very similar (same first and last name)
        const personParts = personName.split(' ')
        const otherParts = otherName.split(' ')
        
        if (personParts.length >= 2 && otherParts.length >= 2) {
          const firstMatch = personParts[0] === otherParts[0]
          const lastMatch = personParts[personParts.length - 1] === otherParts[otherParts.length - 1]
          if (firstMatch && lastMatch) return true
        }
        
        return false
      })

      if (potentialDuplicates.length > 0) {
        const allInGroup = [person, ...potentialDuplicates]
        
        // Determine similarity reason
        let similarity = 'Exact name match'
        if (person.birth_year && potentialDuplicates.some(p => p.birth_year === person.birth_year)) {
          similarity = 'Same name and birth year'
        }
        
        groups.push({
          name: person.full_name || 'Unknown',
          people: allInGroup,
          similarity
        })
        
        // Mark all as processed
        allInGroup.forEach(p => processed.add(p.id))
      }
    }

    return groups
  }, [people])

  const mergePeople = async (groupId: string, primaryPerson: Person, duplicatePerson: Person) => {
    try {
      setMerging(groupId)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Update relationships that point to the duplicate
      await supabase
        .from('relationships')
        .update({ from_person_id: primaryPerson.id })
        .eq('from_person_id', duplicatePerson.id)

      await supabase
        .from('relationships')
        .update({ to_person_id: primaryPerson.id })
        .eq('to_person_id', duplicatePerson.id)

      // Update person-story links
      await supabase
        .from('person_story_links')
        .update({ person_id: primaryPerson.id })
        .eq('person_id', duplicatePerson.id)

      // Update person-user links
      await supabase
        .from('person_user_links')
        .update({ person_id: primaryPerson.id })
        .eq('person_id', duplicatePerson.id)

      // Delete the duplicate person
      await supabase
        .from('people')
        .delete()
        .eq('id', duplicatePerson.id)

      toast({
        title: "Success",
        description: `Merged duplicate records for ${primaryPerson.full_name}`,
      })

      onPersonsUpdated?.()
      
    } catch (error) {
      console.error('Error merging people:', error)
      toast({
        title: "Error", 
        description: "Failed to merge duplicate people",
        variant: "destructive"
      })
    } finally {
      setMerging(null)
    }
  }

  if (duplicateGroups.length === 0) {
    return (
      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription>
          No potential duplicates found in your family tree.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <AlertTriangle className="h-4 w-4" />
          Found {duplicateGroups.length} potential duplicate{duplicateGroups.length > 1 ? 's' : ''}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Duplicate People Detected</DialogTitle>
          <DialogDescription>
            We found {duplicateGroups.length} group{duplicateGroups.length > 1 ? 's' : ''} of potentially duplicate people. 
            Review and merge them to clean up your family tree.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {duplicateGroups.map((group, groupIndex) => (
            <Card key={groupIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {group.name}
                </CardTitle>
                <CardDescription>
                  <Badge variant="secondary">{group.similarity}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.people.map((person, personIndex) => (
                    <div key={person.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{person.full_name}</h4>
                          {person.birth_year && (
                            <p className="text-sm text-muted-foreground">
                              Born: {person.birth_year}
                            </p>
                          )}
                          {person.death_year && (
                            <p className="text-sm text-muted-foreground">
                              Died: {person.death_year}
                            </p>
                          )}
                        </div>
                        {personIndex === 0 && (
                          <Badge variant="default">Primary</Badge>
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(person.created_at || '').toLocaleDateString()}
                      </div>
                      
                      {personIndex > 0 && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="mt-2 w-full"
                          onClick={() => mergePeople(`${groupIndex}`, group.people[0], person)}
                          disabled={merging === `${groupIndex}`}
                        >
                          <Merge className="h-3 w-3 mr-1" />
                          {merging === `${groupIndex}` ? 'Merging...' : 'Merge into Primary'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}