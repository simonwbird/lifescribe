import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type UserMode = 'simple' | 'studio'

export interface ModeFlags {
  showCreateMenu: boolean
  useAdvancedComposer: boolean
  density: 'roomy' | 'cozy'
  typography: 'xl' | 'base'
  motion: 'reduced' | 'normal'
}

const SIMPLE_MODE_FLAGS: ModeFlags = {
  showCreateMenu: false,
  useAdvancedComposer: false,
  density: 'roomy',
  typography: 'xl',
  motion: 'reduced'
}

const STUDIO_MODE_FLAGS: ModeFlags = {
  showCreateMenu: true,
  useAdvancedComposer: true, // Will be gated by labs in components
  density: 'cozy',
  typography: 'base',
  motion: 'normal'
}

export function useMode() {
  const [mode, setModeState] = useState<UserMode>('studio')
  const [loading, setLoading] = useState(true)

  const flags = mode === 'simple' ? SIMPLE_MODE_FLAGS : STUDIO_MODE_FLAGS

  useEffect(() => {
    const loadMode = async () => {
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
            const userMode = settings.mode || 'studio'
            setModeState(userMode)
            applyModeToBody(userMode)
          }
        }
      } catch (error) {
        console.error('Error loading mode settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMode()
  }, [])

  const setMode = async (newMode: UserMode) => {
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
          mode: newMode
        }

        await supabase
          .from('profiles')
          .update({ settings: newSettings })
          .eq('id', user.id)

        setModeState(newMode)
        applyModeToBody(newMode)
      }
    } catch (error) {
      console.error('Error updating mode:', error)
    }
  }

  const applyModeToBody = (currentMode: UserMode) => {
    const currentFlags = currentMode === 'simple' ? SIMPLE_MODE_FLAGS : STUDIO_MODE_FLAGS
    
    document.body.setAttribute('data-mode', currentMode)
    document.body.setAttribute('data-density', currentFlags.density)
    document.body.setAttribute('data-typography', currentFlags.typography)
    document.body.setAttribute('data-motion', currentFlags.motion)
  }

  return {
    mode,
    setMode,
    flags,
    loading
  }
}