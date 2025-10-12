import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Copy, Mail } from 'lucide-react'

interface Anniversary {
  type: 'birthday' | 'memorial'
  date: Date
  nextOccurrence: Date
  daysUntil: number
  yearsAgo?: number
}

interface ShareAnniversaryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  anniversary: Anniversary | null
  personName: string
}

export function ShareAnniversaryModal({
  open,
  onOpenChange,
  anniversary,
  personName
}: ShareAnniversaryModalProps) {
  const { toast } = useToast()
  const [customMessage, setCustomMessage] = useState('')

  if (!anniversary) return null

  const dateStr = anniversary.nextOccurrence.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  const defaultMessage = anniversary.type === 'birthday'
    ? `${personName}'s birthday is coming up on ${dateStr}. Let's share some memories to celebrate! 🎂`
    : `${personName}'s memorial is on ${dateStr}${anniversary.yearsAgo ? ` (${anniversary.yearsAgo} years)` : ''}. Let's honor their memory by sharing our favorite stories. 💙`

  const messageToShare = customMessage || defaultMessage

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageToShare)
    toast({
      title: "Message copied",
      description: "Share this with your family members"
    })
  }

  const handleEmailShare = () => {
    const subject = anniversary.type === 'birthday' 
      ? `${personName}'s Birthday Coming Up`
      : `${personName}'s Memorial`
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageToShare)}`
    window.location.href = mailtoLink
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Invite Family to Share
          </DialogTitle>
          <DialogDescription>
            Send this message to invite family members to contribute memories
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea
              placeholder={defaultMessage}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            {!customMessage && (
              <p className="text-xs text-muted-foreground">
                Default message will be used
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleCopyMessage}
            >
              <Copy className="h-4 w-4" />
              Copy Message
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleEmailShare}
            >
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
