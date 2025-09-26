import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { FeedGrid } from '@/components/feed/FeedGrid'
import { getCurrentSpaceId } from '@/lib/spaceUtils'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function FeedPage() {
  const [familyId, setFamilyId] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const { track } = useAnalytics()

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
          <h1 className="text-3xl font-bold mb-2">Family Feed</h1>
          <p className="text-muted-foreground">
            Stay connected with your family's latest stories and memories
          </p>
        </div>

        <FeedGrid 
          familyId={familyId} 
          currentUserId={currentUserId} 
        />
      </main>
    </div>
  )
}