import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, Circle, Clock, Play, Eye, ArrowRight, Cake, Heart, XCircle } from 'lucide-react'
import { usePrompts } from '@/hooks/usePrompts'
import { supabase } from '@/integrations/supabase/client'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import AuthGate from '@/components/AuthGate'
import CategorySection from '@/components/prompts/CategorySection'
import { ProgressHeader } from '@/components/prompts/ProgressHeader'
import { FilterBar, type FilterOptions, type ActiveFilters } from '@/components/prompts/FilterBar'
import { PromptStatusActions } from '@/components/prompts/PromptStatusActions'
import { useLabs } from '@/hooks/useLabs'

export default function PromptsBrowse() {
  const [familyId, setFamilyId] = useState('')
  const [people, setPeople] = useState<Array<{ id: string; name: string }>>([])
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({})
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const defaultTab = searchParams.get('status') || 'open'
  const { flags } = useLabs()
  
  const { 
    instances, 
    counts, 
    loading, 
    error, 
    fetchPrompts, 
    startPrompt,
    getBirthdayPrompts,
    getFavoritePrompts,
    getDaysUntilBirthday
  } = usePrompts(familyId)

  useEffect(() => {
    async function loadFamilyData() {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.user.id)
        .single()

      if (member) {
        setFamilyId(member.family_id)
        
        // Load family members for filtering
        const { data: peopleData } = await supabase
          .from('people')
          .select('id, full_name')
          .eq('family_id', member.family_id)
          .order('full_name')
        
        setPeople(peopleData?.map(p => ({
          id: p.id,
          name: p.full_name || 'Unknown'
        })) || [])
      }
    }

    loadFamilyData()
  }, [])

  const handleStartPrompt = async (instanceId: string) => {
    try {
      await startPrompt(instanceId)
      // Navigate to story creation with prompt context
      const instance = instances.find(i => i.id === instanceId)
      if (instance?.prompt) {
        const searchParams = new URLSearchParams({
          type: 'text',
          promptTitle: instance.prompt.title,
          prompt_id: instance.id,
          prompt_text: instance.prompt.body
        })
        navigate(`/stories/new?${searchParams.toString()}`)
      }
    } catch (error) {
      console.error('Failed to start prompt:', error)
    }
  }

  const handleContinuePrompt = (instanceId: string) => {
    const instance = instances.find(i => i.id === instanceId)
    if (instance?.prompt) {
      const searchParams = new URLSearchParams({
        type: 'text',
        promptTitle: instance.prompt.title,
        prompt_id: instance.id,
        prompt_text: instance.prompt.body
      })
      navigate(`/stories/new?${searchParams.toString()}`)
    }
  }

  const handleViewPrompt = (instanceId: string) => {
    // Navigate to view completed response
    navigate(`/stories?prompt=${instanceId}`)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Circle className="h-4 w-4 text-muted-foreground" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'skipped':
      case 'not_applicable':
        return <XCircle className="h-4 w-4 text-muted-foreground" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  const getActionButton = (instance: any) => {
    if (flags['prompts.progressAndFilters']) {
      return (
        <PromptStatusActions
          instanceId={instance.id}
          promptTitle={instance.prompt?.title || 'Untitled'}
          status={instance.status}
          onStatusChange={() => fetchPrompts()}
          onStartPrompt={() => handleStartPrompt(instance.id)}
        />
      )
    }

    // Fallback for when feature flag is disabled
    switch (instance.status) {
      case 'open':
        return (
          <Button 
            onClick={() => handleStartPrompt(instance.id)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Start
          </Button>
        )
      case 'in_progress':
        return (
          <Button 
            onClick={() => handleContinuePrompt(instance.id)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Continue
          </Button>
        )
      case 'completed':
        return (
          <Button 
            onClick={() => handleViewPrompt(instance.id)}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            View
          </Button>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-6">
            <div className="space-y-4">
              <div className="h-8 bg-muted animate-pulse rounded" />
              <div className="grid gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </AuthGate>
    )
  }

  // Filter instances based on active filters
  const filterInstances = (instances: any[], status?: string) => {
    let filtered = instances
    
    if (status) {
      filtered = filtered.filter(i => i.status === status)
    }
    
    if (activeFilters.category) {
      filtered = filtered.filter(i => i.prompt?.category === activeFilters.category)
    }
    
    if (activeFilters.person_id) {
      if (activeFilters.person_id === 'no-person') {
        filtered = filtered.filter(i => !i.person_ids || i.person_ids.length === 0)
      } else {
        filtered = filtered.filter(i => 
          i.person_ids && i.person_ids.includes(activeFilters.person_id)
        )
      }
    }
    
    if (activeFilters.media) {
      // For now, this would filter by intended media type from prompt metadata
      // This could be enhanced based on prompt metadata or tags
    }
    
    if (activeFilters.time_range) {
      const now = new Date()
      let timeFilter: Date
      
      switch (activeFilters.time_range) {
        case 'Recent':
          timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 1 week
          break
        case 'This month':
          timeFilter = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          timeFilter = new Date(0) // All time
      }
      
      filtered = filtered.filter(i => new Date(i.created_at || '') >= timeFilter)
    }
    
    return filtered
  }

  const filterOptions: FilterOptions = {
    categories: ['People', 'Places', 'Firsts', 'Food & Music', 'Advice & Wisdom', 'Pride & Resilience', 'Birthdays', 'Favorites'],
    people: people,
    mediaTypes: ['Text', 'Audio', 'Video', 'Photo'],
    timeRanges: ['Recent', 'This month', 'All time'],
    statuses: ['open', 'in_progress', 'completed', 'skipped', 'not_applicable', 'snoozed']
  }

  const openInstances = filterInstances(instances.filter(i => 
    i.status === 'open' && !['birthday', 'favorites'].includes(i.source || '')
  ))
  const inProgressInstances = filterInstances(instances, 'in_progress')
  const completedInstances = filterInstances(instances, 'completed')
  const skippedInstances = filterInstances(instances.filter(i => 
    ['skipped', 'not_applicable'].includes(i.status)
  ))

  const birthdayPrompts = flags['prompts.birthdays'] ? getBirthdayPrompts() : []
  const favoritePrompts = flags['prompts.favorites'] ? getFavoritePrompts() : []

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 space-y-6">
          {/* Progress Header */}
          {flags['prompts.progressAndFilters'] && (
            <ProgressHeader familyId={familyId} variant="full" />
          )}

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Browse Prompts</h1>
              <p className="text-muted-foreground mt-1">
                Open ({openInstances.length}) • Completed ({completedInstances.length})
                {flags['prompts.progressAndFilters'] && skippedInstances.length > 0 && (
                  <> • Skipped/NA ({skippedInstances.length})</>
                )}
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          {flags['prompts.progressAndFilters'] && (
            <FilterBar
              options={filterOptions}
              activeFilters={activeFilters}
              onFilterChange={setActiveFilters}
              onClearAll={() => setActiveFilters({})}
            />
          )}

          {/* Birthday Prompts */}
          <CategorySection
            title="Birthday Celebrations"
            icon={<Cake className="h-6 w-6 text-primary" />}
            instances={birthdayPrompts}
            onPromptClick={handleStartPrompt}
            showDueBadges={true}
            getDaysUntilBirthday={getDaysUntilBirthday}
          />

          {/* Favorite Prompts */}
          <CategorySection
            title="About Your Favorites"
            icon={<Heart className="h-6 w-6 text-pink-500" />}
            instances={favoritePrompts}
            onPromptClick={handleStartPrompt}
          />

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className={`grid w-full ${flags['prompts.progressAndFilters'] ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="open" className="flex items-center gap-2">
                <Circle className="h-4 w-4" />
                Open ({openInstances.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed ({completedInstances.length})
              </TabsTrigger>
              {flags['prompts.progressAndFilters'] && (
                <TabsTrigger value="skipped" className="flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Skipped/NA ({skippedInstances.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="open" className="space-y-4 mt-6">
              {openInstances.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-medium mb-2">You're all caught up!</h3>
                    <p className="text-muted-foreground text-center">
                      Check Completed to see your finished prompts, or explore everything in our full catalog.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {openInstances.map((instance) => (
                    <Card key={instance.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getStatusIcon(instance.status)}
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                {instance.prompt?.title || 'Untitled Prompt'}
                              </CardTitle>
                              <Badge variant="outline" className="mt-2">
                                {instance.prompt?.category}
                              </Badge>
                            </div>
                          </div>
                          {getActionButton(instance)}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-muted-foreground">
                          {instance.prompt?.body}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-6">
              {completedInstances.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No completed prompts yet</h3>
                    <p className="text-muted-foreground text-center">
                      Start working on some prompts and they'll appear here when completed.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {completedInstances.map((instance) => (
                    <Card key={instance.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getStatusIcon(instance.status)}
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                {instance.prompt?.title || 'Untitled Prompt'}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">
                                  {instance.prompt?.category}
                                </Badge>
                                <Badge variant="secondary" className="text-green-700 bg-green-100">
                                  Completed
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {getActionButton(instance)}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-muted-foreground">
                          {instance.prompt?.body}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Skipped/Not Applicable Tab */}
            {flags['prompts.progressAndFilters'] && (
              <TabsContent value="skipped" className="space-y-4 mt-6">
                {skippedInstances.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No skipped prompts</h3>
                      <p className="text-muted-foreground text-center">
                        Prompts you skip or mark as not applicable will appear here.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {skippedInstances.map((instance) => (
                      <Card key={instance.id} className="hover:shadow-md transition-shadow opacity-75">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {getStatusIcon(instance.status)}
                              <div className="flex-1">
                                <CardTitle className="text-lg">
                                  {instance.prompt?.title || 'Untitled Prompt'}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline">
                                    {instance.prompt?.category}
                                  </Badge>
                                  <Badge variant="secondary" className="bg-gray-100">
                                    {instance.status === 'skipped' ? 'Skipped' : 'Not Applicable'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-muted-foreground">
                            {instance.prompt?.body}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>
    </AuthGate>
  )
}