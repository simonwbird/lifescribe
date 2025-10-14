import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Header from '@/components/Header'
import type { ComposerPrefillData } from '@/pages/stories/StoryNew'
import type { ComposerState } from '@/hooks/useComposerState'

interface ComposeTextProps {
  prefillData?: ComposerPrefillData
  standalone?: boolean
  composerState?: ComposerState
  updateState?: (updates: Partial<ComposerState>) => void
}

export default function ComposeText({ 
  prefillData, 
  standalone = true,
  composerState,
  updateState
}: ComposeTextProps) {
  const navigate = useNavigate()
  const [localTitle, setLocalTitle] = useState('')
  const [localContent, setLocalContent] = useState('')

  // Use shared state if provided, otherwise use local state
  const title = composerState?.title ?? localTitle
  const content = composerState?.content ?? localContent

  const handleTitleChange = (value: string) => {
    if (updateState) {
      updateState({ title: value })
    } else {
      setLocalTitle(value)
    }
  }

  const handleContentChange = (value: string) => {
    if (updateState) {
      updateState({ content: value })
    } else {
      setLocalContent(value)
    }
  }

  // Apply prefill data
  useEffect(() => {
    if (prefillData?.promptId) {
      // TODO: Load prompt from API/database
      console.log('Loading prompt:', prefillData.promptId)
    }
  }, [prefillData])

  const content_ui = (
    <Card>
          <CardHeader>
            <CardTitle>Your Story</CardTitle>
            <CardDescription>
              Write your story, memory, or reflection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Give your story a title..."
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Story</Label>
              <Textarea
                id="content"
                placeholder="Start writing your story..."
                className="min-h-[400px]"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button onClick={() => {}}>
                <Save className="h-4 w-4 mr-2" />
                Save Story
              </Button>
            </div>
          </CardContent>
        </Card>
  )

  if (!standalone) {
    return content_ui
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
          <h1 className="text-3xl font-bold mb-2">Write a Story</h1>
          <p className="text-muted-foreground">
            Share your memories and experiences in writing
          </p>
        </div>
        {content_ui}
      </main>
    </div>
  )
}
