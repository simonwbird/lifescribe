import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface ProfileSettings {
  mode?: 'simple' | 'studio'
  labs_enabled?: boolean
  labs_flags?: Record<string, boolean>
  [key: string]: any
}

// Global cache to prevent duplicate API calls
let globalCache: {
  settings: ProfileSettings | null
  timestamp: number
  loading: Promise<ProfileSettings | null> | null
} = {
  settings: null,
  timestamp: 0,
  loading: null
}

const CACHE_DURATION = 30000 // 30 seconds cache

export function useProfileSettings() {
  const [settings, setSettings] = useState<ProfileSettings | null>(globalCache.settings)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async (force = false): Promise<ProfileSettings | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const now = Date.now()
      
      // Return cached data if it's fresh and not forced
      if (!force && globalCache.settings && (now - globalCache.timestamp) < CACHE_DURATION) {
        return globalCache.settings
      }

      // If already loading, return the existing promise
      if (globalCache.loading) {
        return await globalCache.loading
      }

      // Create new loading promise
      globalCache.loading = (async () => {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('settings')
            .eq('id', user.id)
            .single()

          if (error) throw error

          const newSettings = (profile?.settings as ProfileSettings) || {}
          
          // Update global cache
          globalCache.settings = newSettings
          globalCache.timestamp = now
          globalCache.loading = null

          return newSettings
        } catch (err) {
          globalCache.loading = null
          throw err
        }
      })()

      return await globalCache.loading
    } catch (err) {
      console.error('Error loading profile settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
      return null
    }
  }, [])

  const updateSettings = useCallback(async (updates: Partial<ProfileSettings>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      setLoading(true)
      
      const currentSettings = globalCache.settings || {}
      const newSettings = { ...currentSettings, ...updates }

      const { error } = await supabase
        .from('profiles')
        .update({ settings: newSettings })
        .eq('id', user.id)

      if (error) throw error

      // Update global cache
      globalCache.settings = newSettings
      globalCache.timestamp = Date.now()
      
      setSettings(newSettings)
      return true
    } catch (err) {
      console.error('Error updating profile settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to update settings')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Load settings on mount if not already cached
  useEffect(() => {
    const initializeSettings = async () => {
      if (globalCache.settings) {
        setSettings(globalCache.settings)
        return
      }

      setLoading(true)
      try {
        const loadedSettings = await loadSettings()
        setSettings(loadedSettings)
      } finally {
        setLoading(false)
      }
    }

    initializeSettings()
  }, [loadSettings])

  // Clear cache on auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        globalCache.settings = null
        globalCache.timestamp = 0
        globalCache.loading = null
        setSettings(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const refreshSettings = useCallback(async () => {
    setLoading(true)
    try {
      const refreshedSettings = await loadSettings(true)
      setSettings(refreshedSettings)
    } finally {
      setLoading(false)
    }
  }, [loadSettings])

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings
  }
}