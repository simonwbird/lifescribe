import { useEffect } from 'react'

interface ComposerShortcutHandlers {
  onEnter?: (e: KeyboardEvent) => void
  onEscape?: (e: KeyboardEvent) => void
  onSave?: (e: KeyboardEvent) => void
  onSubmit?: (e: KeyboardEvent) => void
}

/**
 * Keyboard shortcuts for the story composer
 * - Ctrl/Cmd + S: Save draft
 * - Ctrl/Cmd + Enter: Submit/Publish
 * - Escape: Cancel/Close
 * - Enter: Continue (when not in input field)
 */
export function useComposerKeyboardShortcuts({
  onEnter,
  onEscape,
  onSave,
  onSubmit
}: ComposerShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      const isContentEditable = target.isContentEditable

      // Ctrl/Cmd + S - Save draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        onSave?.(e)
        return
      }

      // Ctrl/Cmd + Enter - Submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        onSubmit?.(e)
        return
      }

      // Escape - Cancel/Close
      if (e.key === 'Escape') {
        onEscape?.(e)
        return
      }

      // Enter - Only if not in input field or contenteditable
      if (e.key === 'Enter' && !isInputField && !isContentEditable) {
        onEnter?.(e)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onEnter, onEscape, onSave, onSubmit])
}
