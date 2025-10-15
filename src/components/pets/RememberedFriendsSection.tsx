import { Pet } from '@/lib/petTypes'
import { RainbowPetCard } from './RainbowPetCard'

interface RememberedFriendsSectionProps {
  pets: Pet[]
}

export function RememberedFriendsSection({ pets }: RememberedFriendsSectionProps) {
  if (pets.length === 0) return null

  return (
    <section className="mb-12">
      <div className="mb-6">
        <h2 className="font-serif text-h3 text-foreground mb-2">
          Remembered Friends
        </h2>
        <p className="text-body-sm text-muted-foreground">
          Cherished memories of beloved companions who've crossed the Rainbow Bridge
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.map((pet) => (
          <RainbowPetCard key={pet.id} pet={pet} />
        ))}
      </div>
    </section>
  )
}
