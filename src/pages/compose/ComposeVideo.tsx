import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/Header'
import { VideoPanel } from '@/components/composer/VideoPanel'
import { PromptBanner } from '@/components/composer/PromptBanner'
import type { ComposerPrefillData } from '@/pages/stories/StoryNew'
import type { ComposerState } from '@/hooks/useComposerState'

interface ComposeVideoProps {
  prefillData?: ComposerPrefillData
  standalone?: boolean
  composerState?: ComposerState
  updateState?: (updates: Partial<ComposerState>) => void
}

export default function ComposeVideo({ 
  prefillData, 
  standalone = true,
  composerState,
  updateState
}: ComposeVideoProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showPromptBanner, setShowPromptBanner] = useState(true)
  
  // Get prompt info from URL
  const promptTitle = searchParams.get('promptTitle') || ''
  const promptId = searchParams.get('prompt_id') || prefillData?.promptId || ''
  const promptText = searchParams.get('prompt_text') || ''

  // Use composerState or local state
  const [localTitle, setLocalTitle] = useState(promptTitle)
  const [localContent, setLocalContent] = useState('')
  const [localVideoBlob, setLocalVideoBlob] = useState<Blob | null>(null)
  const [localVideoUrl, setLocalVideoUrl] = useState<string | null>(null)
  const [localThumbnailUrl, setLocalThumbnailUrl] = useState<string | null>(null)

  const handleVideoReady = (blob: Blob, url: string, thumbnail: string) => {
    if (updateState) {
      updateState({ videoBlob: blob })
    } else {
      setLocalVideoBlob(blob)
      setLocalVideoUrl(url)
      setLocalThumbnailUrl(thumbnail)
    }
  }

  const content_ui = (
    <div className="space-y-4">
      {promptTitle && showPromptBanner && (
        <PromptBanner
          promptTitle={promptTitle}
          onDismiss={() => setShowPromptBanner(false)}
        />
      )}
      
      <VideoPanel
        title={composerState?.title || localTitle}
        content={composerState?.content || localContent}
        videoBlob={composerState?.videoBlob || localVideoBlob}
        videoUrl={composerState?.videoBlob ? URL.createObjectURL(composerState.videoBlob) : localVideoUrl}
        thumbnailUrl={localThumbnailUrl}
        onTitleChange={(value) => {
          if (updateState) {
            updateState({ title: value })
          } else {
            setLocalTitle(value)
          }
        }}
        onContentChange={(value) => {
          if (updateState) {
            updateState({ content: value })
          } else {
            setLocalContent(value)
          }
        }}
        onVideoReady={handleVideoReady}
        autoStart={!!promptTitle}
      />
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
          <h1 className="text-3xl font-bold mb-2">Record Video</h1>
          <p className="text-muted-foreground">
            Capture a short video memory or moment
          </p>
        </div>
        {content_ui}
      </main>
    </div>
  )
}
