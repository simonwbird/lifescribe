import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Command as CommandIcon } from 'lucide-react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { supabase } from '@/integrations/supabase/client'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useElderMode } from '@/hooks/useElderMode'
import { useToast } from '@/hooks/use-toast'
import { 
  Users, 
  BookOpen, 
  Image, 
  Mic, 
  Video, 
  Calendar, 
  Box,
  MapPin,
  CalendarDays,
  UserPlus,
  Upload,
  Merge,
  FileText,
  Accessibility
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'person' | 'story' | 'photo' | 'audio' | 'video' | 'event' | 'object' | 'place' | 'date'
  title: string
  subtitle?: string
  url: string
}

interface Command {
  id: string
  label: string
  keywords: string[]
  icon: React.ReactNode
  action: () => void
}

export function EnhancedGlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  
  const navigate = useNavigate()
  const { track } = useAnalytics()
  const { toast } = useToast()
  const { enableElderMode } = useElderMode(userId)
  const debounceTimer = useRef<NodeJS.Timeout>()

  // Load user ID on mount
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    loadUser()
  }, [])

  // Keyboard shortcut: Cmd/Ctrl + K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        track('search_keyboard_shortcut_used', { shortcut: 'cmd_k' })
      }
      
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        setOpen(true)
        track('search_keyboard_shortcut_used', { shortcut: 'slash' })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [track])

  // Define commands
  const commands: Command[] = [
    {
      id: 'invite',
      label: 'Invite family member',
      keywords: ['invite', 'add', 'member'],
      icon: <UserPlus className="h-4 w-4" />,
      action: () => {
        setOpen(false)
        // Open invite modal - we'll trigger this via URL param
        navigate('/home?openInvite=true')
        track('command_palette_action' as any, { command: 'invite' })
      }
    },
    {
      id: 'bulk',
      label: 'Bulk upload media',
      keywords: ['bulk', 'upload', 'import'],
      icon: <Upload className="h-4 w-4" />,
      action: () => {
        setOpen(false)
        navigate('/admin/bulk-upload')
        track('command_palette_action' as any, { command: 'bulk' })
      }
    },
    {
      id: 'merge',
      label: 'Merge people',
      keywords: ['merge', 'duplicate', 'combine'],
      icon: <Merge className="h-4 w-4" />,
      action: () => {
        setOpen(false)
        navigate('/admin/merge')
        track('command_palette_action' as any, { command: 'merge' })
      }
    },
    {
      id: 'export',
      label: 'Export / Print book',
      keywords: ['export', 'print', 'book', 'download'],
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        setOpen(false)
        navigate('/export/composer')
        track('command_palette_action' as any, { command: 'export' })
      }
    },
    {
      id: 'event-new',
      label: 'Create new event',
      keywords: ['event', 'new', 'create', 'add'],
      icon: <Calendar className="h-4 w-4" />,
      action: () => {
        setOpen(false)
        navigate('/events/new')
        track('command_palette_action' as any, { command: 'event_new' })
      }
    },
    {
      id: 'elder-mode',
      label: 'Toggle Elder Mode',
      keywords: ['elder', 'accessibility', 'large', 'simple'],
      icon: <Accessibility className="h-4 w-4" />,
      action: () => {
        setOpen(false)
        enableElderMode()
        toast({
          title: "Elder Mode",
          description: "Large button interface toggled"
        })
        track('command_palette_action' as any, { command: 'elder_mode' })
      }
    }
  ]

  // Check if query is a command
  const isCommand = query.startsWith('>')
  const commandQuery = isCommand ? query.slice(1).toLowerCase().trim() : ''

  // Filter commands based on query
  const filteredCommands = isCommand
    ? commands.filter(cmd => 
        cmd.keywords.some(kw => kw.includes(commandQuery)) ||
        cmd.label.toLowerCase().includes(commandQuery)
      )
    : []

  // Perform search with debouncing
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || isCommand) {
      setResults([])
      return
    }

    setIsSearching(true)
    const searchResults: SearchResult[] = []

    try {
      // Search people
      const { data: people } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5)

      if (people) {
        searchResults.push(
          ...people.map(p => ({
            id: p.id,
            type: 'person' as const,
            title: p.full_name || 'Unknown',
            url: `/people/${p.id}`
          }))
        )
      }

      // Search stories
      const { data: stories } = await supabase
        .from('stories')
        .select('id, title, created_at')
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(5)

      if (stories) {
        searchResults.push(
          ...stories.map(s => ({
            id: s.id,
            type: 'story' as const,
            title: s.title || 'Untitled Story',
            subtitle: s.created_at ? new Date(s.created_at).toLocaleDateString() : undefined,
            url: `/stories/${s.id}`
          }))
        )
      }

      // Search events
      const { data: events } = await supabase
        .from('life_events')
        .select('id, title, event_date, notes')
        .or(`title.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`)
        .order('event_date', { ascending: false })
        .limit(5)

      if (events) {
        searchResults.push(
          ...events.map(e => ({
            id: e.id,
            type: 'event' as const,
            title: e.title || 'Event',
            subtitle: e.event_date ? new Date(e.event_date).toLocaleDateString() : undefined,
            url: `/events/${e.id}`
          }))
        )
      }

      // Search by year (date search)
      const yearMatch = searchQuery.match(/^\d{4}$/)
      if (yearMatch) {
        searchResults.push({
          id: `year-${yearMatch[0]}`,
          type: 'date',
          title: `Stories from ${yearMatch[0]}`,
          url: `/search?year=${yearMatch[0]}`
        })
      }

      setResults(searchResults)
      track('search_performed', { 
        query: searchQuery, 
        resultCount: searchResults.length 
      })
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [isCommand, track])

  // Debounced search effect
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query)
    }, 150)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query, performSearch])

  // Get icon for result type
  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'person': return <Users className="h-4 w-4" />
      case 'story': return <BookOpen className="h-4 w-4" />
      case 'photo': return <Image className="h-4 w-4" />
      case 'audio': return <Mic className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'event': return <Calendar className="h-4 w-4" />
      case 'object': return <Box className="h-4 w-4" />
      case 'place': return <MapPin className="h-4 w-4" />
      case 'date': return <CalendarDays className="h-4 w-4" />
    }
  }

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  // Handle result selection
  const handleSelect = (url: string) => {
    setOpen(false)
    navigate(url)
    setQuery('')
    track('search_result_click' as any, { url })
  }

  // Handle command execution
  const handleCommandSelect = (command: Command) => {
    command.action()
    setQuery('')
  }

  const typeLabels: Record<string, string> = {
    person: 'People',
    story: 'Stories',
    photo: 'Photos',
    audio: 'Audio',
    video: 'Videos',
    event: 'Events',
    object: 'Objects',
    place: 'Places',
    date: 'Dates'
  }

  return (
    <>
      {/* Search trigger button - Desktop */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-background border border-input rounded-md hover:bg-accent hover:text-accent-foreground transition-colors w-full max-w-md"
        aria-label="Global search"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left truncate">Search or type &gt; for commands...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground">
          <CommandIcon className="h-3 w-3" />K
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search people, stories, places... or type > for commands"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {!query && (
            <CommandEmpty>Start typing to search...</CommandEmpty>
          )}

          {query && !isCommand && results.length === 0 && !isSearching && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {isSearching && (
            <CommandEmpty>Searching...</CommandEmpty>
          )}

          {/* Commands */}
          {isCommand && filteredCommands.length > 0 && (
            <CommandGroup heading="Commands">
              {filteredCommands.map((command) => (
                <CommandItem
                  key={command.id}
                  onSelect={() => handleCommandSelect(command)}
                  className="flex items-center gap-3"
                >
                  {command.icon}
                  <span>{command.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {isCommand && filteredCommands.length === 0 && commandQuery && (
            <CommandEmpty>No matching commands.</CommandEmpty>
          )}

          {/* Search Results */}
          {!isCommand && Object.keys(groupedResults).map((type, index) => (
            <div key={type}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={typeLabels[type] || type}>
                {groupedResults[type].map((result) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(result.url)}
                    className="flex items-center gap-3"
                  >
                    {getResultIcon(result.type)}
                    <div className="flex-1">
                      <div className="font-medium">{result.title}</div>
                      {result.subtitle && (
                        <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
