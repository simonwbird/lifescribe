import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Plus, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Header from '@/components/Header'
import type { ComposerPrefillData } from '@/pages/stories/StoryNew'
import type { ComposerState } from '@/hooks/useComposerState'

interface ComposeMixedProps {
  prefillData?: ComposerPrefillData
  standalone?: boolean
  composerState?: ComposerState
  updateState?: (updates: Partial<ComposerState>) => void
}

export default function ComposeMixed({ 
  prefillData, 
  standalone = true,
  composerState,
  updateState
}: ComposeMixedProps) {
  const navigate = useNavigate()
  const [localTitle, setLocalTitle] = useState('')
  const [localContent, setLocalContent] = useState('')

  // Use shared state if provided, otherwise use local state
  const title = composerState?.title ?? localTitle
  const content = composerState?.content ?? localContent
  const photos = composerState?.photos ?? []
  const hasAudio = composerState?.audioBlob !== null
  const hasVideo = composerState?.videoBlob !== null

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

  const content_ui = (
    <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Story Details</CardTitle>
              <CardDescription>
                Add a title and description for your story
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
                <Label htmlFor="content">Story Text</Label>
                <Textarea
                  id="content"
                  placeholder="Write your story..."
                  className="min-h-[200px]"
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>
                Add photos and videos to accompany your story
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                {photos.length === 0 && !hasAudio && !hasVideo ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      No media added yet
                    </p>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Photos or Videos
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    {photos.length > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">
                          {photos.length} photo{photos.length !== 1 ? 's' : ''} added
                        </span>
                      </div>
                    )}
                    {hasAudio && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <span className="text-sm">Audio recording added</span>
                      </div>
                    )}
                    {hasVideo && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <span className="text-sm">Video added</span>
                      </div>
                    )}
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add More Media
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button onClick={() => {}}>
              <Save className="h-4 w-4 mr-2" />
              Publish Story
            </Button>
          </div>
        </div>
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
          <h1 className="text-3xl font-bold mb-2">Mixed Content Story</h1>
          <p className="text-muted-foreground">
            Combine text, photos, and videos in one story
          </p>
        </div>
        {content_ui}
      </main>
    </div>
  )
}
