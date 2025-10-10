import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { CSSProperties } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useNavigate } from 'react-router-dom'
import { SearchService, type SearchSuggestion } from '@/lib/searchService'
import { supabase } from '@/lib/supabase'
import { useAnalytics } from '@/hooks/useAnalytics'
import SearchSuggestions from './SearchSuggestions'

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties | undefined>()
  
  const inputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const navigate = useNavigate()
  const { track } = useAnalytics()

  // Get user's family ID
  useEffect(() => {
    const getFamilyId = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: member } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .maybeSingle()
        
        if (member) {
          setFamilyId(member.family_id)
        }
      }
    }
    getFamilyId()
  }, [])

  // Global keyboard shortcut: / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return
        }
        e.preventDefault()
        inputRef.current?.focus()
        track('search_focus', { method: 'keyboard_shortcut' })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [track])

  // Handle search input changes with debouncing
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (query.length >= 2 && familyId) {
      setIsLoading(true)
      timeoutRef.current = setTimeout(async () => {
        try {
          console.log('Searching for:', query, 'in family:', familyId)
          const results = await SearchService.getSuggestions(query, familyId)
          console.log('Search results:', results)
          setSuggestions(results)
          setShowSuggestions(true)
          setActiveIndex(-1)
          
          // Only auto-navigate if there's exactly one person match
          const peopleResults = results.filter(r => r.type === 'person')
          
          if (peopleResults.length === 1) {
            const firstResult = peopleResults[0]
            const queryLower = query.toLowerCase().trim()
            const nameLower = firstResult.title.toLowerCase()
            
            // Check for exact match or very close match
            const isExactMatch = nameLower === queryLower
            const isCloseMatch = nameLower.includes(queryLower) && queryLower.length >= 3
            const isFirstNameMatch = nameLower.split(' ')[0] === queryLower || 
                                   nameLower.split(' ').slice(-1)[0] === queryLower
            
            // Auto-navigate after a short delay if it's a good match
            if (isExactMatch || (isCloseMatch && query.length >= 4) || isFirstNameMatch) {
              setTimeout(() => {
                // Check if user hasn't changed the query in the meantime
                if (inputRef.current?.value.toLowerCase().trim() === queryLower) {
                  track('search_result_click', { 
                    query: queryLower,
                    person_name: firstResult.title,
                    match_type: isExactMatch ? 'exact' : isFirstNameMatch ? 'first_name' : 'partial',
                    auto_navigate: true
                  })
                  navigate(firstResult.url!)
                  setShowSuggestions(false)
                  setActiveIndex(-1)
                  setQuery('')
                  inputRef.current?.blur()
                }
              }, isExactMatch ? 500 : 1000) // Faster for exact matches
            }
          }
        } catch (error) {
          console.error('Search error:', error)
        } finally {
          setIsLoading(false)
        }
      }, 250) // Updated to 250ms debounce
    } else {
      setSuggestions([])
      setShowSuggestions(false)
      setIsLoading(false)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, familyId]) // Removed navigate and track from dependencies

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const clickedInSearch = searchRef.current?.contains(target)
      const clickedInDropdown = target.closest('#search-suggestions')
      if (!clickedInSearch && !clickedInDropdown) {
        setShowSuggestions(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keep dropdown anchored to input (avoids clipping/overflow)
  useEffect(() => {
    const update = () => {
      const el = inputRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setDropdownStyle({ position: 'fixed', left: rect.left, top: rect.bottom + 6, width: rect.width, zIndex: 1000 })
    }
    if (showSuggestions) {
      update()
      window.addEventListener('resize', update)
      window.addEventListener('scroll', update, true)
    }
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [showSuggestions])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        handleSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0) {
          handleSuggestionClick(suggestions[activeIndex])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setActiveIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  const handleSearch = () => {
    if (!query.trim()) return
    
    track('search_submit', { query: query.trim() })
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    setShowSuggestions(false)
    setActiveIndex(-1)
    inputRef.current?.blur()
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    track('search_suggestion_click', { 
      type: suggestion.type,
      suggestion_id: suggestion.id
    })
    
    if (suggestion.url) {
      navigate(suggestion.url)
    }
    
    setShowSuggestions(false)
    setActiveIndex(-1)
    setQuery('')
    inputRef.current?.blur()
  }

  const handleFocus = () => {
    track('search_focus', { method: 'click' })
    track('search_open', { source: 'header' })
    if (suggestions.length > 0) {
      setShowSuggestions(true)
    }
  }

  return (
    <div ref={searchRef} className="relative w-full z-50">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-foreground" />
        <Input
          data-search-input
          ref={inputRef}
          type="text"
          placeholder="People, stories, places…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          className="!pl-16 pr-10 h-10 w-full border border-input bg-background rounded-lg text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-ring transition-all duration-200 sm:w-80 md:w-96"
          role="combobox"
          aria-expanded={showSuggestions}
          aria-autocomplete="list"
          aria-controls={showSuggestions ? 'search-suggestions' : undefined}
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && typeof document !== 'undefined' &&
        createPortal(
          <SearchSuggestions
            suggestions={suggestions}
            activeIndex={activeIndex}
            onSuggestionClick={handleSuggestionClick}
            onSeeAll={() => handleSearch()}
            containerStyle={dropdownStyle}
          />,
          document.body
        )
      }
    </div>
  )
}