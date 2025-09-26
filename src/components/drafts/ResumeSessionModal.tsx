import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Mic, Camera, Video, Clock, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { DraftData } from '@/hooks/useDraftManager'

interface ResumeSessionModalProps {
  isOpen: boolean
  onClose: () => void
  drafts: Array<DraftData & { type: 'text' | 'audio' | 'photo' | 'video' }>
  onResume: (draft: DraftData & { type: 'text' | 'audio' | 'photo' | 'video' }) => void
  onDiscard: (draftId: string) => void
  onStartFresh: () => void
}

export function ResumeSessionModal({ 
  isOpen, 
  onClose, 
  drafts, 
  onResume, 
  onDiscard, 
  onStartFresh 
}: ResumeSessionModalProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return FileText
      case 'audio': return Mic
      case 'photo': return Camera
      case 'video': return Video
      default: return FileText
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Text Story'
      case 'audio': return 'Voice Recording'
      case 'photo': return 'Photo Story'
      case 'video': return 'Video Story'
      default: return 'Story'
    }
  }

  const getDraftPreview = (draft: DraftData & { type: string }) => {
    if (draft.content.text) {
      return draft.content.text.substring(0, 100) + (draft.content.text.length > 100 ? '...' : '')
    }
    if (draft.content.media && draft.content.media.length > 0) {
      return `${draft.content.media.length} media item${draft.content.media.length > 1 ? 's' : ''} attached`
    }
    if (draft.content.audio) {
      return 'Voice recording in progress'
    }
    return 'Draft content'
  }

  const getTimeAgo = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Resume last session?
          </DialogTitle>
          <DialogDescription>
            We found some unsaved work from your previous session. Would you like to continue where you left off?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {drafts.map((draft) => {
            const Icon = getTypeIcon(draft.type)
            return (
              <Card key={draft.id} className="border hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm">
                            {getTypeLabel(draft.type)}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {getTimeAgo(draft.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {getDraftPreview(draft)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDiscard(draft.id)}
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => onResume(draft)}
                        size="sm"
                        className="gap-2"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={onStartFresh} className="gap-2">
            Start Fresh
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}