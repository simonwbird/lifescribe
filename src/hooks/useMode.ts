import { useState, useEffect, useMemo } from 'react'
import { useProfileSettings } from './useProfileSettings'

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
  const { settings, loading, updateSettings } = useProfileSettings()
  
  const mode = useMemo(() => {
    return (settings?.mode as UserMode) || 'studio'
  }, [settings])
  
  const flags = useMemo(() => {
    return mode === 'simple' ? SIMPLE_MODE_FLAGS : STUDIO_MODE_FLAGS
  }, [mode])

  // Apply mode to body when it changes
  useEffect(() => {
    if (mode) {
      applyModeToBody(mode)
    }
  }, [mode])

  const setMode = async (newMode: UserMode) => {
    const success = await updateSettings({ mode: newMode })
    if (success) {
      applyModeToBody(newMode)
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