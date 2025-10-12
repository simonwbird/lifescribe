import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Trash2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface NextItem {
  id: string
  label: string
  date?: string
}

interface NowNextContent {
  now?: string
  next?: NextItem[]
}

interface NowNextBlockProps {
  personId: string
  familyId: string
  blockContent: NowNextContent
  canEdit: boolean
  onUpdate?: () => void
}

export default function NowNextBlock({
  personId,
  familyId,
  blockContent,
  canEdit,
  onUpdate
}: NowNextBlockProps) {
  const [content, setContent] = useState<NowNextContent>(blockContent || { now: '', next: [] })
  const [isSaving, setIsSaving] = useState(false)

  const saveContent = async (newContent: NowNextContent) => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('person_page_blocks')
        .update({ content_json: newContent as any })
        .eq('person_id', personId)
        .eq('type', 'now_next')

      if (error) throw error

      toast.success('Saved')
      onUpdate?.()
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error('Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleNowChange = (value: string) => {
    const newContent = { ...content, now: value }
    setContent(newContent)
  }

  const handleNowBlur = () => {
    if (canEdit) {
      saveContent(content)
    }
  }

  const addNextItem = () => {
    const newItem: NextItem = {
      id: crypto.randomUUID(),
      label: '',
      date: undefined
    }
    const newContent = {
      ...content,
      next: [...(content.next || []), newItem]
    }
    setContent(newContent)
    saveContent(newContent)
  }

  const updateNextItem = (index: number, field: keyof NextItem, value: string) => {
    const next = [...(content.next || [])]
    next[index] = { ...next[index], [field]: value }
    const newContent = { ...content, next }
    setContent(newContent)
  }

  const removeNextItem = (index: number) => {
    const next = [...(content.next || [])]
    next.splice(index, 1)
    const newContent = { ...content, next }
    setContent(newContent)
    saveContent(newContent)
  }

  const addToTimeline = async (item: NextItem) => {
    if (!item.label || !item.date) {
      toast.error('Please add a label and date first')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create a story milestone that will appear in timeline
      const { data: newStory, error: storyError } = await supabase
        .from('stories')
        .insert({
          family_id: familyId,
          profile_id: user.id,
          title: item.label,
          content: `Added from Now & Next: ${item.label}`,
          occurred_on: item.date,
          tags: ['milestone', 'now-next']
        })
        .select()
        .single()

      if (storyError) throw storyError

      // Link to person
      if (newStory) {
        const { error: linkError } = await supabase
          .from('person_story_links')
          .insert({
            person_id: personId,
            story_id: newStory.id,
            family_id: familyId
          })

        if (linkError) throw linkError
      }

      toast.success('Added to timeline')
      onUpdate?.()
    } catch (error) {
      console.error('Failed to add to timeline:', error)
      toast.error('Failed to add to timeline')
    }
  }

  return (
    <section id="now-next" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold">Now & Next</h2>
        {!canEdit && (
          <Badge variant="secondary" className="text-xs">
            View Only
          </Badge>
        )}
      </div>

      {/* Now Section */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Now
          </div>
        </div>
        {canEdit ? (
          <Textarea
            className="resize-none"
            rows={3}
            value={content.now || ''}
            onChange={(e) => handleNowChange(e.target.value)}
            onBlur={handleNowBlur}
            placeholder="What are you focused on this month? (e.g., training for a marathon, learning Spanish, working on a big project...)"
            disabled={isSaving}
          />
        ) : (
          <p className="text-foreground whitespace-pre-wrap">
            {content.now || <span className="text-muted-foreground italic">Nothing shared yet</span>}
          </p>
        )}
      </div>

      {/* Next Section */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Next
          </div>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={addNextItem}
              disabled={isSaving}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          )}
        </div>

        {(!content.next || content.next.length === 0) ? (
          <p className="text-center py-8 text-muted-foreground italic">
            {canEdit ? 'Add upcoming plans or goals' : 'No upcoming items yet'}
          </p>
        ) : (
          <div className="space-y-3">
            {content.next.map((item, index) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border bg-background/50 p-4 transition-colors hover:bg-accent/50"
              >
                <div className="flex-1 space-y-2">
                  {canEdit ? (
                    <>
                      <Input
                        value={item.label}
                        onChange={(e) => updateNextItem(index, 'label', e.target.value)}
                        onBlur={() => saveContent(content)}
                        placeholder="e.g., Finish kitchen renovation, Visit Paris, Complete course"
                        className="font-medium"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="date"
                          value={item.date || ''}
                          onChange={(e) => updateNextItem(index, 'date', e.target.value)}
                          onBlur={() => saveContent(content)}
                          className="w-auto"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-medium">{item.label || '—'}</div>
                      {item.date && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  {item.label && item.date && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToTimeline(item)}
                      disabled={isSaving}
                      className="gap-2"
                    >
                      <Calendar className="h-3 w-3" />
                      Add to Timeline
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNextItem(index)}
                      disabled={isSaving}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
