import { useState, useEffect, useRef } from 'react'
import { Search, User, Users, FileText, Mail, Send, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAnalytics } from '@/hooks/useAnalytics'
import type { AdminSearchResult } from '@/lib/adminTypes'
import { useNavigate } from 'react-router-dom'

const ENTITY_ICONS = {
  person: User,
  family: Users,
  life_page: FileText,
  email: Mail,
  invite: Send
}

const ENTITY_COLORS = {
  person: 'bg-blue-100 text-blue-800',
  family: 'bg-green-100 text-green-800', 
  life_page: 'bg-purple-100 text-purple-800',
  email: 'bg-orange-100 text-orange-800',
  invite: 'bg-pink-100 text-pink-800'
}

export default function AdminGlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AdminSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const { track } = useAnalytics()
  const navigate = useNavigate()

  // Search functionality
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    track('ADMIN_SEARCH' as any, { query: searchQuery })

    try {
      const searchResults: AdminSearchResult[] = []

      // Search families
      const { data: families } = await supabase
        .from('families')
        .select('id, name, description, created_at, created_by')
        .ilike('name', `%${searchQuery}%`)
        .limit(10)

      families?.forEach(family => {
        searchResults.push({
          id: family.id,
          type: 'family',
          title: family.name,
          subtitle: family.description || 'No description',
          metadata: { 
            created_at: family.created_at,
            created_by: family.created_by 
          },
          href: `/admin/families/${family.id}`
        })
      })

      // Search profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(10)

      profiles?.forEach(profile => {
        searchResults.push({
          id: profile.id,
          type: 'person',
          title: profile.full_name || profile.email,
          subtitle: profile.email,
          metadata: { 
            created_at: profile.created_at 
          },
          href: `/admin/people/${profile.id}`
        })
      })

      // Search invites by token or email
      const { data: invites } = await supabase
        .from('invites')
        .select('id, token, email, family_id, role, created_at')
        .or(`token.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(10)

      invites?.forEach(invite => {
        searchResults.push({
          id: invite.id,
          type: 'invite',
          title: invite.email,
          subtitle: `Token: ${invite.token.substring(0, 8)}... | Role: ${invite.role}`,
          metadata: {
            family_id: invite.family_id,
            created_at: invite.created_at
          },
          href: `/admin/invites/${invite.id}`
        })
      })

      setResults(searchResults)
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleResultClick = (result: AdminSearchResult) => {
    navigate(result.href)
    setShowResults(false)
    setQuery('')
  }

  return (
    <div ref={searchRef} className="relative max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a name, email, or link token to begin."
          className="pl-10 pr-10"
          onFocus={() => query && setShowResults(true)}
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setQuery('')
              setResults([])
              setShowResults(false)
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showResults && (query || results.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-auto">
          <CardContent className="p-2">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              </div>
            ) : results.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground text-sm">
                {query ? 'No results found' : 'Type a name, email, or link token to begin.'}
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((result) => {
                  const Icon = ENTITY_ICONS[result.type]
                  return (
                    <div
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {result.title}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${ENTITY_COLORS[result.type]}`}
                          >
                            {result.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                        {result.metadata.created_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Created: {new Date(result.metadata.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}