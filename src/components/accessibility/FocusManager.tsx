import { useEffect, useRef, createContext, useContext, ReactNode } from 'react'

interface FocusManagerContextType {
  focusId: (id: string) => void
  announceToScreenReader: (message: string) => void
}

const FocusManagerContext = createContext<FocusManagerContextType | null>(null)

interface FocusManagerProps {
  children: ReactNode
}

export function FocusManager({ children }: FocusManagerProps) {
  const announcementRef = useRef<HTMLDivElement>(null)

  const focusId = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.focus()
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const announceToScreenReader = (message: string) => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message
      // Clear after announcement
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = ''
        }
      }, 1000)
    }
  }

  return (
    <FocusManagerContext.Provider value={{ focusId, announceToScreenReader }}>
      {children}
      {/* Screen reader announcement area */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </FocusManagerContext.Provider>
  )
}

export function useFocusManager() {
  const context = useContext(FocusManagerContext)
  if (!context) {
    throw new Error('useFocusManager must be used within a FocusManager')
  }
  return context
}

// Keyboard navigation hook
export function useKeyboardNavigation(
  onArrowDown?: () => void,
  onArrowUp?: () => void,
  onEnter?: () => void,
  onEscape?: () => void
) {
  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        onArrowDown?.()
        break
      case 'ArrowUp':
        event.preventDefault()
        onArrowUp?.()
        break
      case 'Enter':
        event.preventDefault()
        onEnter?.()
        break
      case 'Escape':
        event.preventDefault()
        onEscape?.()
        break
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onArrowDown, onArrowUp, onEnter, onEscape])
}