import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalytics } from './useAnalytics'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const { track } = useAnalytics()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Ignore shortcuts if modifier keys are pressed (except for normal typing)
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      switch (event.key.toLowerCase()) {
        case 's':
          event.preventDefault()
          track('quickstart_selected_s')
          navigate('/stories/new')
          break
        case 'u':
          event.preventDefault()
          track('quickstart_selected_u')
          navigate('/photos/upload')
          break
        case 'q':
          event.preventDefault()
          track('quickstart_selected_q')
          navigate('/prompts/new')
          break
        case 'r':
          event.preventDefault()
          track('quickstart_selected_r')
          navigate('/audio/new')
          break
        case 'i':
          event.preventDefault()
          track('quickstart_selected_i')
          navigate('/family/invite')
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [navigate, track])
}