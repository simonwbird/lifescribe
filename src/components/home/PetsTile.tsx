import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, PlusCircle, ArrowRight } from 'lucide-react'
import { usePets } from '@/hooks/usePets'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'

export function PetsTile() {
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

  const { data: pets, isLoading } = usePets(familyId)

  if (isLoading) {
    return (
      <Card className="bg-card hover:bg-accent/5 transition-colors">
        <CardContent className="p-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  const petCount = pets?.length || 0

  return (
    <Card 
      className="bg-card hover:bg-accent/5 transition-colors cursor-pointer group"
      onClick={() => navigate('/pets')}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Pets</h3>
              <p className="text-sm text-muted-foreground">
                {petCount === 0 && 'No pets yet'}
                {petCount === 1 && '1 pet'}
                {petCount > 1 && `${petCount} pets`}
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>

        {petCount === 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation()
              navigate('/pets/new')
            }}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Your First Pet
          </Button>
        ) : (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              View profiles & memories
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                navigate('/pets/new')
              }}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
