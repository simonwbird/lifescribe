import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AppLayout } from '@/components/layouts/AppLayout'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/design-system/EmptyState'
import { supabase } from '@/integrations/supabase/client'
import { 
  Home, 
  Plus, 
  Camera, 
  Video, 
  Mic, 
  PenLine,
  FileText,
  Wrench,
  MapPin
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function Properties() {
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { data: members } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .limit(1)
        .single()

      if (members) {
        setFamilyId(members.family_id)
      }
      setIsLoading(false)
    }

    loadUser()
  }, [])

  return (
    <AppLayout>
      <main className="min-h-screen bg-neutral-canvas py-8">
        <div className="container max-w-[1100px] mx-auto px-4">
          {/* Header */}
          <header className="mb-8">
            <h1 className="font-serif text-h1 text-foreground mb-2">
              Properties
            </h1>
            <p className="text-body text-muted-foreground mb-6">
              Homes, rentals, and special places—documents, memories, and upkeep in one spot.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/properties/new">
                  <Plus className="w-5 h-5 mr-2" />
                  Add a Property
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/compose?type=story&propertyId=select">
                  <PenLine className="w-5 h-5 mr-2" />
                  Add a Memory
                </Link>
              </Button>
            </div>
          </header>

          {/* Hero Value Panel */}
          <div className="bg-card rounded-2xl shadow-card p-8 mb-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-h5 text-foreground mb-1">
                    Profile & Docs
                  </h3>
                  <p className="text-body-sm text-muted-foreground">
                    Address, photos, floorplan, and legal documents
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-serif text-h5 text-foreground mb-1">
                    Memories
                  </h3>
                  <p className="text-body-sm text-muted-foreground">
                    Stories, renovations, and before/after moments
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="font-serif text-h5 text-foreground mb-1">
                    Upkeep
                  </h3>
                  <p className="text-body-sm text-muted-foreground">
                    Reminders for servicing, warranties, and compliance
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* My Properties Section */}
          <section className="mb-12">
            <h2 className="font-serif text-h3 text-foreground mb-6">
              My Properties
            </h2>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card rounded-2xl overflow-hidden">
                    <Skeleton className="w-full aspect-video" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-9 flex-1" />
                        <Skeleton className="h-9 flex-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Home className="w-6 h-6" />}
                title="No properties yet"
                description="Start building your property collection by adding your first home or special place."
                action={{
                  label: 'Add a Property',
                  onClick: () => window.location.href = '/properties/new',
                  variant: 'default'
                }}
              />
            )}
          </section>

          {/* Quick Add Row */}
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
                <Link to="/compose/photos?propertyId=select">
                  <Camera className="w-8 h-8" />
                  <span className="text-body-sm">Take Photo</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-24 flex-col gap-2"
              >
                <Link to="/compose/video?propertyId=select">
                  <Video className="w-8 h-8" />
                  <span className="text-body-sm">Record Video</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-24 flex-col gap-2"
              >
                <Link to="/compose/voice?propertyId=select">
                  <Mic className="w-8 h-8" />
                  <span className="text-body-sm">Voice Note</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-24 flex-col gap-2"
              >
                <Link to="/compose/text?propertyId=select">
                  <PenLine className="w-8 h-8" />
                  <span className="text-body-sm">Write Note</span>
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </AppLayout>
  )
}
