import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { History, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface TranscriptEditorProps {
  transcript: string
  onTranscriptChange: (transcript: string) => void
  recordingId: string
}

export function TranscriptEditor({
  transcript,
  onTranscriptChange,
  recordingId
}: TranscriptEditorProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedTranscript, setEditedTranscript] = useState(transcript)
  const [versionCount, setVersionCount] = useState(1)

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // Save current version to history
      const historyEntry = {
        version: versionCount,
        transcript: transcript,
        timestamp: new Date().toISOString()
      }

      // Get current draft data
      const { data: currentData } = await supabase
        .from('audio_recordings')
        .select('draft_data')
        .eq('id', recordingId)
        .single()

      const draftData = (currentData?.draft_data as any) || {}
      const history = Array.isArray(draftData.transcript_history) 
        ? draftData.transcript_history 
        : []
      history.push(historyEntry)

      // Update with new transcript
      const { error } = await supabase
        .from('audio_recordings')
        .update({
          transcript: editedTranscript,
          draft_data: {
            ...draftData,
            transcript_history: history
          } as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordingId)

      if (error) throw error

      onTranscriptChange(editedTranscript)
      setVersionCount(versionCount + 1)
      setIsEditing(false)

      toast({
        title: "Transcript saved",
        description: "Your changes have been saved"
      })
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: "Save failed",
        description: "Could not save transcript. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedTranscript(transcript)
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Transcript</label>
            {versionCount > 1 && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <History className="h-3 w-3" />
                v{versionCount}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </Button>
        </div>
        <div className="bg-muted rounded-lg p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {transcript}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Edit Transcript</label>
        <Badge variant="outline" className="text-xs">
          Editing
        </Badge>
      </div>
      
      <Textarea
        value={editedTranscript}
        onChange={(e) => setEditedTranscript(e.target.value)}
        placeholder="Edit the transcript..."
        className="min-h-[120px] font-sans"
      />

      <div className="flex gap-2 justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || editedTranscript === transcript}
          className="gap-2"
        >
          <Save className="h-3 w-3" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Changes will be saved to version history
      </p>
    </div>
  )
}
