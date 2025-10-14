import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { AppLayout } from '@/components/layouts/AppLayout'
import { TopBar } from '@/components/home/TopBar'
import { HeroStrip } from '@/components/home/HeroStrip'
import { SmartFeed } from '@/components/home/SmartFeed'
import { VoiceCapture } from '@/components/home/VoiceCapture'
import RightRail from '@/components/home/RightRail'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Mic } from 'lucide-react'
import ElderModeView from '@/components/elder/ElderModeView'
import { useElderMode } from '@/hooks/useElderMode'

export default function HomeV2() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [familyId, setFamilyId] = useState<string>('')
  const [showVoiceCapture, setShowVoiceCapture] = useState(false)
  const { isElderMode, phoneCode, isLoading: elderModeLoading } = useElderMode(userId)

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

  if (loading || elderModeLoading) {
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

  // Show Elder Mode if enabled
  if (isElderMode && phoneCode) {
    return <ElderModeView userId={userId} familyId={familyId} phoneCode={phoneCode} />
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
    <AppLayout showHeader={false}>
      <div className="min-h-screen bg-background">
        <TopBar familyId={familyId} userId={userId} />
        <HeroStrip 
          familyId={familyId} 
          userId={userId} 
          isElderMode={isElderMode}
          onOpenVoiceCapture={() => setShowVoiceCapture(true)}
        />

        {/* Two-column layout: Feed + Right Rail */}
        <div className="container px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,680px)_320px] gap-6 max-w-[1100px] mx-auto">
            {/* Left: Main Feed */}
            <div className="space-y-4 min-w-0">
              {/* Voice Capture Toggle */}
              {!showVoiceCapture && (
                <Button 
                  onClick={() => setShowVoiceCapture(true)}
                  variant="outline"
                  className="w-full gap-2 border-dashed"
                >
                  <Mic className="h-4 w-4" />
                  Record Voice Note
                </Button>
              )}

              {/* Inline Voice Capture */}
              {showVoiceCapture && (
                <VoiceCapture
                  familyId={familyId}
                  userId={userId}
                  onPublished={() => setShowVoiceCapture(false)}
                  onCancel={() => setShowVoiceCapture(false)}
                />
              )}

              <SmartFeed familyId={familyId} userId={userId} />
            </div>

            {/* Right: Widgets Rail */}
            <aside className="hidden lg:block">
              <div className="sticky top-20">
                <RightRail />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
