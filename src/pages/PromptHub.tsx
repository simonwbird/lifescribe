import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, BookOpen, CheckCircle2, Clock } from 'lucide-react'
import { usePrompts, type PromptInstance } from '@/hooks/usePrompts'
import { StarterPack } from '@/components/prompts/StarterPack'
import { PromptFilters, type PromptFilter } from '@/components/prompts/PromptFilters'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Skeleton } from '@/components/ui/skeleton'
import { ListenButton } from '@/components/prompts/ListenButton'
import { cn } from '@/lib/utils'

export default function PromptHub() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { track } = useAnalytics()
  
  const [familyId, setFamilyId] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [userCreatedAt, setUserCreatedAt] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'all')
  const [activeFilter, setActiveFilter] = useState<PromptFilter>(null)
  const [completedStarterPrompts, setCompletedStarterPrompts] = useState<Set<string>>(new Set())

  const { instances, counts, loading } = usePrompts(familyId)

  // Get user info and check if new user (< 7 days)
  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setUserCreatedAt(new Date(user.created_at))

        // Get first family membership (handles users with multiple families)
        const { data: members } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .limit(1)

        if (members && members.length > 0) {
          setFamilyId(members[0].family_id)
        }

        // Load completed starter prompts from localStorage
        const saved = localStorage.getItem(`starter_pack_completed_${user.id}`)
        if (saved) {
          setCompletedStarterPrompts(new Set(JSON.parse(saved)))
        }
      }
    }

    getUserInfo()
  }, [])

  // Check if user is new (within first 7 days)
  const isNewUser = useMemo(() => {
    if (!userCreatedAt) return false
    const daysSinceCreation = (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceCreation < 7
  }, [userCreatedAt])

  // Get starter pack prompts (3 "Firsts" prompts)
  const starterPackPrompts = useMemo(() => {
    if (!isNewUser) return []
    
    return instances
      .filter(p => {
        const category = p.prompt?.category?.toLowerCase()
        return category === 'firsts' || category === 'first' || 
               p.prompt?.tags?.some(tag => tag.toLowerCase().includes('first'))
      })
      .filter(p => p.status === 'open')
      .slice(0, 3)
  }, [instances, isNewUser])

  // Handle starter prompt completion
  const handleStarterPromptComplete = (promptId: string) => {
    const newCompleted = new Set(completedStarterPrompts).add(promptId)
    setCompletedStarterPrompts(newCompleted)
    localStorage.setItem(`starter_pack_completed_${userId}`, JSON.stringify([...newCompleted]))
  }

  // Filter prompts by category
  const getFilteredPrompts = (prompts: PromptInstance[]) => {
    if (!activeFilter) return prompts

    return prompts.filter(prompt => {
      const category = prompt.prompt?.category?.toLowerCase() || ''
      const tags = prompt.prompt?.tags || []

      switch (activeFilter) {
        case 'people':
          return category.includes('people') || category.includes('person') || 
                 tags.some(t => t.toLowerCase().includes('people'))
        case 'places':
          return category.includes('place') || category.includes('location') ||
                 tags.some(t => t.toLowerCase().includes('place'))
        case 'firsts':
          return category.includes('first') || 
                 tags.some(t => t.toLowerCase().includes('first'))
        case 'food':
          return category.includes('food') || category.includes('recipe') ||
                 tags.some(t => t.toLowerCase().includes('food') || t.toLowerCase().includes('recipe'))
        case 'objects':
          return category.includes('object') || category.includes('thing') ||
                 tags.some(t => t.toLowerCase().includes('object') || t.toLowerCase().includes('thing'))
        default:
          return true
      }
    })
  }

  // Get filtered prompts for each tab
  const openPrompts = getFilteredPrompts(instances.filter(p => p.status === 'open'))
  const completedPrompts = getFilteredPrompts(instances.filter(p => p.status === 'completed'))
  const allPrompts = getFilteredPrompts(instances)

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    const filters: PromptFilter[] = ['people', 'places', 'firsts', 'food', 'objects']
    
    filters.forEach(filter => {
      counts[filter] = instances.filter(prompt => {
        const category = prompt.prompt?.category?.toLowerCase() || ''
        const tags = prompt.prompt?.tags || []

        switch (filter) {
          case 'people':
            return category.includes('people') || category.includes('person') || 
                   tags.some(t => t.toLowerCase().includes('people'))
          case 'places':
            return category.includes('place') || category.includes('location') ||
                   tags.some(t => t.toLowerCase().includes('place'))
          case 'firsts':
            return category.includes('first') || 
                   tags.some(t => t.toLowerCase().includes('first'))
          case 'food':
            return category.includes('food') || category.includes('recipe') ||
                   tags.some(t => t.toLowerCase().includes('food') || t.toLowerCase().includes('recipe'))
          case 'objects':
            return category.includes('object') || category.includes('thing') ||
                   tags.some(t => t.toLowerCase().includes('object') || t.toLowerCase().includes('thing'))
          default:
            return false
        }
      }).length
    })

    return counts
  }, [instances])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSearchParams({ tab })
    track('prompt_hub_tab_changed', { tab })
  }

  const handlePromptClick = (prompt: PromptInstance) => {
    track('prompt_hub_prompt_clicked', {
      prompt_id: prompt.id,
      prompt_title: prompt.prompt?.title,
      prompt_category: prompt.prompt?.category,
      tab: activeTab,
      filter: activeFilter
    })

    const searchParams = new URLSearchParams({
      type: 'text',
      promptTitle: prompt.prompt?.title || '',
      prompt_id: prompt.id,
      prompt_text: prompt.prompt?.body || ''
    })

    navigate(`/stories/new?${searchParams.toString()}`)
  }

  const renderPromptCard = (prompt: PromptInstance) => (
    <Card
      key={prompt.id}
      className="cursor-pointer hover:shadow-lg transition-all group"
      onClick={() => handlePromptClick(prompt)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Badge variant="secondary" className="capitalize">
              {prompt.prompt?.category || 'General'}
            </Badge>
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {prompt.prompt?.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ListenButton
              text={`${prompt.prompt?.title}. ${prompt.prompt?.body || ''}`}
              promptId={prompt.id}
              size="icon"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
            {prompt.status === 'completed' && (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
            {prompt.status === 'in_progress' && (
              <Clock className="h-5 w-5 text-orange-600" />
            )}
          </div>
        </div>
      </CardHeader>
      {prompt.prompt?.body && (
        <CardContent>
          <CardDescription className="line-clamp-2">
            {prompt.prompt.body}
          </CardDescription>
        </CardContent>
      )}
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Prompt Hub</h1>
              <p className="text-muted-foreground">
                Discover and respond to family story prompts
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-semibold">{counts.open}</span> open
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                <span className="font-semibold">{counts.completed}</span> completed
              </span>
            </div>
          </div>
        </div>

        {/* Starter Pack for new users */}
        {isNewUser && starterPackPrompts.length > 0 && (
          <StarterPack
            prompts={starterPackPrompts}
            completedPrompts={completedStarterPrompts}
            onComplete={handleStarterPromptComplete}
          />
        )}

        {/* Filters */}
        <PromptFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={filterCounts}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="all" className="gap-2">
              <BookOpen className="h-4 w-4" />
              All
              <Badge variant="secondary" className="ml-1">{allPrompts.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="open" className="gap-2">
              <Clock className="h-4 w-4" />
              Open
              <Badge variant="secondary" className="ml-1">{openPrompts.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Completed
              <Badge variant="secondary" className="ml-1">{completedPrompts.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allPrompts.length === 0 ? (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">
                        No prompts found matching your filters.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setActiveFilter(null)}
                        className="mt-4"
                      >
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                allPrompts.map(renderPromptCard)
              )}
            </div>
          </TabsContent>

          <TabsContent value="open" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {openPrompts.length === 0 ? (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="py-12 text-center space-y-2">
                      <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                      <p className="text-lg font-medium">All caught up!</p>
                      <p className="text-muted-foreground">
                        You've completed all open prompts.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                openPrompts.map(renderPromptCard)
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedPrompts.length === 0 ? (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">
                        No completed prompts yet. Start responding to build your collection!
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                completedPrompts.map(renderPromptCard)
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
