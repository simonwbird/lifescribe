import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, Calendar, MapPin, Briefcase, GraduationCap, 
  Heart, Users, Music, Utensils, Languages, ChevronDown,
  ChevronUp, Edit, Link as LinkIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

interface QuickFact {
  icon: React.ElementType
  label: string
  value: string | string[]
  linkedEntityId?: string
  linkedEntityType?: 'person' | 'place' | 'school'
}

interface QuickFactsBlockProps {
  person: {
    id: string
    full_name: string
    preferred_name?: string
    birth_date?: string
    death_date?: string
    birth_place?: string
    death_place?: string
    status: 'living' | 'passed'
  }
  blockContent: {
    maiden_name?: string
    aka?: string[]
    occupations?: string[]
    schools?: Array<{ name: string; id?: string }>
    spouses?: Array<{ name: string; id?: string }>
    children?: Array<{ name: string; id?: string }>
    notable_places?: Array<{ name: string; id?: string }>
    favorite_song?: string
    favorite_food?: string
    languages?: string[]
    overrides?: Record<string, any>
  }
  canEdit: boolean
  onUpdate?: () => void
}

export default function QuickFactsBlock({
  person,
  blockContent,
  canEdit,
  onUpdate
}: QuickFactsBlockProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const navigate = useNavigate()

  const facts: QuickFact[] = []

  // Full name with maiden/AKA
  let fullNameValue = person.full_name
  if (blockContent.maiden_name) {
    fullNameValue += ` (née ${blockContent.maiden_name})`
  }
  if (blockContent.aka && blockContent.aka.length > 0) {
    fullNameValue += ` • AKA: ${blockContent.aka.join(', ')}`
  }
  facts.push({ icon: User, label: 'Name', value: fullNameValue })

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
    const birthValue = person.birth_place 
      ? `${format(new Date(person.birth_date), 'MMMM d, yyyy')} in ${person.birth_place}`
      : format(new Date(person.birth_date), 'MMMM d, yyyy')
    facts.push({ icon: Calendar, label: 'Born', value: birthValue })
  }

  // Death date and place (if passed)
  if (person.status === 'passed' && person.death_date) {
    const deathValue = person.death_place
      ? `${format(new Date(person.death_date), 'MMMM d, yyyy')} in ${person.death_place}`
      : format(new Date(person.death_date), 'MMMM d, yyyy')
    facts.push({ icon: Calendar, label: 'Died', value: deathValue })
  }

  // Occupations
  if (blockContent.occupations && blockContent.occupations.length > 0) {
    facts.push({ 
      icon: Briefcase, 
      label: 'Occupation', 
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

  // Spouses
  if (blockContent.spouses && blockContent.spouses.length > 0) {
    blockContent.spouses.forEach(spouse => {
      facts.push({
        icon: Heart,
        label: 'Spouse',
        value: spouse.name,
        linkedEntityId: spouse.id,
        linkedEntityType: 'person'
      })
    })
  }

  // Children
  if (blockContent.children && blockContent.children.length > 0) {
    facts.push({
      icon: Users,
      label: 'Children',
      value: blockContent.children.map(c => c.name)
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

  // Favorite song
  if (blockContent.favorite_song) {
    facts.push({ 
      icon: Music, 
      label: 'Favorite song', 
      value: blockContent.favorite_song 
    })
  }

  // Favorite food
  if (blockContent.favorite_food) {
    facts.push({ 
      icon: Utensils, 
      label: 'Favorite food', 
      value: blockContent.favorite_food 
    })
  }

  // Languages
  if (blockContent.languages && blockContent.languages.length > 0) {
    facts.push({ 
      icon: Languages, 
      label: 'Languages', 
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
        console.log('Navigate to place:', fact.linkedEntityId)
        break
      case 'school':
        // Navigate to school page when implemented
        console.log('Navigate to school:', fact.linkedEntityId)
        break
    }
  }

  return (
    <Card className="sticky top-4 h-fit">
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
        {facts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No facts added yet
          </p>
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
                              className="text-sm text-primary hover:underline flex items-center gap-1 group"
                            >
                              <span>{value}</span>
                              <LinkIcon className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ) : values.length > 1 ? (
                            <Badge variant="secondary" className="text-xs">
                              {value}
                            </Badge>
                          ) : (
                            <p className="text-sm">{value}</p>
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
