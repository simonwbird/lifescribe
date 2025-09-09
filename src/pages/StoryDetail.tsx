import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import StoryCard from '@/components/StoryCard'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Story, Profile } from '@/lib/types'

export default function StoryDetail() {
  const { id } = useParams<{ id: string }>()
  const [story, setStory] = useState<(Story & { profiles: Profile }) | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getStory = async () => {
      if (!id) return

      try {
        const { data } = await supabase
          .from('stories')
          .select(`
            *,
            profiles (*)
          `)
          .eq('id', id)
          .single()

        if (data) {
          setStory(data)
        }
      } catch (error) {
        console.error('Error fetching story:', error)
      } finally {
        setLoading(false)
      }
    }

    getStory()
  }, [id])

  if (loading) {
    return (
      <AuthGate>
        <div className="min-h-screen">
          <Header />
          <div className="container mx-auto px-4 py-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AuthGate>
    )
  }

  if (!story) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-2xl font-bold mb-4">Story Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The story you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Button asChild>
                <Link to="/feed">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Feed
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </AuthGate>
    )
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <Button variant="ghost" asChild>
                <Link to="/feed">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Feed
                </Link>
              </Button>
            </div>
            
            <StoryCard story={story} />
          </div>
        </div>
      </div>
    </AuthGate>
  )
}