import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, FileText, Image, Video, Mic, Calendar, MapPin, Package, Command } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'

type SearchResult = {
  id: string
  type: 'person' | 'story' | 'photo' | 'video' | 'audio' | 'event' | 'place' | 'object'
  title: string
  subtitle?: string
  date?: string
  url: string
}

type SearchCommand = {
  id: string
  label: string
  description: string
  action: () => void
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isCommand, setIsCommand] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [commands, setCommands] = useState<SearchCommand[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const navigate = useNavigate()
  const { track } = useAnalytics()

  useEffect(() => {
    loadFamilyId()
    const cleanup = setupKeyboardShortcut()
    return cleanup
  }, [])

  useEffect(() => {
    if (query.startsWith('>')) {
      setIsCommand(true)
      filterCommands(query.slice(1))
    } else {
      setIsCommand(false)
      if (query.length >= 2) {
        performSearch(query)
      } else {
        setResults([])
      }
    }
  }, [query])

  const loadFamilyId = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('members')
      .select('family_id')
      .eq('profile_id', user.id)
      .limit(1)
      .maybeSingle()

    if (data) {
      setFamilyId(data.family_id)
    }
  }

  const setupKeyboardShortcut = () => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        
        e.preventDefault()
        setOpen(true)
        track('search_open', { method: 'keyboard_shortcut' })
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        track('search_open', { method: 'keyboard_shortcut' })
      }
    }

    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }

  const filterCommands = (commandQuery: string) => {
    const allCommands: SearchCommand[] = [
      {
        id: 'invite',
        label: 'Invite Family Member',
        description: 'Generate magic link invite',
        action: () => {
          setOpen(false)
          toast({ title: "Opening invite sheet..." })
          // Trigger global event for invite sheet
          window.dispatchEvent(new CustomEvent('open-invite-sheet'))
        }
      },
      {
        id: 'bulk',
        label: 'Bulk Import',
        description: 'Import multiple items at once',
        action: () => {
          setOpen(false)
          navigate('/capture')
        }
      },
      {
        id: 'merge',
        label: 'Merge Duplicates',
        description: 'Find and merge duplicate people',
        action: () => {
          setOpen(false)
          if (familyId) navigate(`/admin/duplicates?family=${familyId}`)
        }
      },
      {
        id: 'export',
        label: 'Export Data',
        description: 'Download family data',
        action: () => {
          setOpen(false)
          toast({ title: "Export feature coming soon" })
        }
      },
      {
        id: 'event-new',
        label: 'New Event',
        description: 'Create a family event',
        action: () => {
          setOpen(false)
          navigate('/events')
        }
      },
      {
        id: 'elder-mode',
        label: 'Elder Mode',
        description: 'Simplified interface',
        action: () => {
          setOpen(false)
          toast({ title: "Elder mode coming soon" })
        }
      }
    ]

    const filtered = commandQuery
      ? allCommands.filter(cmd => 
          cmd.label.toLowerCase().includes(commandQuery.toLowerCase()) ||
          cmd.description.toLowerCase().includes(commandQuery.toLowerCase())
        )
      : allCommands

    setCommands(filtered)
  }

  const performSearch = async (searchQuery: string) => {
    if (!familyId) return
    
    setIsSearching(true)
    try {
      const filters = parseSearchFilters(searchQuery)
      const searchResults: SearchResult[] = []

      // Search people
      let peopleQuery = supabase
        .from('people')
        .select('id, given_name, surname, birth_date, birth_place')
        .eq('family_id', familyId)
        .limit(5)

      if (filters.cleanQuery) {
        peopleQuery = peopleQuery.or(`given_name.ilike.%${filters.cleanQuery}%,surname.ilike.%${filters.cleanQuery}%`)
      }

      const { data: people } = await peopleQuery

      people?.forEach(person => {
        searchResults.push({
          id: person.id,
          type: 'person',
          title: `${person.given_name || ''} ${person.surname || ''}`.trim(),
          subtitle: person.birth_place || undefined,
          date: person.birth_date || undefined,
          url: `/people/${person.id}`
        })
      })

      // Search stories
      let storiesQuery = supabase
        .from('stories')
        .select('id, title, created_at, occurred_on')
        .eq('family_id', familyId)
        .limit(5)

      if (filters.cleanQuery) {
        storiesQuery = storiesQuery.ilike('title', `%${filters.cleanQuery}%`)
      }
      if (filters.year) {
        storiesQuery = storiesQuery.gte('occurred_on', `${filters.year}-01-01`)
          .lte('occurred_on', `${filters.year}-12-31`)
      }

      const { data: stories } = await storiesQuery

      stories?.forEach(story => {
        searchResults.push({
          id: story.id,
          type: 'story',
          title: story.title,
          date: story.occurred_on || story.created_at,
          url: `/stories/${story.id}`
        })
      })

      // Search media
      let mediaQuery = supabase
        .from('media')
        .select('id, file_name, mime_type, created_at')
        .eq('family_id', familyId)
        .limit(5)

      if (filters.cleanQuery) {
        mediaQuery = mediaQuery.ilike('file_name', `%${filters.cleanQuery}%`)
      }

      const { data: media } = await mediaQuery

      media?.forEach(item => {
        const type = item.mime_type?.startsWith('image/') ? 'photo' 
          : item.mime_type?.startsWith('video/') ? 'video'
          : item.mime_type?.startsWith('audio/') ? 'audio'
          : 'photo'

        searchResults.push({
          id: item.id,
          type,
          title: item.file_name || 'Untitled',
          date: item.created_at,
          url: `/media?id=${item.id}`
        })
      })

      // Search places if place filter is used
      if (filters.place) {
        const { data: places } = await supabase
          .from('places')
          .select('id, name, place_type')
          .eq('family_id', familyId)
          .ilike('name', `%${filters.place}%`)
          .limit(5)

        places?.forEach(place => {
          searchResults.push({
            id: place.id,
            type: 'place',
            title: place.name,
            subtitle: place.place_type || undefined,
            url: `/places/${place.id}`
          })
        })
      }

      setResults(searchResults)
      track('search_performed', { 
        query: searchQuery,
        filters,
        resultCount: searchResults.length
      })
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const parseSearchFilters = (query: string) => {
    const filters: { cleanQuery: string; year?: string; place?: string } = {
      cleanQuery: query
    }

    const yearMatch = query.match(/year:(\d{4})/i)
    if (yearMatch) {
      filters.year = yearMatch[1]
      filters.cleanQuery = filters.cleanQuery.replace(/year:\d{4}/gi, '').trim()
    }

    const placeMatch = query.match(/place:([^\s]+)/i)
    if (placeMatch) {
      filters.place = placeMatch[1]
      filters.cleanQuery = filters.cleanQuery.replace(/place:[^\s]+/gi, '').trim()
    }

    return filters
  }

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'person': return Users
      case 'story': return FileText
      case 'photo': return Image
      case 'video': return Video
      case 'audio': return Mic
      case 'event': return Calendar
      case 'place': return MapPin
      case 'object': return Package
      default: return FileText
    }
  }

  const groupResults = () => {
    const grouped: Record<string, SearchResult[]> = {}
    results.forEach(result => {
      const key = result.type
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(result)
    })
    return grouped
  }

  const handleSelectResult = (result: SearchResult) => {
    setOpen(false)
    navigate(result.url)
    track('search_result_click', {
      type: result.type,
      id: result.id
    })
  }

  return (
    <>
      <Button
        variant="outline"
        className="relative w-full justify-start text-sm text-muted-foreground h-9"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden md:inline-flex">Search...</span>
        <span className="md:hidden">Search</span>
        <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">/</span>
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder={isCommand ? "Type a command..." : "Search or type > for commands..."} 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {!isCommand && results.length === 0 && query.length < 2 && (
            <CommandEmpty>
              <div className="text-center py-6 text-sm text-muted-foreground">
                <div className="mb-2">Start typing to search or use:</div>
                <div className="space-y-1 text-xs">
                  <div><kbd className="px-1.5 py-0.5 bg-muted rounded">year:1992</kbd> to filter by year</div>
                  <div><kbd className="px-1.5 py-0.5 bg-muted rounded">place:Melbourne</kbd> to filter by location</div>
                  <div><kbd className="px-1.5 py-0.5 bg-muted rounded">{">"}</kbd> for quick commands</div>
                </div>
              </div>
            </CommandEmpty>
          )}
          
          {!isCommand && results.length === 0 && query.length >= 2 && !isSearching && (
            <CommandEmpty>No results found for "{query}"</CommandEmpty>
          )}

          {isCommand && commands.length === 0 && (
            <CommandEmpty>No commands found</CommandEmpty>
          )}

          {isCommand ? (
            <CommandGroup heading="Commands">
              {commands.map(cmd => (
                <CommandItem
                  key={cmd.id}
                  onSelect={() => cmd.action()}
                  className="flex items-center gap-3"
                >
                  <Command className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">{cmd.label}</div>
                    <div className="text-xs text-muted-foreground">{cmd.description}</div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : (
            <>
              {Object.entries(groupResults()).map(([type, items]) => {
                const Icon = getResultIcon(type as SearchResult['type'])
                return (
                  <CommandGroup 
                    key={type} 
                    heading={type.charAt(0).toUpperCase() + type.slice(1) + 's'}
                  >
                    {items.map(result => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelectResult(result)}
                        className="flex items-center gap-3"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{result.title}</div>
                          {(result.subtitle || result.date) && (
                            <div className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                              {result.subtitle && result.date && ' · '}
                              {result.date && new Date(result.date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )
              })}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}