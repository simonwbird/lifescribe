import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ExternalLink, MessageSquare, Camera, Edit3, Calendar, Heart } from 'lucide-react'
import SuggestEditModal from './SuggestEditModal'
import type { Person } from '@/lib/familyTreeTypes'

interface PeopleDirectoryProps {
  people: Person[]
  familyId: string
}

export default function PeopleDirectory({ people, familyId }: PeopleDirectoryProps) {
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null)

  const calculateAge = (birthDate: string | null, deathDate: string | null, isLiving: boolean) => {
    if (!birthDate) return null
    
    const birth = new Date(birthDate)
    const compareDate = deathDate ? new Date(deathDate) : new Date()
    
    const age = compareDate.getFullYear() - birth.getFullYear()
    const monthDiff = compareDate.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && compareDate.getDate() < birth.getDate())) {
      return age - 1
    }
    
    return age
  }

  const calculateDaysUntilBirthday = (birthDate: string | null) => {
    if (!birthDate) return null
    
    const birth = new Date(birthDate)
    const today = new Date()
    const thisYear = today.getFullYear()
    
    // Handle Feb 29 on non-leap years
    let nextBirthday = new Date(thisYear, birth.getMonth(), birth.getDate())
    if (birth.getMonth() === 1 && birth.getDate() === 29 && !isLeapYear(thisYear)) {
      nextBirthday = new Date(thisYear, 1, 28) // Feb 28
    }
    
    if (nextBirthday < today) {
      const nextYear = thisYear + 1
      nextBirthday = new Date(nextYear, birth.getMonth(), birth.getDate())
      if (birth.getMonth() === 1 && birth.getDate() === 29 && !isLeapYear(nextYear)) {
        nextBirthday = new Date(nextYear, 1, 28)
      }
    }
    
    const diffTime = nextBirthday.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const isLeapYear = (year: number) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  }

  const getStatusBadge = (person: any) => {
    if (person.is_living === false) {
      return <Badge variant="secondary">Deceased</Badge>
    }
    
    if (person.account_status === 'joined') {
      return <Badge variant="default">Joined</Badge>
    } else if (person.account_status === 'invited') {
      return <Badge variant="outline">Invited</Badge>
    } else {
      return <Badge variant="secondary">Not on app</Badge>
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {people.map((person) => {
          const age = calculateAge(person.birth_date, person.death_date, person.is_living !== false)
          const daysUntilBirthday = person.is_living !== false ? calculateDaysUntilBirthday(person.birth_date) : null
          
          return (
            <Card key={person.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="text-center pb-3">
                <Avatar className="h-16 w-16 mx-auto mb-3">
                  <AvatarImage src={person.avatar_url || ''} />
                  <AvatarFallback className="text-lg">
                    {getInitials(person.full_name || 'Unknown')}
                  </AvatarFallback>
                </Avatar>
                
                <CardTitle className="text-lg">{person.full_name}</CardTitle>
                
                <div className="space-y-2">
                  {person.birth_date && (
                    <CardDescription>
                      {person.is_living === false && person.death_date ? (
                        <>
                          {new Date(person.birth_date).getFullYear()} - {new Date(person.death_date).getFullYear()}
                          {age !== null && <div className="text-xs">Would be {age}</div>}
                        </>
                      ) : person.birth_date ? (
                        <>
                          Born {new Date(person.birth_date).getFullYear()}
                          {age !== null && <div className="text-xs">{age} years old</div>}
                        </>
                      ) : null}
                    </CardDescription>
                  )}
                  
                  {person.is_living === false && (
                    <div className="flex items-center justify-center text-xs text-muted-foreground">
                      <Heart className="h-3 w-3 mr-1" />
                      In memoriam
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Status Badge */}
                <div className="flex justify-center">
                  {getStatusBadge(person)}
                </div>
                
                {/* Upcoming Birthday */}
                {daysUntilBirthday !== null && (
                  <div className="flex justify-center">
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {daysUntilBirthday === 0 ? 'Birthday today!' : `Birthday in ${daysUntilBirthday} days`}
                    </Badge>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/people/${person.id}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Wall
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Suggest Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Suggest Edit for {person.full_name}</DialogTitle>
                      </DialogHeader>
                      <SuggestEditModal
                        person={person}
                        familyId={familyId}
                        onClose={() => {}}
                        onSuccess={() => {}}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/stories/new?person=${person.id}`, '_blank')}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Write Note
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/capture?person=${person.id}`, '_blank')}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Add Photo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {people.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>No People Found</CardTitle>
            <CardDescription>
              Try adjusting your search or filter criteria.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}