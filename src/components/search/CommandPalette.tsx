import { useState, useEffect } from 'react'
import { Search, Plus, Users, Home, MessageSquare, ChefHat, Heart, MapPin } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useNavigate } from 'react-router-dom'
import { SearchService, type SearchResult } from '@/lib/searchService'
import { supabase } from '@/lib/supabase'
import { useAnalytics } from '@/hooks/useAnalytics'
import { cn } from '@/lib/utils'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

interface CommandAction {
  id: string
  label: string
  shortcut?: string
  icon: any
  action: () => void
  category: 'create' | 'navigate'
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  
  const navigate = useNavigate()
  const { track } = useAnalytics()

  // Get family ID
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

  // Define actions
  const actions: CommandAction[] = [
    {
      id: 'create-story',
      label: 'Create Story',
      shortcut: 'S',
      icon: Plus,
      category: 'create',
      action: () => {
        navigate('/stories/new')
        onClose()
        track('command_palette_action', { action: 'create_story' })
      }
    },
    {
      id: 'create-photo',
      label: 'Add Photos',
      shortcut: 'P',
      icon: Plus,
      category: 'create',
      action: () => {
        // Would open photo upload
        onClose()
        track('command_palette_action', { action: 'create_photo' })
      }
    },
    {
      id: 'create-voice',
      label: 'Record Voice Note',
      shortcut: 'V',
      icon: Plus,
      category: 'create',
      action: () => {
        // Would open voice recorder
        onClose()
        track('command_palette_action', { action: 'create_voice' })
      }
    },
    {
      id: 'create-recipe',
      label: 'Add Recipe',
      icon: ChefHat,
      category: 'create',
      action: () => {
        navigate('/recipes/new')
        onClose()
        track('command_palette_action', { action: 'create_recipe' })
      }
    },
    {
      id: 'add-property',
      label: 'Add Property',
      icon: Home,
      category: 'create',
      action: () => {
        navigate('/properties/new')
        onClose()
        track('command_palette_action', { action: 'add_property' })
      }
    },
    {
      id: 'add-pet',
      label: 'Add Pet',
      icon: Heart,
      category: 'create',
      action: () => {
        navigate('/pets/new')
        onClose()
        track('command_palette_action', { action: 'add_pet' })
      }
    },
    {
      id: 'invite-family',
      label: 'Invite Family Member',
      icon: Users,
      category: 'create',
      action: () => {
        navigate('/family/members')
        onClose()
        track('command_palette_action', { action: 'invite_family' })
      }
    },
    {
      id: 'answer-prompt',
      label: 'Answer Prompt',
      icon: MessageSquare,
      category: 'create',
      action: () => {
        navigate('/prompts')
        onClose()
        track('command_palette_action', { action: 'answer_prompt' })
      }
    },
    {
      id: 'home',
      label: 'Home',
      shortcut: 'H',
      icon: Home,
      category: 'navigate',
      action: () => {
        navigate('/home')
        onClose()
        track('command_palette_action', { action: 'navigate_home' })
      }
    },
    {
      id: 'collections',
      label: 'Collections',
      shortcut: 'C',
      icon: MapPin,
      category: 'navigate',
      action: () => {
        navigate('/collections')
        onClose()
        track('command_palette_action', { action: 'navigate_collections' })
      }
    }
  ]

  // Search when query changes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (query.length >= 2 && familyId) {
      setIsSearching(true)
      timeoutId = setTimeout(async () => {
        try {
          console.log('Searching for:', query, 'in family:', familyId)
          const searchResults = await SearchService.search({
            query,
            familyId,
            limit: 8
          })
          console.log('Search results:', searchResults)
          setResults(searchResults.results)
          setActiveIndex(0) // Start with first search result
        } catch (error) {
          console.error('Command palette search error:', error)
        } finally {
          setIsSearching(false)
        }
      }, 200)
    } else {
      setResults([])
      setActiveIndex(0)
      setIsSearching(false)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [query, familyId])

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setResults([])
      setActiveIndex(0)
      track('command_palette_open')
    }
  }, [isOpen, track])

  // Group results by type with people first
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, typeof results>)
  
  // Sort groups to show people first
  const sortedGroups = Object.entries(groupedResults).sort(([typeA], [typeB]) => {
    if (typeA === 'person') return -1
    if (typeB === 'person') return 1
    return 0
  })

  const allItems = [...results, ...actions]

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => Math.min(prev + 1, allItems.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        const activeItem = allItems[activeIndex]
        if (activeItem) {
          if ('action' in activeItem) {
            activeItem.action()
          } else {
            track('nav_search_submit', { 
              entity_type: activeItem.type,
              entity_id: activeItem.id,
              destination: activeItem.url
            })
            navigate(activeItem.url)
            onClose()
          }
        }
        break
      case 'Escape':
        onClose()
        break
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent hideClose className="max-w-lg p-0">
        <DialogTitle className="sr-only">Search and Commands</DialogTitle>
        <div className="border rounded-lg bg-background shadow-lg">
          {/* Search Input */}
          <div className="flex items-center border-b px-4">
            <Search className="h-4 w-4 text-muted-foreground mr-3" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or type a command..."
              className="border-0 focus-visible:ring-0 text-base"
              autoFocus
            />
            <Badge variant="outline" className="ml-2 text-xs">
              Esc
            </Badge>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {/* Search Results Section - Show First with People at Top */}
            {(results.length > 0 || isSearching) && (
              <div className="p-2">
                {sortedGroups.map(([type, items], groupIndex) => (
                  <div key={type} className={groupIndex > 0 ? 'mt-3' : ''}>
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground mb-1 capitalize">
                      {type === 'person' ? 'People' : type}s
                    </div>
                    {items.map((result) => {
                      const resultIndex = results.findIndex(r => r.id === result.id)
                      const isActive = activeIndex === resultIndex
                      
                      return (
                        <button
                          key={result.id}
                          className={cn(
                            "w-full flex items-start gap-3 px-3 py-2 text-left text-sm rounded hover:bg-accent transition-colors",
                            isActive && "bg-accent"
                          )}
                          onClick={() => {
                            track('nav_search_submit', { 
                              entity_type: result.type,
                              entity_id: result.id,
                              destination: result.url
                            })
                            navigate(result.url)
                            onClose()
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{result.title}</div>
                            {result.subtitle && (
                              <div className="text-xs text-muted-foreground truncate">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs capitalize shrink-0">
                            {result.type}
                          </Badge>
                        </button>
                      )
                    })}
                  </div>
                ))}
                
                {isSearching && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Searching...
                  </div>
                )}
              </div>
            )}

            {/* Actions Section - Show After Search Results */}
            {(!query || results.length > 0) && (
              <div className={cn("p-2", results.length > 0 && "border-t")}>
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground mb-1">
                  Actions
                </div>
                {actions.map((action) => {
                  const Icon = action.icon
                  const actionIndex = results.length + actions.findIndex(a => a.id === action.id)
                  const isActive = activeIndex === actionIndex
                  
                  return (
                    <button
                      key={action.id}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-left text-sm rounded hover:bg-accent transition-colors",
                        isActive && "bg-accent"
                      )}
                      onClick={action.action}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{action.label}</span>
                      {action.shortcut && (
                        <Badge variant="outline" className="h-5 px-1 text-xs">
                          {action.shortcut}
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* No results */}
            {query.length >= 2 && !isSearching && results.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}