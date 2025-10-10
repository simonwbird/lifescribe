import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Copy
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

interface ReviewQueueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  familyId: string
  onApprove?: () => void
}

export function ReviewQueueDialog({
  open,
  onOpenChange,
  familyId,
  onApprove
}: ReviewQueueDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [stewardNotes, setStewardNotes] = useState('')

  // Fetch pending stories
  const { data: queueItems, isLoading } = useQuery({
    queryKey: ['moderation-queue', familyId],
    queryFn: async () => {
      const { data: queue, error: queueError } = await supabase
        .from('moderation_queue_items')
        .select('*, flag:flag_id(*)')
        .eq('family_id', familyId)
        .eq('item_type', 'story')
        .in('status', ['pending', 'in_review'])
        .order('created_at', { ascending: true })

      if (queueError) throw queueError

      // Fetch story details
      const storyIds = queue?.map(q => q.item_id) || []
      const { data: stories, error: storiesError } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:profile_id(id, full_name, avatar_url),
          media(id, file_path, mime_type)
        `)
        .in('id', storyIds)

      if (storiesError) throw storiesError

      return queue?.map(item => ({
        ...item,
        story: stories?.find(s => s.id === item.item_id)
      }))
    },
    enabled: open
  })

  // Check for duplicates
  const { data: duplicates } = useQuery({
    queryKey: ['duplicate-stories', selectedItem?.item_id],
    queryFn: async () => {
      if (!selectedItem?.story) return []

      const { data, error } = await supabase
        .from('stories')
        .select('id, title, content, created_at, profiles:profile_id(full_name)')
        .eq('family_id', familyId)
        .neq('id', selectedItem.item_id)
        .or(`title.ilike.%${selectedItem.story.title}%,content.ilike.%${selectedItem.story.content?.substring(0, 50)}%`)
        .limit(5)

      if (error) throw error
      return data || []
    },
    enabled: !!selectedItem
  })

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ itemId, notes }: { itemId: string, notes: string }) => {
      // Update queue item status
      const { error: queueError } = await supabase
        .from('moderation_queue_items')
        .update({ 
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)

      if (queueError) throw queueError

      // Create moderation action
      const { error: actionError } = await supabase
        .from('moderation_actions')
        .insert({
          flag_id: queueItems?.find(q => q.id === itemId)?.flag_id,
          action_type: 'resolve',
          actor_id: (await supabase.auth.getUser()).data.user?.id,
          rationale: notes || 'Approved by steward',
          metadata: {}
        })

      if (actionError) throw actionError
    },
    onSuccess: () => {
      toast({
        title: "Story approved",
        description: "The story is now visible in the collage and timeline"
      })
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] })
      queryClient.invalidateQueries({ queryKey: ['pending-stories-count'] })
      setSelectedItem(null)
      setStewardNotes('')
      onApprove?.()
    },
    onError: () => {
      toast({
        title: "Failed to approve",
        description: "Please try again",
        variant: "destructive"
      })
    }
  })

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ itemId, notes }: { itemId: string, notes: string }) => {
      const { error: queueError } = await supabase
        .from('moderation_queue_items')
        .update({ 
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)

      if (queueError) throw queueError

      const { error: actionError } = await supabase
        .from('moderation_actions')
        .insert({
          flag_id: queueItems?.find(q => q.id === itemId)?.flag_id,
          action_type: 'hide',
          actor_id: (await supabase.auth.getUser()).data.user?.id,
          rationale: notes || 'Rejected by steward',
          metadata: {}
        })

      if (actionError) throw actionError

      // Mark story as moderated (keep it in database but don't show in collage)
      // In a future iteration, we could add a 'moderation_status' field
    },
    onSuccess: () => {
      toast({
        title: "Story rejected",
        description: "The story has been hidden and the contributor notified"
      })
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] })
      queryClient.invalidateQueries({ queryKey: ['pending-stories-count'] })
      setSelectedItem(null)
      setStewardNotes('')
    },
    onError: () => {
      toast({
        title: "Failed to reject",
        description: "Please try again",
        variant: "destructive"
      })
    }
  })

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading review queue...</div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center gap-2">
            <AlertCircle className="h-6 w-6" />
            Review Queue
            {queueItems && queueItems.length > 0 && (
              <Badge variant="secondary">{queueItems.length} pending</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {!queueItems || queueItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            All caught up! No stories pending review.
          </div>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">
                Pending ({queueItems.filter(i => i.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="review">
                In Review ({queueItems.filter(i => i.status === 'in_review').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4 mt-4">
              {queueItems.filter(i => i.status === 'pending').map((item) => (
                <Card 
                  key={item.id}
                  className={`cursor-pointer hover:border-primary transition-colors ${
                    selectedItem?.id === item.id ? 'border-primary bg-accent/50' : ''
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {item.story?.media?.[0] && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                          <img 
                            src={item.story.media[0].file_path}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-serif font-semibold text-lg">
                            {item.story?.title}
                          </h3>
                          <Badge variant="outline" className="shrink-0">
                            {item.story?.media?.length ? 'Photo' : 'Text'}
                          </Badge>
                        </div>
                        {item.story?.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {item.story.content}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={item.story?.profiles?.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {item.story?.profiles?.full_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <span>{item.story?.profiles?.full_name}</span>
                          </div>
                          <span>•</span>
                          <span>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="review" className="space-y-4 mt-4">
              {queueItems.filter(i => i.status === 'in_review').map((item) => (
                <Card 
                  key={item.id}
                  className={`cursor-pointer hover:border-primary transition-colors ${
                    selectedItem?.id === item.id ? 'border-primary bg-accent/50' : ''
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {item.story?.media?.[0] && (
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                          <img 
                            src={item.story.media[0].file_path}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif font-semibold text-lg mb-2">
                          {item.story?.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{item.story?.profiles?.full_name}</span>
                          <span>•</span>
                          <span>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}

        {/* Review Panel */}
        {selectedItem && (
          <div className="border-t pt-6 space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Review Details</h4>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Title:</span> {selectedItem.story?.title}
                </p>
                {selectedItem.story?.content && (
                  <p className="text-sm">
                    <span className="font-medium">Content:</span> {selectedItem.story.content}
                  </p>
                )}
                {selectedItem.story?.media && selectedItem.story.media.length > 0 && (
                  <p className="text-sm">
                    <span className="font-medium">Media:</span> {selectedItem.story.media.length} file(s)
                  </p>
                )}
              </div>
            </div>

            {duplicates && duplicates.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-amber-600">
                  <Copy className="h-4 w-4" />
                  Possible Duplicates Found
                </h4>
                <div className="space-y-2">
                  {duplicates.map((dup: any) => (
                    <div key={dup.id} className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg text-sm">
                      <p className="font-medium">{dup.title}</p>
                      <p className="text-xs text-muted-foreground">
                        by {dup.profiles?.full_name} • {format(new Date(dup.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                Steward Notes (optional)
              </label>
              <Textarea
                value={stewardNotes}
                onChange={(e) => setStewardNotes(e.target.value)}
                placeholder="Add internal notes about this review decision..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedItem(null)
                  setStewardNotes('')
                }}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => rejectMutation.mutate({ 
                  itemId: selectedItem.id, 
                  notes: stewardNotes 
                })}
                disabled={rejectMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => approveMutation.mutate({ 
                  itemId: selectedItem.id, 
                  notes: stewardNotes 
                })}
                disabled={approveMutation.isPending}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve & Publish
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
