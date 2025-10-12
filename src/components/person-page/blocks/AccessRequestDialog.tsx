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
import { Lock, Send } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface AccessRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personId: string
  personName: string
  familyId: string
}

export function AccessRequestDialog({
  open,
  onOpenChange,
  personId,
  personName,
  familyId
}: AccessRequestDialogProps) {
  const { toast } = useToast()
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please add a message explaining why you'd like access",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create access request
      const { error } = await supabase
        .from('access_requests')
        .insert({
          family_id: familyId,
          requester_id: user.id,
          requested_role: 'viewer',
          message: message.trim(),
          status: 'pending'
        })

      if (error) throw error

      toast({
        title: "Request sent",
        description: `Your access request for ${personName}'s page has been sent to the stewards`
      })

      onOpenChange(false)
      setMessage('')
    } catch (error) {
      console.error('Error submitting access request:', error)
      toast({
        title: "Request failed",
        description: error instanceof Error ? error.message : "Could not submit request",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Request Access
          </DialogTitle>
          <DialogDescription>
            Request permission to view {personName}'s page
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              This page is private. The stewards of {personName}'s page will review your request.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (required)</Label>
            <Textarea
              id="message"
              placeholder="Explain your connection or reason for requesting access..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/500 characters
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !message.trim()}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Send Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
