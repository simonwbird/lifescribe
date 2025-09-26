import { useMemo } from 'react'
import { useProfileSettings } from './useProfileSettings'

export interface LabsFlags {
  collections: boolean
  multiSpaces: boolean
  advancedComposer: boolean
  alternateTreeViews: boolean
  gedcomImport: boolean
  analytics: boolean
  notifications: boolean
  safeBox: boolean
}

const DEFAULT_FLAGS: LabsFlags = {
  collections: false,
  multiSpaces: false,
  advancedComposer: false,
  alternateTreeViews: false,
  gedcomImport: false,
  analytics: false,
  notifications: false,
  safeBox: false,
}

export function useLabs() {
  const { settings, loading, updateSettings } = useProfileSettings()

  const labsEnabled = useMemo(() => {
    return settings?.labs_enabled || false
  }, [settings])

  const flags = useMemo(() => {
    if (labsEnabled && settings?.labs_flags) {
      return { ...DEFAULT_FLAGS, ...settings.labs_flags }
    }
    return DEFAULT_FLAGS
  }, [labsEnabled, settings])

  const updateLabsEnabled = async (enabled: boolean) => {
    const updates: any = {
      labs_enabled: enabled,
      labs_flags: enabled ? flags : DEFAULT_FLAGS
    }
    await updateSettings(updates)
  }

  const updateFlag = async (flag: keyof LabsFlags, value: boolean) => {
    const newFlags = { ...flags, [flag]: value }
    await updateSettings({ labs_flags: newFlags })
  }

  return {
    labsEnabled,
    flags,
    loading,
    updateLabsEnabled,
    updateFlag,
  }
}