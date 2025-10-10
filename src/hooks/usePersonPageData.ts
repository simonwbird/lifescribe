import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { PersonPageData, PersonPageBlock, PersonPagePermission, PersonPageTheme } from '@/types/personPage'

export function usePersonPageData(personId: string, viewerUserId: string | null) {
  const [data, setData] = useState<PersonPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!personId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch person
        const { data: person, error: personError } = await supabase
          .from('people')
          .select('*')
          .eq('id', personId)
          .maybeSingle()

        if (personError) throw personError
        if (!person) {
          setError('Page not found')
          setData(null)
          setLoading(false)
          return
        }

        // Fetch blocks (non-blocking; default to empty)
        let blocks: PersonPageBlock[] = []
        try {
          const { data: blocksData, error: blocksError } = await supabase
            .from('person_page_blocks')
            .select('*')
            .eq('person_id', personId)
            .eq('is_enabled', true)
            .order('block_order', { ascending: true })

          if (blocksError) {
            console.warn('Blocks lookup failed; continuing with empty blocks', blocksError)
          } else {
            blocks = (blocksData || []) as PersonPageBlock[]
          }
        } catch (blocksErr) {
          console.warn('Blocks lookup threw; continuing with empty blocks', blocksErr)
        }

        // Fetch permission for current user (non-blocking)
        let permission: PersonPagePermission | null = null
        if (viewerUserId) {
          try {
            const { data: permData, error: permError } = await supabase
              .from('person_page_permissions')
              .select('*')
              .eq('person_id', personId)
              .eq('user_id', viewerUserId)
              .maybeSingle()

            if (permError) {
              console.warn('Permission lookup failed; continuing without permission', permError)
            } else {
              permission = (permData || null) as PersonPagePermission | null
            }
          } catch (permErr) {
            console.warn('Permission lookup threw; continuing without permission', permErr)
          }
        }

        // Fetch theme (non-blocking)
        let theme: PersonPageTheme | null = null
        if (person.theme_id) {
          try {
            const { data: themeData, error: themeError } = await supabase
              .from('person_page_themes')
              .select('*')
              .eq('id', person.theme_id)
              .maybeSingle()
            
            if (themeError) {
              console.warn('Theme lookup failed; continuing with default theme', themeError)
            } else {
              theme = (themeData || null) as unknown as PersonPageTheme | null
            }
          } catch (themeErr) {
            console.warn('Theme lookup threw; continuing with default theme', themeErr)
          }
        }

        setData({
          person: {
            ...person,
            status: person.death_date || person.is_living === false ? 'passed' : 'living'
          },
          blocks: (blocks || []) as PersonPageBlock[],
          permission,
          theme
        })
      } catch (err) {
        console.error('Error fetching person page data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load page')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [personId, viewerUserId])

  const updateBlockOrder = async (blocks: PersonPageBlock[]) => {
    try {
      const updates = blocks.map((block, index) => ({
        id: block.id,
        block_order: index
      }))

      for (const update of updates) {
        await supabase
          .from('person_page_blocks')
          .update({ block_order: update.block_order })
          .eq('id', update.id)
      }

      if (data) {
        setData({
          ...data,
          blocks: blocks.map((b, i) => ({ ...b, block_order: i }))
        })
      }
    } catch (err) {
      console.error('Error updating block order:', err)
      throw err
    }
  }

  const updateBlockVisibility = async (blockId: string, visibility: PersonPageBlock['visibility']) => {
    try {
      await supabase
        .from('person_page_blocks')
        .update({ visibility })
        .eq('id', blockId)

      if (data) {
        setData({
          ...data,
          blocks: data.blocks.map(b => 
            b.id === blockId ? { ...b, visibility } : b
          )
        })
      }
    } catch (err) {
      console.error('Error updating block visibility:', err)
      throw err
    }
  }

  const addBlock = async (type: PersonPageBlock['type']) => {
    try {
      const maxOrder = Math.max(...(data?.blocks.map(b => b.block_order) || [0]), 0)
      
      const { data: newBlock, error } = await supabase
        .from('person_page_blocks')
        .insert({
          person_id: personId,
          type,
          content_json: {},
          block_order: maxOrder + 1,
          visibility: 'family',
          created_by: viewerUserId
        })
        .select()
        .single()

      if (error) throw error

      if (data && newBlock) {
        setData({
          ...data,
          blocks: [...data.blocks, newBlock as PersonPageBlock]
        })
      }
    } catch (err) {
      console.error('Error adding block:', err)
      throw err
    }
  }

  const removeBlock = async (blockId: string) => {
    try {
      await supabase
        .from('person_page_blocks')
        .update({ is_enabled: false })
        .eq('id', blockId)

      if (data) {
        setData({
          ...data,
          blocks: data.blocks.filter(b => b.id !== blockId)
        })
      }
    } catch (err) {
      console.error('Error removing block:', err)
      throw err
    }
  }

  return {
    data,
    loading,
    error,
    updateBlockOrder,
    updateBlockVisibility,
    addBlock,
    removeBlock
  }
}