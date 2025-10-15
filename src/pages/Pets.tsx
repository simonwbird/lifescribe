import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/layouts/AppLayout'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/design-system/EmptyState'
import { PetCard } from '@/components/pets/PetCard'
import { usePets } from '@/hooks/usePets'
import { supabase } from '@/integrations/supabase/client'
import { 
  PawPrint, 
  Plus, 
  Camera, 
  Video, 
  Mic, 
  PenLine,
  Heart,
  Stethoscope,
  BookMarked
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function Pets() {
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const { data: pets = [], isLoading } = usePets(familyId)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      // Get user's family
      const { data: members } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .limit(1)
        .single()

      if (members) {
        setFamilyId(members.family_id)
      }
    }

    loadUser()
  }, [])

  const hasPets = pets.length > 0

  return (
    <AppLayout>
      <main className="min-h-screen bg-neutral-canvas py-8">
        <div className="container max-w-[1100px] mx-auto px-4">
          {/* Header */}
          <header className="mb-8">
            <h1 className="font-serif text-h1 text-foreground mb-2">
              Pets
            </h1>
            <p className="text-body text-muted-foreground mb-6">
              All your family's animals in one cozy corner.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/pets/new">
                  <Plus className="w-5 h-5 mr-2" />
                  Add a Pet
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/compose?type=story&petId=select">
                  <PenLine className="w-5 h-5 mr-2" />
                  Record a Memory
                </Link>
              </Button>
            </div>
          </header>

          {/* Hero Value Panel */}
          <div className="bg-card rounded-2xl shadow-card p-8 mb-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-h5 text-foreground mb-1">
                    Profiles
                  </h3>
                  <p className="text-body-sm text-muted-foreground">
                    Photos, gotcha dates, and favorite memories
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <BookMarked className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-serif text-h5 text-foreground mb-1">
                    Memories
                  </h3>
                  <p className="text-body-sm text-muted-foreground">
                    Tag pets in stories, videos, and voice notes
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="font-serif text-h5 text-foreground mb-1">
                    Care & Health
                  </h3>
                  <p className="text-body-sm text-muted-foreground">
                    Allergies, medications, microchip, reminders
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* My Pets Section */}
          <section className="mb-12">
            <h2 className="font-serif text-h3 text-foreground mb-6">
              My Pets
            </h2>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-2xl p-6 space-y-4">
                    <div className="flex gap-4">
                      <Skeleton className="w-16 h-16 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 flex-1" />
                      <Skeleton className="h-9 flex-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hasPets ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pets.map((pet) => (
                  <PetCard key={pet.id} pet={pet} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<PawPrint className="w-6 h-6" />}
                title="No pets yet"
                description="Start building your family's pet collection by adding your first furry, feathered, or scaly friend."
                action={{
                  label: 'Add a Pet',
                  onClick: () => window.location.href = '/pets/new',
                  variant: 'default'
                }}
              />
            )}
          </section>

          {/* Quick Add Row */}
          {hasPets && (
            <section className="mb-12">
              <h2 className="font-serif text-h3 text-foreground mb-6">
                Quick Add
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  asChild
                  variant="outline"
                  className="h-24 flex-col gap-2"
                >
                  <Link to="/compose/photos?petId=select">
                    <Camera className="w-8 h-8" />
                    <span className="text-body-sm">Take Photo</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-24 flex-col gap-2"
                >
                  <Link to="/compose/video?petId=select">
                    <Video className="w-8 h-8" />
                    <span className="text-body-sm">Record Video</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-24 flex-col gap-2"
                >
                  <Link to="/compose/voice?petId=select">
                    <Mic className="w-8 h-8" />
                    <span className="text-body-sm">Voice Note</span>
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-24 flex-col gap-2"
                >
                  <Link to="/compose/text?petId=select">
                    <PenLine className="w-8 h-8" />
                    <span className="text-body-sm">Write Note</span>
                  </Link>
                </Button>
              </div>
            </section>
          )}

          {/* Recent Pet Stories - Placeholder for future implementation */}
          {hasPets && (
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-h3 text-foreground">
                  Recent Pet Stories
                </h2>
                <Button asChild variant="ghost">
                  <Link to="/stories?filter=pets">View all</Link>
                </Button>
              </div>
              
              <EmptyState
                title="No pet stories yet"
                description="Tag a pet in your first story to see it here."
                action={{
                  label: 'Start a Memory',
                  onClick: () => window.location.href = '/compose?type=story&petId=select',
                  variant: 'outline'
                }}
              />
            </section>
          )}
        </div>
      </main>
    </AppLayout>
  )
}
