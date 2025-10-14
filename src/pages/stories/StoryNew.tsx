import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import Header from '@/components/Header'
import ComposeText from '@/pages/compose/ComposeText'
import ComposePhotos from '@/pages/compose/ComposePhotos'
import ComposeVoice from '@/pages/compose/ComposeVoice'
import ComposeVideo from '@/pages/compose/ComposeVideo'
import ComposeMixed from '@/pages/compose/ComposeMixed'
import { supabase } from '@/integrations/supabase/client'

type ComposerTab = 'text' | 'photo' | 'voice' | 'video' | 'mixed'

export interface ComposerPrefillData {
  promptId?: string
  personId?: string
  children?: string[] // comma-separated in URL, parsed to array
  circle?: string
  album?: string
  source?: string
}

export default function StoryNew() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const tabParam = (searchParams.get('tab') || 'text') as ComposerTab
  const [activeTab, setActiveTab] = useState<ComposerTab>(tabParam)

  // Parse prefill params
  const prefillData: ComposerPrefillData = {
    promptId: searchParams.get('promptId') || undefined,
    personId: searchParams.get('personId') || undefined,
    children: searchParams.get('children')?.split(',') || undefined,
    circle: searchParams.get('circle') || undefined,
    album: searchParams.get('album') || undefined,
    source: searchParams.get('source') || undefined,
  }

  // Load prompt data if promptId is present
  const [promptTitle, setPromptTitle] = useState<string>('')
  
  useEffect(() => {
    if (prefillData.promptId && prefillData.promptId !== 'today') {
      loadPrompt(prefillData.promptId)
    } else if (prefillData.promptId === 'today') {
      setPromptTitle("Today's Prompt")
    }
  }, [prefillData.promptId])

  async function loadPrompt(promptId: string) {
    const { data } = await supabase
      .from('prompt_instances')
      .select('id, prompts(title)')
      .eq('id', promptId)
      .single()
    
    if (data && data.prompts) {
      setPromptTitle((data.prompts as any).title)
    }
  }

  // Sync activeTab with URL param
  useEffect(() => {
    const urlTab = searchParams.get('tab') as ComposerTab
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab)
    }
  }, [searchParams, activeTab])

  const handleTabChange = (value: string) => {
    const newTab = value as ComposerTab
    setActiveTab(newTab)
    
    // Update URL without triggering navigation
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', newTab)
    setSearchParams(newParams, { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Create Story</h1>
            {promptTitle && (
              <Badge variant="secondary" className="text-sm">
                {promptTitle}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Choose how you'd like to capture your story
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="photo">Photo</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="video">Video</TabsTrigger>
            <TabsTrigger value="mixed">Mixed</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-0">
            <ComposeText prefillData={prefillData} />
          </TabsContent>

          <TabsContent value="photo" className="mt-0">
            <ComposePhotos prefillData={prefillData} />
          </TabsContent>

          <TabsContent value="voice" className="mt-0">
            <ComposeVoice prefillData={prefillData} />
          </TabsContent>

          <TabsContent value="video" className="mt-0">
            <ComposeVideo prefillData={prefillData} />
          </TabsContent>

          <TabsContent value="mixed" className="mt-0">
            <ComposeMixed prefillData={prefillData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
