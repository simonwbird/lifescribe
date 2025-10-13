import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { TopBar } from '@/components/home/TopBar'
import { HeroStrip } from '@/components/home/HeroStrip'
import { Skeleton } from '@/components/ui/skeleton'

export default function HomeV2() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [familyId, setFamilyId] = useState<string>('')

  useEffect(() => {
    loadUserAndFamily()
  }, [])

  async function loadUserAndFamily() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }
      setUserId(user.id)

      // Get family from URL param or first membership
      const paramFamily = searchParams.get('family')
      if (paramFamily) {
        setFamilyId(paramFamily)
      } else {
        const { data: membership } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .limit(1)
          .single()

        if (membership) {
          setFamilyId(membership.family_id)
        }
      }
    } catch (error) {
      console.error('Error loading home:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-14 border-b bg-background/95">
          <div className="container flex h-14 items-center px-4 gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 flex-1 max-w-lg" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="container px-4 py-6">
          <div className="grid gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!familyId || !userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Family Found</h1>
          <p className="text-muted-foreground mb-4">
            You need to be part of a family to use this app.
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="text-primary hover:underline"
          >
            Get Started
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar familyId={familyId} userId={userId} />
      <HeroStrip familyId={familyId} userId={userId} />

      {/* Feed will go here - out of scope for this task */}
      <div className="container px-4 py-8">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Family feed coming soon...</p>
        </div>
      </div>
    </div>
  )
}
