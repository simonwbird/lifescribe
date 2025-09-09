import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { MessageSquare, Clock } from 'lucide-react'

interface LinkableItem {
  id: string
  type: 'story' | 'answer'
  title: string
  excerpt: string
  created_at: string
}

interface LinkExistingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personId: string
  familyId: string
  onSuccess: () => void
}

export function LinkExistingDialog({
  open,
  onOpenChange,
  personId,
  familyId,
  onSuccess
}: LinkExistingDialogProps) {
  const [items, setItems] = useState<LinkableItem[]>([])
  const [filteredItems, setFilteredItems] = useState<LinkableItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadAvailableItems()
    }
  }, [open, familyId])

  useEffect(() => {
    const filtered = items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredItems(filtered)
  }, [items, searchQuery])

  const loadAvailableItems = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get already linked story and answer IDs
      const { data: linkedStories } = await supabase
        .from('person_story_links')
        .select('story_id')
        .eq('person_id', personId)

      const { data: linkedAnswers } = await supabase
        .from('person_answer_links')
        .select('answer_id')
        .eq('person_id', personId)

      const linkedStoryIds = linkedStories?.map(l => l.story_id) || []
      const linkedAnswerIds = linkedAnswers?.map(l => l.answer_id) || []

      // Get stories not already linked to this person
      let storiesQuery = supabase
        .from('stories')
        .select('id, title, content, created_at')
        .eq('family_id', familyId)

      if (linkedStoryIds.length > 0) {
        storiesQuery = storiesQuery.not('id', 'in', `(${linkedStoryIds.map(id => `'${id}'`).join(',')})`)
      }

      const { data: stories } = await storiesQuery

      // Get answers not already linked to this person
      let answersQuery = supabase
        .from('answers')
        .select(`
          id, 
          answer_text, 
          created_at,
          questions(question_text)
        `)
        .eq('family_id', familyId)

      if (linkedAnswerIds.length > 0) {
        answersQuery = answersQuery.not('id', 'in', `(${linkedAnswerIds.map(id => `'${id}'`).join(',')})`)
      }

      const { data: answers } = await answersQuery

      const linkableItems: LinkableItem[] = [
        ...(stories || []).map(story => ({
          id: story.id,
          type: 'story' as const,
          title: story.title,
          excerpt: story.content.substring(0, 200),
          created_at: story.created_at
        })),
        ...(answers || []).map(answer => ({
          id: answer.id,
          type: 'answer' as const,
          title: (answer.questions as any)?.question_text || 'Memory',
          excerpt: answer.answer_text.substring(0, 200),
          created_at: answer.created_at
        }))
      ]

      setItems(linkableItems)
    } catch (error) {
      console.error('Error loading items:', error)
      toast({
        title: "Failed to load items",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleItemToggle = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleLink = async () => {
    if (selectedItems.size === 0) {
      toast({ title: "Please select items to link", variant: "destructive" })
      return
    }

    setIsSaving(true)
    try {
      const linksToCreate = Array.from(selectedItems).map(itemId => {
        const item = items.find(i => i.id === itemId)
        if (item?.type === 'story') {
          return {
            table: 'person_story_links',
            data: {
              story_id: itemId,
              answer_id: undefined
            }
          }
        } else {
          return {
            table: 'person_answer_links',
            data: {
              story_id: undefined,
              answer_id: itemId
            }
          }
        }
      })

      // Create all links
      for (const link of linksToCreate) {
        if (link.table === 'person_story_links') {
          const { error } = await supabase
            .from('person_story_links')
            .insert({
              person_id: personId,
              story_id: link.data.story_id!,
              family_id: familyId
            })
          if (error) throw new Error(error.message)
        } else {
          const { error } = await supabase
            .from('person_answer_links')
            .insert({
              person_id: personId,
              answer_id: link.data.answer_id!,
              family_id: familyId
            })
          if (error) throw new Error(error.message)
        }
      }

      toast({ title: `Linked ${selectedItems.size} items successfully!` })
      setSelectedItems(new Set())
      onOpenChange(false)
      onSuccess()

    } catch (error) {
      console.error('Error linking items:', error)
      toast({
        title: "Failed to link items",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Link Existing Stories & Memories</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder="Search stories and memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="flex-1 overflow-y-auto max-h-96 space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading available items...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No matching items found' : 'No items available to link'}
              </div>
            ) : (
              filteredItems.map((item) => (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-colors ${
                    selectedItems.has(item.id) ? 'bg-accent' : ''
                  }`}
                  onClick={() => handleItemToggle(item.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleItemToggle(item.id)}
                      />
                      
                      <div className="flex items-start gap-2 flex-1">
                        {item.type === 'story' ? (
                          <MessageSquare className="h-4 w-4 mt-1" />
                        ) : (
                          <Clock className="h-4 w-4 mt-1" />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm">{item.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {item.excerpt}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {item.type === 'story' ? 'Story' : 'Memory'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {selectedItems.size} items selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleLink} 
                disabled={selectedItems.size === 0 || isSaving}
              >
                {isSaving ? 'Linking...' : `Link ${selectedItems.size} Items`}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}