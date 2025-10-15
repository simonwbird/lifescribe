import { Pet } from '@/lib/petTypes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart } from 'lucide-react'

interface PetFavoritesProps {
  pet: Pet
}

export function PetFavorites({ pet }: PetFavoritesProps) {
  if (!pet.favorites || pet.favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No favorites recorded yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Add {pet.name}'s favorite toys, treats, and activities
        </p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          {pet.name}'s Favorites
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {pet.favorites.map((favorite, index) => (
            <Badge key={index} variant="secondary">
              {favorite}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
