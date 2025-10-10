import { useEffect } from 'react'

interface PersonPageShortcutsConfig {
  onEdit?: () => void
  onPublish?: () => void
  onTheme?: () => void
  enabled?: boolean
}

/**
 * Keyboard shortcuts for PersonPage accessibility
 * E - Edit mode toggle
 * P - Publish/update
 * T - Theme customizer
 */
export function usePersonPageShortcuts({
  onEdit,
  onPublish,
  onTheme,
  enabled = true
}: PersonPageShortcutsConfig) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Skip if modifier keys are pressed
      if (e.metaKey || e.ctrlKey || e.altKey) {
        return
      }

      const key = e.key.toLowerCase()

      switch (key) {
        case 'e':
          if (onEdit) {
            e.preventDefault()
            onEdit()
          }
          break
        case 'p':
          if (onPublish) {
            e.preventDefault()
            onPublish()
          }
          break
        case 't':
          if (onTheme) {
            e.preventDefault()
            onTheme()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onEdit, onPublish, onTheme, enabled])
}
