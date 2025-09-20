import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, ArrowRight, Users, FileText, Image, MessageSquare } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

interface MergeCompletionScreenProps {
  mergeResult: {
    success: boolean
    merge_id: string
    source_family_id: string
    target_family_id: string
    transferred_counts: {
      members_transferred: number
      stories_transferred: number
      media_transferred: number
      comments_transferred: number
      people_transferred: number
    }
    completed_at: string
  }
  onClose: () => void
}

export function MergeCompletionScreen({ mergeResult, onClose }: MergeCompletionScreenProps) {
  useEffect(() => {
    // Celebrate with confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }, [])

  const { transferred_counts } = mergeResult

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg border-green-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">Merge Completed Successfully!</CardTitle>
          <CardDescription>
            The family merge has been completed and all data has been transferred.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Merge Details */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
              <span className="font-mono">{mergeResult.source_family_id.slice(0, 8)}...</span>
              <ArrowRight className="h-4 w-4" />
              <span className="font-mono">{mergeResult.target_family_id.slice(0, 8)}...</span>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Completed at {new Date(mergeResult.completed_at).toLocaleString()}
            </p>
          </div>

          {/* Transfer Summary */}
          <div className="space-y-3">
            <h4 className="font-semibold text-center">Data Transfer Summary</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">{transferred_counts.members_transferred}</p>
                  <p className="text-xs text-blue-700">Members</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-semibold text-purple-900">{transferred_counts.stories_transferred}</p>
                  <p className="text-xs text-purple-700">Stories</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                <Image className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">{transferred_counts.media_transferred}</p>
                  <p className="text-xs text-amber-700">Media</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">{transferred_counts.comments_transferred}</p>
                  <p className="text-xs text-green-700">Comments</p>
                </div>
              </div>
            </div>

            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <p className="font-semibold text-indigo-900">{transferred_counts.people_transferred}</p>
              <p className="text-xs text-indigo-700">Family Tree People</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button onClick={onClose} className="flex-1">
              Continue to Dashboard
            </Button>
          </div>

          {/* Technical Details */}
          <div className="text-xs text-muted-foreground text-center">
            <p>Merge ID: <span className="font-mono">{mergeResult.merge_id}</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}