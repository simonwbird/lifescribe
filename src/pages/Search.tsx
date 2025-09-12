import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search as SearchIcon, X, Filter, User, MapPin, Calendar, Tag, FileText, Image, ChefHat, Heart, Home } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import AuthGate from '@/components/AuthGate'
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

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<SearchResult[]>([])
  const [smartAnswer, setSmartAnswer] = useState<SmartAnswer | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [showFilters, setShowFilters] = useState(false)

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

  const performSearch = async () => {
    if (!query.trim() || !familyId) return

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

      track('search_performed', {
        query: query.trim(),
        results_count: searchResults.total,
        has_smart_answer: !!searchResults.smartAnswer,
        filters_count: Object.keys(filters).length
      })
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    if (query.trim()) {
      setSearchParams({ q: query.trim() })
      performSearch()
    }
  }

  const addFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), value]
    }))
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

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
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

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
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
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 text-base"
                />
              </div>
              <Button onClick={handleSearch} disabled={!query.trim()}>
                Search
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && "bg-accent")}
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

          {/* Results */}
          {!isLoading && (
            <div className="space-y-8">
              {Object.entries(groupedResults).map(([type, typeResults]) => {
                const Icon = typeIcons[type as keyof typeof typeIcons] || FileText
                
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b sticky top-0 bg-background z-10">
                      <Icon className="h-4 w-4" />
                      <h2 className="text-lg font-semibold">{getTypeLabel(type)}</h2>
                      <Badge variant="secondary">{typeResults.length}</Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {typeResults.map((result) => (
                        <SearchResultItem
                          key={result.id}
                          result={result}
                          onResultClick={() => {
                            track('search_result_click', {
                              entity_type: result.type,
                              entity_id: result.id,
                              position: typeResults.indexOf(result)
                            })
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && query && results.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No matches yet</h3>
                <p className="text-muted-foreground mb-4">
                  Try a name, place, or year—or create something new.
                </p>
                <Button onClick={() => {
                  const createUrl = `/stories/new?title=${encodeURIComponent(query)}`
                  window.location.href = createUrl
                  track('search_create_from_empty', { query, type: 'story' })
                }}>
                  Create story: "{query}"
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGate>
  )
}