import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import VoiceRecorderPanel from '@/components/story-create/VoiceRecorderPanel'
import { SaveStatusBadge } from './SaveStatusBadge'
import { useSaveStatus } from '@/hooks/useSaveStatus'

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Voice Story</h2>
        <SaveStatusBadge status={saveStatus} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Voice Recording <span className="text-destructive">*</span>
        </label>
        <VoiceRecorderPanel
          onTranscriptReady={(transcript, blob, duration) => {
            const url = URL.createObjectURL(blob)
            onRecordingReady(blob, url, transcript)
          }}
        />
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Title <span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          placeholder="Give your story a title..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={200}
        />
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
        />
      </div>
    </div>
  )
}
