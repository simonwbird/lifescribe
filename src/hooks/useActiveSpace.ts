import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLabs } from './useLabs'

interface ActiveSpaceData {
  id: string
  name: string
  isDefault?: boolean
}

/**
 * Hook to manage the active family space for the current user.
 * In MVP mode (multiSpaces disabled), always returns the default space.
 * In Labs mode (multiSpaces enabled), can switch between spaces.
 */
export function useActiveSpace() {
  const [activeSpace, setActiveSpace] = useState<ActiveSpaceData | null>(null)
  const [loading, setLoading] = useState(true)
  const { flags } = useLabs()
  
  const multiSpacesEnabled = flags.multiSpaces

  useEffect(() => {
    loadActiveSpace()
  }, [multiSpacesEnabled])

  const loadActiveSpace = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's profile with default space
      const { data: profile } = await supabase
        .from('profiles')
        .select('default_space_id')
        .eq('id', user.id)
        .single()

      if (profile?.default_space_id) {
        // Get the space details
        const { data: family } = await supabase
          .from('families')
          .select('id, name')
          .eq('id', profile.default_space_id)
          .single()

        if (family) {
          setActiveSpace({
            id: family.id,
            name: family.name,
            isDefault: true
          })
        }
      }
    } catch (error) {
      console.error('Error loading active space:', error)
    } finally {
      setLoading(false)
    }
  }

  const switchSpace = async (spaceId: string) => {
    // Only allow space switching when multiSpaces is enabled
    if (!multiSpacesEnabled) {
      console.warn('Space switching is disabled when multiSpaces feature is off')
      return false
    }

    try {
      // In a full implementation, this would update a global state
      // For now, we'll just update the local state
      const { data: family } = await supabase
        .from('families')
        .select('id, name')
        .eq('id', spaceId)
        .single()

      if (family) {
        setActiveSpace({
          id: family.id,
          name: family.name,
          isDefault: false
        })
        return true
      }
      return false
    } catch (error) {
      console.error('Error switching space:', error)
      return false
    }
  }

  const setDefaultSpace = async (spaceId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('profiles')
        .update({ default_space_id: spaceId })
        .eq('id', user.id)

      if (error) throw error

      // Reload the active space
      await loadActiveSpace()
      return true
    } catch (error) {
      console.error('Error setting default space:', error)
      return false
    }
  }

  return {
    activeSpace,
    loading,
    multiSpacesEnabled,
    switchSpace,
    setDefaultSpace,
    refresh: loadActiveSpace
  }
}