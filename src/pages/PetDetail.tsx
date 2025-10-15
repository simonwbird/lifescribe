import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { usePet } from '@/hooks/usePet'
import { PetHeader } from '@/components/pets/PetHeader'
import { PetTimeline } from '@/components/pets/PetTimeline'
import { PetGallery } from '@/components/pets/PetGallery'
import { PetCareHealth } from '@/components/pets/PetCareHealth'
import { PetFavorites } from '@/components/pets/PetFavorites'
import { PetReminders } from '@/components/pets/PetReminders'
import { PetRightRail } from '@/components/pets/PetRightRail'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import NotFound from './NotFound'

export default function PetDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [familyId, setFamilyId] = useState<string | null>(null)

  useEffect(() => {
    const loadFamily = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (member) {
        setFamilyId(member.family_id)
      }
    }

    loadFamily()
  }, [])

  const { data: pet, isLoading, error } = usePet(id || null, familyId)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !pet) {
    return <NotFound />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back button */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/pets')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pets
          </Button>
        </div>
      </div>

      {/* Header */}
      <PetHeader pet={pet} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                <TabsTrigger value="care">Care & Health</TabsTrigger>
                {pet.status !== 'rainbow' && (
                  <TabsTrigger value="reminders">Reminders</TabsTrigger>
                )}
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="mt-6">
                <PetTimeline pet={pet} />
              </TabsContent>

              <TabsContent value="gallery" className="mt-6">
                <PetGallery pet={pet} />
              </TabsContent>

              <TabsContent value="care" className="mt-6">
                <PetCareHealth pet={pet} />
              </TabsContent>

              {pet.status !== 'rainbow' && (
                <TabsContent value="reminders" className="mt-6">
                  <PetReminders petId={pet.id} petName={pet.name} />
                </TabsContent>
              )}

              <TabsContent value="favorites" className="mt-6">
                <PetFavorites pet={pet} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Rail */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <PetRightRail pet={pet} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
