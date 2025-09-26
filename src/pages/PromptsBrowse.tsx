import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, Circle, Clock, Play, Eye, ArrowRight, Cake, Heart } from 'lucide-react'
import { usePrompts } from '@/hooks/usePrompts'
import { supabase } from '@/integrations/supabase/client'
import { useNavigate } from 'react-router-dom'
import Header from '@/components/Header'
import AuthGate from '@/components/AuthGate'
import CategorySection from '@/components/prompts/CategorySection'
import { useLabs } from '@/hooks/useLabs'

export default function PromptsBrowse() {
  const [familyId, setFamilyId] = useState('')
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
    async function loadFamilyId() {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.user.id)
        .single()

      if (member) {
        setFamilyId(member.family_id)
      }
    }

    loadFamilyId()
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
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  const getActionButton = (instance: any) => {
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

  const openInstances = instances.filter(i => i.status === 'open' && !['birthday', 'favorites'].includes(i.source || ''))
  const inProgressInstances = instances.filter(i => i.status === 'in_progress')
  const completedInstances = instances.filter(i => i.status === 'completed')

  const birthdayPrompts = flags['prompts.birthdays'] ? getBirthdayPrompts() : []
  const favoritePrompts = flags['prompts.favorites'] ? getFavoritePrompts() : []

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Browse Prompts</h1>
              <p className="text-muted-foreground mt-1">
                Open ({counts.open}) • Completed ({counts.completed})
              </p>
            </div>
          </div>

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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="open" className="flex items-center gap-2">
                <Circle className="h-4 w-4" />
                Open ({counts.open})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed ({counts.completed})
              </TabsTrigger>
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
          </Tabs>
        </main>
      </div>
    </AuthGate>
  )
}