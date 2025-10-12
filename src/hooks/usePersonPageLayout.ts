import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { LayoutMap } from '@/components/person-page/PortalLayoutManager'
import { DEFAULT_LAYOUT_MAP } from '@/config/personPageLayouts'
import { toast } from 'sonner'

export function usePersonPageLayout(personId: string, familyId: string) {
  const [layoutMap, setLayoutMap] = useState<LayoutMap>(DEFAULT_LAYOUT_MAP)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadLayout()
  }, [personId])

  const loadLayout = async () => {
    try {
      const { data, error } = await supabase
        .from('person_page_layouts')
        .select('layout_map')
        .eq('person_id', personId)
        .maybeSingle()

      if (error) throw error

      if (data?.layout_map && typeof data.layout_map === 'object') {
        setLayoutMap(data.layout_map as unknown as LayoutMap)
      } else {
        setLayoutMap(DEFAULT_LAYOUT_MAP)
      }
    } catch (error) {
      console.error('Error loading layout:', error)
      setLayoutMap(DEFAULT_LAYOUT_MAP)
    } finally {
      setLoading(false)
    }
  }

  const saveLayout = async (newLayoutMap: LayoutMap) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('person_page_layouts')
        .upsert({
          person_id: personId,
          family_id: familyId,
          layout_map: newLayoutMap as any,
        } as any)

      if (error) throw error

      setLayoutMap(newLayoutMap)
      toast.success('Layout saved')
    } catch (error) {
      console.error('Error saving layout:', error)
      toast.error('Failed to save layout')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('person_page_layouts')
        .delete()
        .eq('person_id', personId)

      if (error) throw error

      setLayoutMap(DEFAULT_LAYOUT_MAP)
      toast.success('Layout reset to defaults')
    } catch (error) {
      console.error('Error resetting layout:', error)
      toast.error('Failed to reset layout')
    } finally {
      setSaving(false)
    }
  }

  return {
    layoutMap,
    loading,
    saving,
    saveLayout,
    resetToDefaults,
  }
}
