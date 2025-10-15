import { Pet } from '@/lib/petTypes'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { PlusCircle, Camera, Edit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { routes } from '@/lib/routes'
import { format, differenceInMonths, differenceInYears } from 'date-fns'

interface PetHeaderProps {
  pet: Pet
}

export function PetHeader({ pet }: PetHeaderProps) {
  const navigate = useNavigate()

  const calculateAge = () => {
    if (!pet.dobApprox && !pet.gotchaDate) return null
    const date = pet.dobApprox ? new Date(pet.dobApprox) : new Date(pet.gotchaDate!)
    const years = differenceInYears(new Date(), date)
    const months = differenceInMonths(new Date(), date) % 12
    
    if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`
    return `${years} year${years !== 1 ? 's' : ''}${months > 0 ? ` ${months}mo` : ''}`
  }

  const age = calculateAge()

  return (
    <div className="bg-card border-b">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={pet.coverUrl} />
            <AvatarFallback className="text-2xl">
              {pet.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold mb-1">{pet.name}</h1>
            <p className="text-muted-foreground mb-2">
              {pet.breed ? `${pet.breed} • ` : ''}
              {pet.species.charAt(0).toUpperCase() + pet.species.slice(1).replace('-', ' ')}
              {age && ` • ${age}`}
            </p>
            {pet.gotchaDate && (
              <p className="text-sm text-muted-foreground">
                Gotcha day: {format(new Date(pet.gotchaDate), 'MMMM d, yyyy')}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(routes.storyNew({ petId: pet.id }))}
              size="sm"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Story
            </Button>
            <Button
              onClick={() => navigate(routes.storyNew({ tab: 'photo', petId: pet.id }))}
              variant="outline"
              size="sm"
            >
              <Camera className="h-4 w-4 mr-2" />
              Add Photo
            </Button>
            <Button
              onClick={() => navigate(routes.petEdit(pet.id))}
              variant="ghost"
              size="sm"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
