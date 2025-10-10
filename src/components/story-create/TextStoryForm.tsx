import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { DatePrecisionPicker, type DatePrecisionValue } from '@/components/DatePrecisionPicker'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { useStoryAutosave } from '@/hooks/useStoryAutosave'
import { Check } from 'lucide-react'

interface TextStoryFormProps {
  familyId: string
}

export default function TextStoryForm({ familyId }: TextStoryFormProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [dateValue, setDateValue] = useState<DatePrecisionValue>({ date: null, yearOnly: false })
  
  // Check if loading a draft
  const draftId = searchParams.get('draft')
  
  // Autosave hook
  const { save, storyId, isSaving, lastSaved } = useStoryAutosave({ storyId: draftId, enabled: true })

  // Load draft if provided
  useEffect(() => {
    if (draftId) {
      loadDraft(draftId)
    }
  }, [draftId])

  async function loadDraft(id: string) {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      
      setTitle(data.title || '')
      setContent(data.content || '')
      
      if (data.occurred_on) {
        setDateValue({
          date: new Date(data.occurred_on),
          yearOnly: data.is_approx || false
        })
      }
    } catch (error) {
      console.error('Error loading draft:', error)
    }
  }

  // Autosave when data changes
  useEffect(() => {
    if (title || content) {
      save({
        title,
        content,
        familyId,
        occurred_on: dateValue.date ? dateValue.date.toISOString().split('T')[0] : null,
        is_approx: dateValue.yearOnly
      })
    }
  }, [title, content, dateValue, familyId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Validate
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Required fields',
        description: 'Please fill in both title and content.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const storyData = {
        title: title.trim(),
        content: content.trim(),
        status: 'published' as const,
        occurred_on: dateValue.date ? dateValue.date.toISOString().split('T')[0] : null,
        is_approx: dateValue.yearOnly
      }

      // Update existing draft or create new
      if (storyId) {
        const { error } = await supabase
          .from('stories')
          .update(storyData)
          .eq('id', storyId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('stories')
          .insert({
            ...storyData,
            family_id: familyId,
            profile_id: user.id
          })

        if (error) throw error
      }

      toast({
        title: 'Story published!',
        description: 'Your story is now live.'
      })

      navigate('/feed')
    } catch (error: any) {
      console.error('Error publishing story:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish story. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Write Your Story</span>
          {lastSaved && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="h-3 w-4" />
              Saved {new Date(lastSaved).toLocaleTimeString()}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              data-testid="story-title-input"
              placeholder="Give your story a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Story <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="content"
              data-testid="story-content-input"
              placeholder="Tell your story..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              When did this happen? (Optional)
            </label>
            <DatePrecisionPicker value={dateValue} onChange={setDateValue} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              data-testid="publish-button"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Story'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
