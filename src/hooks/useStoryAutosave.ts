import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface StoryDraftData {
  title: string
  content: string
  familyId: string
  occurred_on?: string | null
  is_approx?: boolean
}

interface UseStoryAutosaveOptions {
  storyId?: string | null
  enabled?: boolean
}

export function useStoryAutosave({ storyId: initialStoryId, enabled = true }: UseStoryAutosaveOptions = {}) {
  const { toast } = useToast()
  const [storyId, setStoryId] = useState<string | null>(initialStoryId || null)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastDataRef = useRef<string>('')

  const save = async (data: StoryDraftData) => {
    if (!enabled) return

    // Debounce - wait 3 seconds before saving
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const dataStr = JSON.stringify(data)
    
    // Only save if data has changed
    if (dataStr === lastDataRef.current) {
      return
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const storyData = {
          title: data.title || 'Untitled Draft',
          content: data.content,
          family_id: data.familyId,
          profile_id: user.id,
          status: 'draft',
          occurred_on: data.occurred_on,
          is_approx: data.is_approx
        }

        // Update existing draft or create new
        if (storyId) {
          const { error } = await supabase
            .from('stories')
            .update(storyData)
            .eq('id', storyId)

          if (error) throw error
        } else {
          const { data: newStory, error } = await supabase
            .from('stories')
            .insert(storyData)
            .select('id')
            .single()

          if (error) throw error
          setStoryId(newStory.id)
        }

        lastDataRef.current = dataStr
        setLastSaved(new Date())
      } catch (error: any) {
        console.error('Autosave error:', error)
        // Silent fail - don't interrupt user
      } finally {
        setIsSaving(false)
      }
    }, 3000) // 3 seconds
  }

  // Force save immediately (for blur events)
  const forceSave = async (data: StoryDraftData) => {
    if (!enabled) return
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const dataStr = JSON.stringify(data)
    
    // Only save if data has changed
    if (dataStr === lastDataRef.current) {
      return
    }

    try {
      setIsSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const storyData = {
        title: data.title || 'Untitled Draft',
        content: data.content,
        family_id: data.familyId,
        profile_id: user.id,
        status: 'draft',
        occurred_on: data.occurred_on,
        is_approx: data.is_approx
      }

      // Update existing draft or create new
      if (storyId) {
        const { error } = await supabase
          .from('stories')
          .update(storyData)
          .eq('id', storyId)

        if (error) throw error
      } else {
        const { data: newStory, error } = await supabase
          .from('stories')
          .insert(storyData)
          .select('id')
          .single()

        if (error) throw error
        setStoryId(newStory.id)
      }

      lastDataRef.current = dataStr
      setLastSaved(new Date())
    } catch (error: any) {
      console.error('Autosave error:', error)
      // Silent fail - don't interrupt user
    } finally {
      setIsSaving(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    save,
    forceSave,
    storyId,
    isSaving,
    lastSaved
  }
}
