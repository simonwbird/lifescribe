import { useState, useEffect, useMemo } from 'react'
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
  const [processingState, setProcessingState] = useState<string>('ready')

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
          setProcessingState((data as any).processing_state || 'ready')
        }
      } catch (error) {
        console.error('Error fetching story:', error)
      } finally {
        setLoading(false)
      }
    }

    getStory()

    // Poll for processing updates if story is processing
    const pollInterval = setInterval(async () => {
      if (!id || processingState === 'ready') return

      const { data } = await supabase
        .from('stories')
        .select('processing_state')
        .eq('id', id)
        .single()

      if (data) {
        const newState = (data as any).processing_state || 'ready'
        setProcessingState(newState)
        if (newState === 'ready') {
          // Reload full story when processing completes
          getStory()
        }
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(pollInterval)
  }, [id, processingState])

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
          
          {processingState === 'processing' && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-600"></div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Processing media... Your story is being optimized and will be ready soon.
                </p>
              </div>
            </div>
          )}

          {processingState === 'failed' && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                Media processing failed. Some content may not display correctly.
              </p>
            </div>
          )}
          
          <StoryCard 
            story={story} 
            showFullScreenInteractions={true}
          />
          
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