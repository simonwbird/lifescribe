import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { FeedGrid } from '@/components/feed/FeedGrid'
import { getCurrentSpaceId } from '@/lib/spaceUtils'
import { useAnalytics } from '@/hooks/useAnalytics'
import { PrivacyBadge } from '@/components/ui/privacy-badge'
import { MissingContentBanner } from '@/components/audit/MissingContentBanner'
import { DiscoveryModeBanner } from '@/components/discovery/DiscoveryModeBanner'
import { useIsUnder13 } from '@/hooks/useUserAge'

export default function FeedPage() {
  const [familyId, setFamilyId] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const { track } = useAnalytics()
  const isUnder13 = useIsUnder13()

  useEffect(() => {
    initializePage()
  }, [])

  const initializePage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setCurrentUserId(user.id)

      const spaceId = await getCurrentSpaceId()
      if (!spaceId) return

      setFamilyId(spaceId)
    } catch (error) {
      console.error('Error initializing feed page:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-6"></div>
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-heritage-gray-dark">Family Feed</h1>
          <div className="flex items-center gap-3">
            <p className="text-heritage-gray">
              Stay connected with your family's latest stories and memories
            </p>
            <PrivacyBadge size="sm" />
          </div>
        </div>

        <DiscoveryModeBanner isUnder13={isUnder13} />

        <MissingContentBanner familyId={familyId} />

        <FeedGrid
          familyId={familyId} 
          currentUserId={currentUserId} 
        />
      </main>
    </div>
  )
}