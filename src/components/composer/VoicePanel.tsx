import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import VoiceRecorderPanel from '@/components/story-create/VoiceRecorderPanel'
import { SaveStatusBadge } from './SaveStatusBadge'
import { useSaveStatus } from '@/hooks/useSaveStatus'
import { useState, useEffect } from 'react'

interface VoicePanelProps {
  title: string
  content: string
  audioBlob: Blob | null
  audioUrl: string | null
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onRecordingReady: (blob: Blob, url: string, transcript?: string) => void
}

export function VoicePanel({
  title,
  content,
  audioBlob,
  audioUrl,
  onTitleChange,
  onContentChange,
  onRecordingReady
}: VoicePanelProps) {
  const saveStatus = useSaveStatus([title, content, audioBlob !== null], 500)
  
  // Auto-transcribe preference
  const [autoTranscribe, setAutoTranscribe] = useState(() => {
    const saved = localStorage.getItem('voice-auto-transcribe')
    return saved === null ? true : saved === 'true'
  })
  
  useEffect(() => {
    localStorage.setItem('voice-auto-transcribe', String(autoTranscribe))
  }, [autoTranscribe])
  
  const handleTranscriptReady = (transcript: string, blob: Blob, url: string) => {
    // Only populate content if auto-transcribe is enabled and transcript exists
    if (autoTranscribe && transcript) {
      onContentChange(transcript)
    }
    onRecordingReady(blob, url, transcript)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Voice Story</h2>
        <SaveStatusBadge status={saveStatus} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium">
            Voice Recording <span className="text-destructive">*</span>
          </label>
          <div className="flex items-center gap-2">
            <Switch
              id="auto-transcribe"
              checked={autoTranscribe}
              onCheckedChange={setAutoTranscribe}
            />
            <Label htmlFor="auto-transcribe" className="text-sm cursor-pointer">
              Auto-transcribe {!autoTranscribe && <span className="text-muted-foreground">(when available)</span>}
            </Label>
          </div>
        </div>
        <VoiceRecorderPanel
          onTranscriptReady={(transcript, blob, duration) => {
            const url = URL.createObjectURL(blob)
            handleTranscriptReady(transcript, blob, url)
          }}
        />
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Title <span className="text-destructive" aria-label="required">*</span>
        </label>
        <Input
          id="title"
          placeholder="Give your story a title..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={200}
          aria-required="true"
          aria-invalid={!title.trim()}
          aria-describedby="voice-title-hint"
        />
        <span id="voice-title-hint" className="sr-only">
          Enter a title for your voice story, up to 200 characters
        </span>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          Story
        </label>
        <Textarea
          id="content"
          placeholder="Add additional notes or edit the transcript..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          rows={10}
          className="resize-none"
          aria-describedby="voice-content-hint"
        />
        <span id="voice-content-hint" className="sr-only">
          Optional additional notes or edited transcript
        </span>
      </div>
    </div>
  )
}
