import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import CollectionsHeader from '@/components/collections/CollectionsHeader'
import CollectionsTabs from '@/components/collections/CollectionsTabs'
import ContentGrid from '@/components/collections/ContentGrid'
import { CollectionsService } from '@/lib/collectionsService'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import type { 
  Content, 
  ContentType, 
  ContentFilter, 
  ContentSort, 
  ViewMode, 
  ContentCounts 
} from '@/lib/collectionsTypes'

export default function Collections() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()

  // URL state
  const activeTab = (searchParams.get('tab') || 'all') as ContentType | 'all'
  const initialSearch = searchParams.get('search') || ''
  const initialSort = (searchParams.get('sort') || 'recent') as ContentSort

  // Local state
  const [content, setContent] = useState<Content[]>([])
  const [counts, setCounts] = useState<ContentCounts>({
    all: 0,
    stories: 0,
    recipes: 0,
    objects: 0,
    properties: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [sortBy, setSortBy] = useState<ContentSort>(initialSort)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [familyId, setFamilyId] = useState<string | null>(null)

  // Get user's family ID
  useEffect(() => {
    const getFamilyId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: member } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .single()

        if (member) {
          setFamilyId(member.family_id)
        }
      } catch (error) {
        console.error('Error getting family ID:', error)
      }
    }

    getFamilyId()
  }, [])

  // Load content counts
  useEffect(() => {
    if (!familyId) return

    const loadCounts = async () => {
      try {
        const counts = await CollectionsService.getContentCounts(familyId)
        setCounts(counts)
      } catch (error) {
        console.error('Error loading counts:', error)
        toast({
          title: "Error loading counts",
          description: "There was an issue loading content counts.",
          variant: "destructive"
        })
      }
    }

    loadCounts()
  }, [familyId, toast])

  // Create filter from current state
  const filter = useMemo<ContentFilter>(() => {
    const filter: ContentFilter = {}
    
    if (searchQuery) {
      filter.search = searchQuery
    }
    
    if (activeTab !== 'all') {
      filter.types = [activeTab as ContentType]
    }
    
    return filter
  }, [searchQuery, activeTab])

  // Load content when filter changes
  useEffect(() => {
    if (!familyId) return

    const loadContent = async () => {
      setLoading(true)
      try {
        const content = await CollectionsService.getContent(
          familyId,
          filter,
          sortBy,
          100, // limit
          0 // offset
        )
        setContent(content)
      } catch (error) {
        console.error('Error loading content:', error)
        toast({
          title: "Error loading content",
          description: "There was an issue loading your content.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [familyId, filter, sortBy, toast])

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (activeTab !== 'all') {
      params.set('tab', activeTab)
    }
    
    if (searchQuery) {
      params.set('search', searchQuery)
    }
    
    if (sortBy !== 'recent') {
      params.set('sort', sortBy)
    }
    
    setSearchParams(params)
  }, [activeTab, searchQuery, sortBy, setSearchParams])

  // Load view mode preference
  useEffect(() => {
    const savedViewMode = localStorage.getItem('collections-view-mode') as ViewMode
    if (savedViewMode) {
      setViewMode(savedViewMode)
    }
  }, [])

  // Save view mode preference
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('collections-view-mode', mode)
  }

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams)
    if (tab === 'all') {
      params.delete('tab')
    } else {
      params.set('tab', tab)
    }
    setSearchParams(params)
    setSelectedIds([]) // Clear selection when changing tabs
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setSelectedIds([]) // Clear selection when searching
  }

  const handleSortChange = (sort: ContentSort) => {
    setSortBy(sort)
  }

  const handleClearSelection = () => {
    setSelectedIds([])
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-8">
            {/* Header */}
            <CollectionsHeader
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              selectedCount={selectedIds.length}
              onClearSelection={handleClearSelection}
            />

            {/* Tabs */}
            <CollectionsTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              counts={counts}
            />

            {/* Content Grid */}
            <ContentGrid
              content={content}
              loading={loading}
              showSelection={selectedIds.length > 0}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              emptyStateType={activeTab}
            />
          </div>
        </main>
      </div>
    </AuthGate>
  )
}