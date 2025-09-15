import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface LabsFlags {
  collections: boolean
  advancedComposer: boolean
  alternateTreeViews: boolean
  gedcomImport: boolean
  analytics: boolean
  notifications: boolean
  safeBox: boolean
}

const DEFAULT_FLAGS: LabsFlags = {
  collections: false,
  advancedComposer: false,
  alternateTreeViews: false,
  gedcomImport: false,
  analytics: false,
  notifications: false,
  safeBox: false,
}

export function useLabs() {
  const [labsEnabled, setLabsEnabled] = useState(false)
  const [flags, setFlags] = useState<LabsFlags>(DEFAULT_FLAGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLabsSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('settings')
            .eq('id', user.id)
            .single()

          if (profile?.settings) {
            const settings = profile.settings as any
            const isLabsEnabled = settings.labs_enabled || false
            setLabsEnabled(isLabsEnabled)
            
            if (isLabsEnabled && settings.labs_flags) {
              setFlags({ ...DEFAULT_FLAGS, ...settings.labs_flags })
            }
          }
        }
      } catch (error) {
        console.error('Error loading labs settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLabsSettings()
  }, [])

  const updateLabsEnabled = async (enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('settings')
          .eq('id', user.id)
          .single()

        const currentSettings = (profile?.settings as any) || {}
        const newSettings = {
          ...currentSettings,
          labs_enabled: enabled,
          labs_flags: enabled ? flags : DEFAULT_FLAGS
        }

        await supabase
          .from('profiles')
          .update({ settings: newSettings })
          .eq('id', user.id)

        setLabsEnabled(enabled)
        if (!enabled) {
          setFlags(DEFAULT_FLAGS)
        }
      }
    } catch (error) {
      console.error('Error updating labs enabled:', error)
    }
  }

  const updateFlag = async (flag: keyof LabsFlags, value: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const newFlags = { ...flags, [flag]: value }
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('settings')
          .eq('id', user.id)
          .single()

        const currentSettings = (profile?.settings as any) || {}
        const newSettings = {
          ...currentSettings,
          labs_flags: newFlags
        }

        await supabase
          .from('profiles')
          .update({ settings: newSettings })
          .eq('id', user.id)

        setFlags(newFlags)
      }
    } catch (error) {
      console.error('Error updating labs flag:', error)
    }
  }

  return {
    labsEnabled,
    flags,
    loading,
    updateLabsEnabled,
    updateFlag,
  }
}