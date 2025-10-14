import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Mic, Square, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Header from '@/components/Header'
import type { ComposerPrefillData } from '@/pages/stories/StoryNew'
import type { ComposerState } from '@/hooks/useComposerState'

interface ComposeVoiceProps {
  prefillData?: ComposerPrefillData
  standalone?: boolean
  composerState?: ComposerState
  updateState?: (updates: Partial<ComposerState>) => void
}

export default function ComposeVoice({ 
  prefillData, 
  standalone = true,
  composerState,
  updateState
}: ComposeVoiceProps) {
  const navigate = useNavigate()
  const [isRecording, setIsRecording] = useState(false)
  
  const hasAudio = composerState?.audioBlob !== null

  const content_ui = (
    <Card>
          <CardHeader>
            <CardTitle>Voice Recording</CardTitle>
            <CardDescription>
              Press the microphone button to start recording your story
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Button
                size="lg"
                variant={isRecording ? 'destructive' : 'default'}
                className="h-24 w-24 rounded-full"
                onClick={() => setIsRecording(!isRecording)}
              >
                {isRecording ? (
                  <Square className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </Button>
              <p className="text-sm text-muted-foreground">
                {isRecording ? 'Recording... Click to stop' : hasAudio ? 'Audio recorded! Click to re-record' : 'Click to start recording'}
              </p>
            </div>

            <div className="border-t pt-4">
              <Button variant="outline" className="w-full" onClick={() => {}}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Audio File
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
          <h1 className="text-3xl font-bold mb-2">Record Voice Story</h1>
          <p className="text-muted-foreground">
            Share your story through audio recording
          </p>
        </div>
        {content_ui}
      </main>
    </div>
  )
}
