import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Clock, FileText, X } from 'lucide-react'
import { DraftData } from '@/hooks/useDraftManager'
import { format } from 'date-fns'

interface DraftRecoveryProps {
  draft: DraftData
  onRecover: (draft: DraftData) => void
  onDiscard: () => void
  onCancel: () => void
}

export function DraftRecovery({ draft, onRecover, onDiscard, onCancel }: DraftRecoveryProps) {
  const [isRecovering, setIsRecovering] = useState(false)
  const [isDiscarding, setIsDiscarding] = useState(false)

  const handleRecover = async () => {
    setIsRecovering(true)
    try {
      await onRecover(draft)
    } finally {
      setIsRecovering(false)
    }
  }

  const handleDiscard = async () => {
    setIsDiscarding(true)
    try {
      await onDiscard()
    } finally {
      setIsDiscarding(false)
    }
  }

  const draftAge = Date.now() - draft.timestamp
  const isRecent = draftAge < 60 * 60 * 1000 // Less than 1 hour

  return (
    <Card className="w-full border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-orange-100">
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg text-orange-900">
              Draft Found
            </CardTitle>
            <p className="text-sm text-orange-700 mt-1">
              You have an unsaved story from {format(new Date(draft.timestamp), 'MMM d, h:mm a')}
              {isRecent && <span className="font-medium"> (recent)</span>}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Draft Preview */}
          <div className="p-3 bg-white rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Draft Preview</span>
            </div>
            <div className="text-sm text-gray-700">
              {draft.content.text && (
                <p className="line-clamp-3">{draft.content.text}</p>
              )}
              {draft.content.audio && (
                <p className="text-orange-600 font-medium">Audio recording available</p>
              )}
              {draft.content.media && draft.content.media.length > 0 && (
                <p className="text-orange-600 font-medium">
                  {draft.content.media.length} media file{draft.content.media.length > 1 ? 's' : ''} attached
                </p>
              )}
              {!draft.content.text && !draft.content.audio && (!draft.content.media || draft.content.media.length === 0) && (
                <p className="text-gray-500 italic">Draft in progress...</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleRecover}
              disabled={isRecovering || isDiscarding}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isRecovering ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Recovering...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Continue Draft
                </>
              )}
            </Button>
            
            <Button
              onClick={handleDiscard}
              variant="outline"
              disabled={isRecovering || isDiscarding}
              className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              {isDiscarding ? (
                <>
                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mr-2" />
                  Discarding...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Start Fresh
                </>
              )}
            </Button>
          </div>

          {/* Warning for old drafts */}
          {!isRecent && (
            <div className="flex items-start gap-2 p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-orange-700">
                This draft is from {format(new Date(draft.timestamp), 'MMM d, yyyy')}. 
                Some content may be outdated.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}