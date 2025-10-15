import { Pet } from '@/lib/petTypes'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { Rainbow } from 'lucide-react'

interface RainbowPetCardProps {
  pet: Pet
}

export function RainbowPetCard({ pet }: RainbowPetCardProps) {
  const petInitial = pet.name.charAt(0).toUpperCase()

  return (
    <Link to={`/pets/${pet.id}`}>
      <Card className="group relative overflow-hidden transition-all hover:shadow-lg bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-amber-50/50 dark:from-purple-950/20 dark:via-pink-950/10 dark:to-amber-950/20 border-purple-200/50 dark:border-purple-800/30">
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800">
            <Rainbow className="h-3 w-3 mr-1" />
            Rainbow Bridge
          </Badge>
        </div>

        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 ring-2 ring-purple-200/50 dark:ring-purple-800/30 opacity-75">
                <AvatarImage 
                  src={pet.coverUrl} 
                  alt={pet.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-900 to-pink-900 text-purple-900 dark:text-purple-100">
                  {petInitial}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-purple-100 dark:bg-purple-900 rounded-full p-1">
                <Rainbow className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                {pet.name}
              </h3>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {pet.breed || pet.species}
                </p>
                {pet.passedAt && (
                  <p className="text-xs text-muted-foreground italic">
                    Remembered with love
                  </p>
                )}
              </div>

              {pet.memoryMessage && (
                <p className="mt-3 text-sm text-muted-foreground italic line-clamp-2 border-l-2 border-purple-300 dark:border-purple-700 pl-3">
                  "{pet.memoryMessage}"
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-purple-200/50 dark:border-purple-800/30">
            <p className="text-xs text-center text-muted-foreground italic">
              Forever part of the family 💜
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
