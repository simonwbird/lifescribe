import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search as SearchIcon, X, Filter, User, MapPin, Calendar, Tag, FileText, Image, ChefHat, Heart, Home } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Header from '@/components/Header'
import { SearchService, type SearchResult, type SearchFilters, type SmartAnswer } from '@/lib/searchService'
import { supabase } from '@/lib/supabase'
import { useAnalytics } from '@/hooks/useAnalytics'
import { cn } from '@/lib/utils'
import SmartAnswerCard from '@/components/search/SmartAnswerCard'
import SearchResultItem from '@/components/search/SearchResultItem'

const typeIcons = {
  person: User,
  story: FileText,
  photo: Image,
  voice: FileText,
  video: Image,
  recipe: ChefHat,
  object: Home,
  pet: Heart,
  property: MapPin,
  document: FileText,
  prompt: FileText,
  comment: FileText
}

type TabValue = 'all' | 'people' | 'stories' | 'objects' | 'places'

// Simple cache with 60s TTL
const searchCache = new Map<string, { results: SearchResult[]; timestamp: number; total: number; smartAnswer?: SmartAnswer }>()
const CACHE_TTL = 60000 // 60 seconds

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [smartAnswer, setSmartAnswer] = useState<SmartAnswer | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState<TabValue>((searchParams.get('tab') as TabValue) || 'all')

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

  // Search when query or filters change
  useEffect(() => {
    if (query && familyId) {
      performSearch()
    } else {
      setResults([])
      setSmartAnswer(undefined)
      setTotal(0)
    }
  }, [query, familyId, filters])

  // Update query from URL
  useEffect(() => {
    const urlQuery = searchParams.get('q')
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery)
    }
  }, [searchParams])

  const performSearch = useCallback(async () => {
    if (!query.trim() || !familyId) return

    // Check cache first
    const cacheKey = `${query.trim()}-${JSON.stringify(filters)}-${familyId}`
    const cached = searchCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setResults(cached.results)
      setSmartAnswer(cached.smartAnswer)
      setTotal(cached.total)
      return
    }

    setIsLoading(true)
    try {
      const searchResults = await SearchService.search({
        query: query.trim(),
        filters,
        familyId,
        limit: 50
      })

      setResults(searchResults.results)
      setSmartAnswer(searchResults.smartAnswer)
      setTotal(searchResults.total)

      // Cache results
      searchCache.set(cacheKey, {
        results: searchResults.results,
        total: searchResults.total,
        smartAnswer: searchResults.smartAnswer,
        timestamp: Date.now()
      })

      track('search_performed', {
        query: query.trim(),
        results_count: searchResults.total,
        has_smart_answer: !!searchResults.smartAnswer,
        filters_count: Object.keys(filters).length,
        active_tab: activeTab,
        has_results: searchResults.total > 0
      })
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [query, filters, familyId, track, activeTab])

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      const params = new URLSearchParams()
      params.set('q', query.trim())
      if (activeTab !== 'all') params.set('tab', activeTab)
      setSearchParams(params)
      track('search_performed', { query: query.trim(), tab: activeTab })
      performSearch()
    }
  }, [query, activeTab, setSearchParams, track, performSearch])

  const handleTabChange = useCallback((tab: TabValue) => {
    setActiveTab(tab)
    const params = new URLSearchParams(searchParams)
    if (tab === 'all') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    setSearchParams(params)
    track('search_filter_add', { filter_type: 'tab', filter_value: tab })
  }, [activeTab, searchParams, setSearchParams, track])

  const addFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => {
      const current = prev[key] as unknown;
      const arr = Array.isArray(current)
        ? (current as string[])
        : current !== undefined
          ? [String(current)]
          : [];
      return {
        ...prev,
        [key]: [...arr, value]
      };
    })
    track('search_filter_add', { filter_type: key, filter_value: value })
  }

  const removeFilter = (key: keyof SearchFilters, value?: string) => {
    if (!value) {
      // Remove entire filter category
      const newFilters = { ...filters }
      delete newFilters[key]
      setFilters(newFilters)
    } else {
      // Remove specific filter value
      setFilters(prev => ({
        ...prev,
        [key]: Array.isArray(prev[key]) ? (prev[key] as string[]).filter(v => v !== value) : prev[key]
      }))
    }
    track('search_filter_remove', { filter_type: key, filter_value: value })
  }

  // Group results by category for tabs
  const categorizedResults = useMemo(() => {
    const people = results.filter(r => r.type === 'person')
    const stories = results.filter(r => r.type === 'story' || r.type === 'photo' || r.type === 'voice' || r.type === 'video' || r.type === 'document')
    const objects = results.filter(r => r.type === 'recipe' || r.type === 'pet' || r.type === 'object')
    const places = results.filter(r => r.type === 'property')
    
    return { people, stories, objects, places }
  }, [results])

  // Determine which tab has most results for default
  const defaultTab = useMemo(() => {
    if (activeTab !== 'all' || results.length === 0) return activeTab
    
    const counts = {
      people: categorizedResults.people.length,
      stories: categorizedResults.stories.length,
      objects: categorizedResults.objects.length,
      places: categorizedResults.places.length
    }
    
    const maxCount = Math.max(...Object.values(counts))
    const defaultTab = Object.entries(counts).find(([_, count]) => count === maxCount)?.[0] as TabValue
    return defaultTab || 'all'
  }, [results, categorizedResults, activeTab])

  // Get filtered results based on active tab
  const filteredResults = useMemo(() => {
    if (activeTab === 'all') return results
    if (activeTab === 'people') return categorizedResults.people
    if (activeTab === 'stories') return categorizedResults.stories
    if (activeTab === 'objects') return categorizedResults.objects
    if (activeTab === 'places') return categorizedResults.places
    return results
  }, [activeTab, results, categorizedResults])

  // Group filtered results by type for display
  const groupedResults = filteredResults.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  const getTypeLabel = (type: string) => {
    const labels = {
      person: 'People',
      story: 'Stories',
      photo: 'Photos',
      voice: 'Voice Notes',
      video: 'Videos',
      recipe: 'Recipes',
      object: 'Objects',
      pet: 'Pets',
      property: 'Properties',
      document: 'Documents',
      prompt: 'Prompts',
      comment: 'Comments'
    }
    return labels[type as keyof typeof labels] || type
  }

  // Recent searches for zero-state
  const recentSearches = useMemo(() => ['family vacation', 'grandma', 'recipes'], [])

  return (
    <div className="min-h-screen bg-background" data-test="global-search">
        <Header />
        
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Search Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-2xl">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search people, stories, places…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch()
                    } else if (e.key === 'Tab' && !e.shiftKey) {
                      // Allow Tab to move to next element
                    }
                  }}
                  className="pl-10 text-base"
                  data-test="search-input"
                />
              </div>
              <Button onClick={handleSearch} disabled={!query.trim()} data-test="search-button">
                Search
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && "bg-accent")}
                aria-label="Toggle filters"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Active Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(filters).map(([key, values]) => 
                Array.isArray(values) ? values.map(value => (
                  <Badge key={`${key}-${value}`} variant="secondary" className="gap-1">
                    {key}: {value}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter(key as keyof SearchFilters, value)}
                    />
                  </Badge>
                )) : (
                  <Badge key={key} variant="secondary" className="gap-1">
                    {key}: {values}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeFilter(key as keyof SearchFilters)}
                    />
                  </Badge>
                )
              )}
            </div>

            {/* Results Summary */}
            {query && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {isLoading ? 'Searching...' : `${total} results for "${query}"`}
                </span>
              </div>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select onValueChange={(value) => addFilter('type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="person">People</SelectItem>
                        <SelectItem value="story">Stories</SelectItem>
                        <SelectItem value="recipe">Recipes</SelectItem>
                        <SelectItem value="property">Properties</SelectItem>
                        <SelectItem value="pet">Pets</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Year</label>
                    <Input
                      type="number"
                      placeholder="e.g. 2020"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value
                          if (value) {
                            addFilter('year', value)
                            ;(e.target as HTMLInputElement).value = ''
                          }
                        }
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tag</label>
                    <Input
                      placeholder="Add tag filter"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const value = (e.target as HTMLInputElement).value.trim()
                          if (value) {
                            addFilter('tag', value)
                            ;(e.target as HTMLInputElement).value = ''
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Smart Answer Card */}
          {smartAnswer && (
            <div className="mb-6">
              <SmartAnswerCard 
                smartAnswer={smartAnswer}
                onRefinement={(refinement) => {
                  Object.entries(refinement.filter).forEach(([key, values]) => {
                    if (Array.isArray(values)) {
                      values.forEach(value => addFilter(key as keyof SearchFilters, value))
                    }
                  })
                }}
              />
            </div>
          )}

          {/* Tabbed Results */}
          {query && !isLoading && results.length > 0 && (
            <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as TabValue)} className="space-y-6">
              <TabsList className="w-full justify-start" data-test="search-tabs">
                <TabsTrigger value="all" data-test="tab-all">
                  All
                  <Badge variant="secondary" className="ml-2">{total}</Badge>
                </TabsTrigger>
                <TabsTrigger value="people" data-test="tab-people">
                  <User className="h-3 w-3 mr-1" />
                  People
                  <Badge variant="secondary" className="ml-2">{categorizedResults.people.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="stories" data-test="tab-stories">
                  <FileText className="h-3 w-3 mr-1" />
                  Stories
                  <Badge variant="secondary" className="ml-2">{categorizedResults.stories.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="objects" data-test="tab-objects">
                  <Home className="h-3 w-3 mr-1" />
                  Objects
                  <Badge variant="secondary" className="ml-2">{categorizedResults.objects.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="places" data-test="tab-places">
                  <MapPin className="h-3 w-3 mr-1" />
                  Places
                  <Badge variant="secondary" className="ml-2">{categorizedResults.places.length}</Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-8">
                {Object.entries(groupedResults).map(([type, typeResults]) => {
                  const Icon = typeIcons[type as keyof typeof typeIcons] || FileText
                  
                  return (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b">
                        <Icon className="h-4 w-4" />
                        <h2 className="text-lg font-semibold">{getTypeLabel(type)}</h2>
                        <Badge variant="secondary">{typeResults.length}</Badge>
                      </div>
                      
                      <div className="space-y-3">
                        {typeResults.map((result, index) => (
                          <SearchResultItem
                            key={result.id}
                            result={result}
                            onResultClick={() => {
                              track('search_result_click', {
                                entity_type: result.type,
                                entity_id: result.id,
                                position: index,
                                tab: activeTab
                              })
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </TabsContent>
            </Tabs>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State with Suggestions */}
          {!isLoading && query && results.length === 0 && (
            <Card data-test="zero-results">
              <CardContent className="p-8 text-center">
                <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No matches yet</h3>
                <p className="text-muted-foreground mb-6">
                  Try a name, place, or year—or create something new.
                </p>
                
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-2">Try searching for:</div>
                  <div className="flex flex-wrap gap-2 justify-center mb-6">
                    {recentSearches.map(search => (
                      <Badge 
                        key={search}
                        variant="outline" 
                        className="cursor-pointer hover:bg-accent"
                        onClick={() => {
                          setQuery(search)
                          track('search_suggestion_click', { suggestion: search, source: 'zero_state' })
                        }}
                      >
                        {search}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button onClick={() => {
                    navigate(`/stories/new?title=${encodeURIComponent(query)}`)
                    track('search_create_from_empty', { query, type: 'story' })
                  }}>
                    Create story: "{query}"
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
         </div>
       </div>
     )
   }