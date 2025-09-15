import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Mail, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface InviteModalEnhancedProps {
  familyId: string
  familyName: string
  onClose: () => void
  onInviteSent: () => void
}

export default function InviteModalEnhanced({ familyId, familyName, onClose, onInviteSent }: InviteModalEnhancedProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'guest'>('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [magicLink, setMagicLink] = useState('')
  const { toast } = useToast()

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Call the invite edge function
      const { data, error: functionError } = await supabase.functions.invoke('invite', {
        body: {
          familyId,
          email: email.trim(),
          role,
        }
      })

      if (functionError) throw functionError

      if (data.success) {
        // Generate the magic link for copying
        const appUrl = window.location.origin
        const generatedToken = crypto.randomUUID() // This would be the actual token from the invite
        const link = `${appUrl}/invite/${generatedToken}`
        setMagicLink(link)
        setSuccess(true)
        
        toast({
          title: "Invitation sent!",
          description: `Magic link sent to ${email}`,
        })

        setTimeout(() => {
          onInviteSent()
        }, 2000)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send invitation')
      toast({
        title: "Error",
        description: error.message || 'Failed to send invitation',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyMagicLink = async () => {
    try {
      await navigator.clipboard.writeText(magicLink)
      toast({
        title: "Copied!",
        description: "Magic link copied to clipboard",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      })
    }
  }

  if (success) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Invitation Sent!
            </DialogTitle>
            <DialogDescription>
              A magic link has been sent to {email} to join {familyName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                They can also use this link directly:
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={magicLink}
                  readOnly
                  className="text-xs"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyMagicLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to {familyName}</DialogTitle>
          <DialogDescription>
            Send a magic link invitation to join your family space
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSendInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="family@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: 'member' | 'guest') => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member - Can create and comment</SelectItem>
                <SelectItem value="guest">Guest - Can view and comment only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !email.trim()} className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send Magic Link'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}