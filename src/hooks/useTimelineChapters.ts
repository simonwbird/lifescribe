import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

export interface TimelineChapter {
  id: string
  title: string
  description?: string
  startYear?: number
  endYear?: number
  order: number
}

export function useTimelineChapters(personId: string, familyId: string) {
  const [chapters, setChapters] = useState<TimelineChapter[]>([
    { id: 'unorganized', title: 'Unorganized', order: 999 }
  ])
  const [itemChapters, setItemChapters] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Load chapters and assignments
  useEffect(() => {
    const loadChapters = async () => {
      setIsLoading(true)
      try {
      const { data: dbChapters, error } = await supabase
        .from('timeline_chapters' as any)
        .select('*')
        .eq('person_id', personId)
        .order('display_order')

      if (error) throw error

      if (dbChapters && dbChapters.length > 0) {
        const loadedChapters: TimelineChapter[] = (dbChapters as any[]).map((ch: any) => ({
            id: ch.id,
            title: ch.title,
            description: ch.description || undefined,
            startYear: ch.start_year || undefined,
            endYear: ch.end_year || undefined,
            order: ch.display_order
          }))

          setChapters([
            ...loadedChapters,
            { id: 'unorganized', title: 'Unorganized', order: 999 }
          ])
        }

      // Load chapter assignments
      const { data: assignments } = await supabase
        .from('timeline_chapter_assignments' as any)
        .select('*')
        .eq('person_id', personId)

      if (assignments) {
        const assignmentMap: Record<string, string> = {}
        ;(assignments as any[]).forEach((a: any) => {
            assignmentMap[`${a.item_type}-${a.item_id}`] = a.chapter_id
          })
          setItemChapters(assignmentMap)
        }
      } catch (error) {
        console.error('Error loading chapters:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadChapters()
  }, [personId])

  const createChapter = async (title: string, startYear?: number, endYear?: number) => {
    if (!title.trim()) return null

    try {
      const order = chapters.length - 1 // Before "Unorganized"
      
      const { data, error } = await supabase
        .from('timeline_chapters' as any)
        .insert({
          person_id: personId,
          family_id: familyId,
          title: title.trim(),
          start_year: startYear,
          end_year: endYear,
          display_order: order,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single() as any

      if (error) throw error

      const newChapter: TimelineChapter = {
        id: data.id,
        title: data.title,
        startYear: data.start_year,
        endYear: data.end_year,
        order: data.display_order
      }

      setChapters(prev => {
        const sorted = [...prev.filter(c => c.id !== 'unorganized'), newChapter]
          .sort((a, b) => a.order - b.order)
        return [...sorted, prev.find(c => c.id === 'unorganized')!]
      })

      return newChapter
    } catch (error) {
      console.error('Error creating chapter:', error)
      throw error
    }
  }

  const renameChapter = async (chapterId: string, newTitle: string) => {
    if (chapterId === 'unorganized') return

    try {
      const { error } = await supabase
        .from('timeline_chapters' as any)
        .update({ title: newTitle })
        .eq('id', chapterId)

      if (error) throw error

      setChapters(prev => prev.map(c =>
        c.id === chapterId ? { ...c, title: newTitle } : c
      ))
    } catch (error) {
      console.error('Error renaming chapter:', error)
      throw error
    }
  }

  const assignItemToChapter = async (itemId: string, itemType: string, chapterId: string) => {
    try {
      // Delete old assignment if exists
      await supabase
        .from('timeline_chapter_assignments' as any)
        .delete()
        .eq('person_id', personId)
        .eq('item_id', itemId)
        .eq('item_type', itemType)

      // Create new assignment if not moving to unorganized
      if (chapterId !== 'unorganized') {
        const { error } = await supabase
          .from('timeline_chapter_assignments' as any)
          .insert({
            person_id: personId,
            chapter_id: chapterId,
            item_id: itemId,
            item_type: itemType
          })

        if (error) throw error
      }

      setItemChapters(prev => ({
        ...prev,
        [`${itemType}-${itemId}`]: chapterId
      }))
    } catch (error) {
      console.error('Error assigning item to chapter:', error)
      throw error
    }
  }

  const batchAssignItems = async (assignments: Record<string, string>) => {
    try {
      // Build batch operations
      const deleteOps = Object.entries(assignments).map(([key]) => {
        const [itemType, itemId] = key.split('-')
        
        return supabase
          .from('timeline_chapter_assignments' as any)
          .delete()
          .eq('person_id', personId)
          .eq('item_id', itemId)
          .eq('item_type', itemType)
          .then(res => res)
      })

      // Execute deletes
      await Promise.all(deleteOps)

      // Build inserts
      const insertData: any[] = []
      Object.entries(assignments).forEach(([key, chapterId]) => {
        const [itemType, itemId] = key.split('-')
        
        if (chapterId !== 'unorganized') {
          insertData.push({
            person_id: personId,
            chapter_id: chapterId,
            item_id: itemId,
            item_type: itemType
          })
        }
      })

      // Execute inserts
      if (insertData.length > 0) {
        const { error } = await supabase
          .from('timeline_chapter_assignments' as any)
          .insert(insertData)

        if (error) throw error
      }

      setItemChapters(prev => ({ ...prev, ...assignments }))
    } catch (error) {
      console.error('Error batch assigning items:', error)
      throw error
    }
  }

  return {
    chapters,
    itemChapters,
    isLoading,
    createChapter,
    renameChapter,
    assignItemToChapter,
    batchAssignItems
  }
}
