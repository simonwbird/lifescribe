import { useState, useEffect, useRef } from 'react'
import { Search, Command } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAnalytics } from '@/hooks/useAnalytics'

interface GlobalSearchProps {
  variant?: 'inline' | 'command-palette'
}

export default function GlobalSearch({ variant = 'inline' }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { track } = useAnalytics()

  // Command palette keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (variant === 'command-palette') {
          setIsOpen(true)
        } else {
          inputRef.current?.focus()
        }
        track('search_keyboard_shortcut_used')
      }
      
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        inputRef.current?.focus()
        track('search_slash_shortcut_used')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [variant, track])

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      track('search_performed', { query: searchQuery })
      // TODO: Implement actual search functionality
      console.log('Searching for:', searchQuery)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  if (variant === 'command-palette') {
    return (
      <>
        <Button
          variant="outline"
          className="w-64 justify-start text-muted-foreground gap-2"
          onClick={() => setIsOpen(true)}
        >
          <Search className="h-4 w-4" />
          Search people, stories, places...
          <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">
            <Command className="h-3 w-3 inline mr-1" />K
          </kbd>
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="top-20 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="sr-only">Global Search</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search people, stories, places..."
                  className="pl-10"
                  autoFocus
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
            {/* TODO: Add search results here */}
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="relative hidden sm:block">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search people, stories, places..."
        className="pl-10 w-64 focus-visible:ring-2"
        aria-label="Global search"
      />
    </form>
  )
}