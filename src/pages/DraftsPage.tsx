import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Trash2, Image, Mic, Video, TextIcon, Layers } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Header from '@/components/Header'

interface Draft {
  id: string
  title: string
  content: string
  updated_at: string
  family_id: string
  metadata?: {
    tab?: string
    source?: string
  } | null
}

export default function DraftsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadDrafts()
  }, [])

  async function loadDrafts() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/auth/login?next=/stories/drafts')
        return
      }

      const { data, error } = await supabase
        .from('stories')
        .select('id, title, content, updated_at, family_id, metadata')
        .eq('profile_id', user.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setDrafts((data || []) as Draft[])
    } catch (error) {
      console.error('Error loading drafts:', error)
      toast({
        title: 'Error',
        description: 'Failed to load drafts.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  function getTabIcon(tab?: string) {
    switch(tab) {
      case 'text': return <TextIcon className="h-4 w-4" />
      case 'photo': return <Image className="h-4 w-4" />
      case 'voice': return <Mic className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'mixed': return <Layers className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  function getTabLabel(tab?: string) {
    return tab ? tab.charAt(0).toUpperCase() + tab.slice(1) : 'Story'
  }

  async function deleteDraft(id: string) {
    if (!confirm('Are you sure you want to delete this draft?')) return

    try {
      setDeleting(id)
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', id)

      if (error) throw error

      setDrafts(prev => prev.filter(d => d.id !== id))
      toast({
        title: 'Draft deleted',
        description: 'The draft has been permanently deleted.'
      })
    } catch (error) {
      console.error('Error deleting draft:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete draft.',
        variant: 'destructive'
      })
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Story Drafts</h1>
          <p className="text-muted-foreground">
            Resume your unfinished stories
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : drafts.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No drafts yet</p>
              <p className="text-muted-foreground mb-4">
                Start creating a story to see it saved here automatically
              </p>
              <Button onClick={() => navigate('/stories/new')}>
                Create New Story
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => {
              const tab = draft.metadata?.tab || 'text'
              return (
                <Card key={draft.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      {getTabIcon(tab)}
                      <span className="text-xs font-medium text-muted-foreground">
                        {getTabLabel(tab)}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{draft.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {draft.content || 'No content yet...'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Updated {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                      </span>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteDraft(draft.id)}
                          disabled={deleting === draft.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/stories/new-tabbed?draft=${draft.id}&tab=${tab}`)}
                        >
                          Resume
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
