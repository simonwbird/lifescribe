import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import StoryCard from '@/components/StoryCard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Link as LinkIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Story, Profile } from '@/lib/types'
import { AttachToEntityModal } from '@/components/entity/AttachToEntityModal'
import { StoryComments } from '@/components/story/StoryComments'

export default function StoryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [story, setStory] = useState<(Story & { profiles: Profile }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [attachModalOpen, setAttachModalOpen] = useState(false)

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
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!story) {
    return (
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
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setAttachModalOpen(true)}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Add to Person
            </Button>
          </div>
          
          <StoryCard story={story} />
          
          {/* Comments Section */}
          <div className="mt-6">
            <StoryComments 
              storyId={story.id}
              familyId={story.family_id}
            />
          </div>
        </div>
      </div>

      {story && (
        <AttachToEntityModal
          open={attachModalOpen}
          onOpenChange={setAttachModalOpen}
          contentType="story"
          contentId={story.id}
          familyId={story.family_id}
        />
      )}
    </div>
  )
}