import { useEffect, useState } from 'react'
import { Keyboard } from 'lucide-react'

export function KeyboardNavHint() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Show hint on first visit
    const hasSeenHint = localStorage.getItem('keyboard-nav-hint-seen')
    if (!hasSeenHint) {
      setShow(true)
      localStorage.setItem('keyboard-nav-hint-seen', 'true')
      
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => setShow(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!show) return null

  return (
    <div 
      className="fixed bottom-4 right-4 bg-card border rounded-lg shadow-lg p-4 max-w-sm z-50 animate-in slide-in-from-bottom-5"
      role="status"
      aria-live="polite"
    >
      <button
        onClick={() => setShow(false)}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss keyboard shortcuts hint"
      >
        ×
      </button>
      
      <div className="flex gap-3">
        <Keyboard className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Keyboard Shortcuts</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            <li><kbd className="px-1 bg-muted rounded">Tab</kbd> Navigate fields</li>
            <li><kbd className="px-1 bg-muted rounded">Enter</kbd> Continue/Submit</li>
            <li><kbd className="px-1 bg-muted rounded">Esc</kbd> Cancel/Close</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
