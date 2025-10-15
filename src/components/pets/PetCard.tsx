import { memo } from 'react'
import { Link } from 'react-router-dom'
import { Pet } from '@/lib/petTypes'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  PawPrint, 
  Plus, 
  Edit, 
  MoreHorizontal,
  Calendar,
  AlertCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { differenceInYears, differenceInMonths, parseISO } from 'date-fns'

interface PetCardProps {
  pet: Pet
}

export const PetCard = memo(function PetCard({ pet }: PetCardProps) {
  // Calculate age from birth date or gotcha date
  const getAge = () => {
    const dateStr = pet.dobApprox || pet.gotchaDate
    if (!dateStr) return null
    
    try {
      const date = parseISO(dateStr)
      const years = differenceInYears(new Date(), date)
      const months = differenceInMonths(new Date(), date) % 12
      
      if (years === 0) {
        return `${months}mo`
      }
      return months > 0 ? `${years}y ${months}mo` : `${years}y`
    } catch {
      return null
    }
  }

  // Get species icon or use default
  const getSpeciesIcon = () => {
    return <PawPrint className="w-5 h-5 text-muted-foreground" />
  }

  const age = getAge()
  const displayName = pet.name || 'Unnamed Pet'
  const displaySpecies = typeof pet.species === 'string' 
    ? pet.species.charAt(0).toUpperCase() + pet.species.slice(1).replace(/-/g, ' ')
    : 'Pet'
  const displayBreed = pet.breed ? ` · ${pet.breed}` : ''

  const hasAllergies = pet.health?.allergies && pet.health.allergies.trim().length > 0
  const hasMedications = pet.health?.medications && pet.health.medications.trim().length > 0
  const hasReminders = pet.reminders && pet.reminders.filter(r => r.status === 'upcoming' || r.status === 'overdue').length > 0

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header with avatar and actions */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="w-16 h-16 border-2 border-border">
            {pet.coverUrl ? (
              <AvatarImage src={pet.coverUrl} alt={displayName} />
            ) : (
              <AvatarFallback className="bg-muted">
                {getSpeciesIcon()}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1 min-w-0">
            <Link 
              to={`/pets/${pet.id}`}
              className="font-serif font-semibold text-h5 text-foreground hover:text-brand-700 transition-colors"
            >
              {displayName}
            </Link>
            <p className="text-body-sm text-muted-foreground">
              {displaySpecies}{displayBreed}
            </p>
            {age && (
              <p className="text-meta text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" />
                {age}
              </p>
            )}
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
                <span className="sr-only">More actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/pets/${pet.id}`}>View Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/compose?type=story&petId=${pet.id}`}>Add Story</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/pets/${pet.id}/edit`}>Edit</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {hasAllergies && (
            <Badge variant="outline" className="text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              Allergies
            </Badge>
          )}
          {hasMedications && (
            <Badge variant="outline" className="text-xs">
              Medications
            </Badge>
          )}
          {hasReminders && (
            <Badge variant="outline" className="text-xs border-warning text-warning">
              Reminder Due
            </Badge>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <Button 
            asChild 
            variant="outline" 
            size="sm" 
            className="flex-1"
          >
            <Link to={`/pets/${pet.id}`}>
              View
            </Link>
          </Button>
          <Button 
            asChild 
            variant="default" 
            size="sm"
            className="flex-1"
          >
            <Link to={`/compose?type=story&petId=${pet.id}`}>
              <Plus className="w-4 h-4 mr-1" />
              Add Story
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
})
