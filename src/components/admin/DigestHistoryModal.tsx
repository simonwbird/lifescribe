import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Send, Clock, Users } from 'lucide-react'
import { DigestSendLog } from '@/lib/digestTypes'

interface DigestHistoryModalProps {
  history: DigestSendLog[]
  isOpen: boolean
  onClose: () => void
  familyName: string
}

export const DigestHistoryModal = ({ history, isOpen, onClose, familyName }: DigestHistoryModalProps) => {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatWeek = (dateString: string) => {
    const date = new Date(dateString)
    const endDate = new Date(date)
    endDate.setDate(date.getDate() + 6)
    
    return `${date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })} - ${endDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })}`
  }

  const getSendTypeBadge = (sendType: string) => {
    switch (sendType) {
      case 'forced':
        return <Badge variant="destructive">Force Sent</Badge>
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>
      default:
        return <Badge variant="outline">{sendType}</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Digest History - {familyName}
          </DialogTitle>
          <DialogDescription>
            Recent weekly digest sends for this family
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">No digest history</h3>
                  <p className="text-sm text-muted-foreground">
                    This family hasn't received any weekly digests yet.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            history.map((entry, index) => (
              <Card key={entry.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      Week of {formatWeek(entry.digest_week)}
                    </CardTitle>
                    {getSendTypeBadge(entry.send_type)}
                  </div>
                  <CardDescription className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(entry.sent_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {entry.recipient_count} recipients
                    </span>
                  </CardDescription>
                </CardHeader>
                
                {entry.content_summary && Object.keys(entry.content_summary).length > 0 && (
                  <CardContent className="pt-0">
                    <div className="text-sm space-y-1">
                      <div className="font-medium">Content Summary:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(entry.content_summary).map(([key, value]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key}:</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}

                {index === 0 && (
                  <div className="absolute -left-1 top-4 w-2 h-2 bg-primary rounded-full"></div>
                )}
              </Card>
            ))
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Showing last 10 digest sends • Older entries are automatically archived
        </div>
      </DialogContent>
    </Dialog>
  )
}