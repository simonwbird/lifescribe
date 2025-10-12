import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, Calendar, MapPin, Briefcase, GraduationCap, 
  Heart, Users, Languages, ChevronDown,
  ChevronUp, Edit, Link as LinkIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

interface QuickFact {
  icon: React.ElementType
  label: string
  value: string | string[]
  linkedEntityId?: string
  linkedEntityType?: 'person' | 'place' | 'school'
}

interface RelatedPerson {
  id: string
  name: string
  type: 'spouse' | 'child'
}

interface QuickFactsBlockProps {
  personId: string
  familyId: string
  person: {
    id: string
    full_name: string
    preferred_name?: string
    birth_date?: string
    death_date?: string
    alt_names?: string[]
    status: 'living' | 'passed'
    gender?: string
  }
  blockContent: {
    birth_place?: string
    death_place?: string
    occupations?: string[]
    schools?: Array<{ name: string; id?: string }>
    notable_places?: Array<{ name: string; id?: string }>
    languages?: string[]
    overrides?: Record<string, any>
  }
  canEdit: boolean
  onUpdate?: () => void
}

export default function QuickFactsBlock({
  personId,
  familyId,
  person,
  blockContent,
  canEdit,
  onUpdate
}: QuickFactsBlockProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [relatedPeople, setRelatedPeople] = useState<RelatedPerson[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadRelatedPeople()
  }, [personId])

  const loadRelatedPeople = async () => {
    try {
      setLoading(true)
      
      // Get spouses (spouse relationship)
      const { data: spouseRels, error: spouseError } = await supabase
        .from('relationships')
        .select(`
          id,
          from_person_id,
          to_person_id,
          relationship_type,
          from_person:people!relationships_from_person_id_fkey(id, full_name),
          to_person:people!relationships_to_person_id_fkey(id, full_name)
        `)
        .eq('relationship_type', 'spouse')
        .or(`from_person_id.eq.${personId},to_person_id.eq.${personId}`)

      if (spouseError) throw spouseError

      // Get children (parent relationship where this person is the parent)
      const { data: childRels, error: childError } = await supabase
        .from('relationships')
        .select(`
          id,
          to_person_id,
          to_person:people!relationships_to_person_id_fkey(id, full_name)
        `)
        .eq('relationship_type', 'parent')
        .eq('from_person_id', personId)

      if (childError) throw childError

      const related: RelatedPerson[] = []

      // Process spouses
      if (spouseRels) {
        spouseRels.forEach(rel => {
          const spouse = rel.from_person_id === personId 
            ? rel.to_person
            : rel.from_person
          if (spouse) {
            related.push({
              id: spouse.id,
              name: spouse.full_name,
              type: 'spouse'
            })
          }
        })
      }

      // Process children
      if (childRels) {
        childRels.forEach(rel => {
          if (rel.to_person) {
            related.push({
              id: rel.to_person.id,
              name: rel.to_person.full_name,
              type: 'child'
            })
          }
        })
      }

      setRelatedPeople(related)
    } catch (error) {
      console.error('Error loading related people:', error)
      toast({
        title: 'Error',
        description: 'Failed to load related people',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const facts: QuickFact[] = []

  // Also known as (from alt_names)
  if (person.alt_names && person.alt_names.length > 0) {
    facts.push({ 
      icon: User, 
      label: 'Also known as', 
      value: person.alt_names 
    })
  }

  // Preferred name
  if (person.preferred_name && person.preferred_name !== person.full_name) {
    facts.push({ 
      icon: User, 
      label: 'Known as', 
      value: person.preferred_name 
    })
  }

  // Birth date and place
  if (person.birth_date) {
    const birthValue = blockContent.birth_place 
      ? `${format(new Date(person.birth_date), 'MMMM d, yyyy')} in ${blockContent.birth_place}`
      : format(new Date(person.birth_date), 'MMMM d, yyyy')
    facts.push({ icon: Calendar, label: 'Born', value: birthValue })
  }

  // Death date and place (if passed)
  if (person.status === 'passed' && person.death_date) {
    const deathValue = blockContent.death_place
      ? `${format(new Date(person.death_date), 'MMMM d, yyyy')} in ${blockContent.death_place}`
      : format(new Date(person.death_date), 'MMMM d, yyyy')
    facts.push({ icon: Calendar, label: 'Died', value: deathValue })
  }

  // Occupations
  if (blockContent.occupations && blockContent.occupations.length > 0) {
    facts.push({ 
      icon: Briefcase, 
      label: blockContent.occupations.length === 1 ? 'Occupation' : 'Occupations', 
      value: blockContent.occupations 
    })
  }

  // Schools
  if (blockContent.schools && blockContent.schools.length > 0) {
    blockContent.schools.forEach(school => {
      facts.push({
        icon: GraduationCap,
        label: 'Education',
        value: school.name,
        linkedEntityId: school.id,
        linkedEntityType: 'school'
      })
    })
  }

  // Spouses (from database)
  const spouses = relatedPeople.filter(p => p.type === 'spouse')
  if (spouses.length > 0) {
    spouses.forEach(spouse => {
      facts.push({
        icon: Heart,
        label: 'Spouse',
        value: spouse.name,
        linkedEntityId: spouse.id,
        linkedEntityType: 'person'
      })
    })
  }

  // Children (from database)
  const children = relatedPeople.filter(p => p.type === 'child')
  if (children.length > 0) {
    children.forEach(child => {
      facts.push({
        icon: Users,
        label: 'Child',
        value: child.name,
        linkedEntityId: child.id,
        linkedEntityType: 'person'
      })
    })
  }

  // Notable places
  if (blockContent.notable_places && blockContent.notable_places.length > 0) {
    blockContent.notable_places.forEach(place => {
      facts.push({
        icon: MapPin,
        label: 'Notable place',
        value: place.name,
        linkedEntityId: place.id,
        linkedEntityType: 'place'
      })
    })
  }

  // Languages
  if (blockContent.languages && blockContent.languages.length > 0) {
    facts.push({ 
      icon: Languages, 
      label: blockContent.languages.length === 1 ? 'Language' : 'Languages', 
      value: blockContent.languages 
    })
  }

  const handleEntityClick = (fact: QuickFact) => {
    if (!fact.linkedEntityId) return

    switch (fact.linkedEntityType) {
      case 'person':
        navigate(`/people/${fact.linkedEntityId}`)
        break
      case 'place':
        // Navigate to place page when implemented
        toast({
          title: 'Coming soon',
          description: 'Place pages are not yet implemented'
        })
        break
      case 'school':
        // Navigate to school page when implemented
        toast({
          title: 'Coming soon',
          description: 'School pages are not yet implemented'
        })
        break
    }
  }

  return (
    <Card className="sticky top-4 h-fit border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Quick Facts</CardTitle>
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0"
                onClick={onUpdate}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {/* Toggle button for mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 lg:hidden"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Expand quick facts' : 'Collapse quick facts'}
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent 
        className={`space-y-3 ${isCollapsed ? 'hidden lg:block' : 'block'}`}
      >
        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            Loading...
          </div>
        ) : facts.length === 0 ? (
          <div className="text-center py-6 px-4">
            <p className="text-sm text-muted-foreground">
              Add a few facts so visitors can place this life in time and place.
            </p>
            {canEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={onUpdate}
              >
                <Edit className="h-4 w-4 mr-2" />
                Add Facts
              </Button>
            )}
          </div>
        ) : (
          facts.map((fact, index) => {
            const Icon = fact.icon
            const values = Array.isArray(fact.value) ? fact.value : [fact.value]

            return (
              <div key={index}>
                {index > 0 && <Separator className="my-3" />}
                <div className="flex items-start gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {fact.label}
                    </p>
                    <div className="space-y-1">
                      {values.map((value, idx) => (
                        <div key={idx}>
                          {fact.linkedEntityId ? (
                            <button
                              onClick={() => handleEntityClick(fact)}
                              className="text-sm text-primary hover:underline flex items-center gap-1 group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                            >
                              <span>{value}</span>
                              <LinkIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ) : values.length > 1 ? (
                            <Badge variant="secondary" className="text-xs mr-1 mb-1">
                              {value}
                            </Badge>
                          ) : (
                            <p className="text-sm text-foreground">{value}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
