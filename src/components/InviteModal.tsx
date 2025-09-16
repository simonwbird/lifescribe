import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface InviteModalProps {
  familyId: string
  onClose: () => void
  onInviteSent: () => void
}

export default function InviteModal({ familyId, onClose, onInviteSent }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'guest'>('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const generateInviteToken = () => {
    return crypto.randomUUID()
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('members')
        .select('*')
        .eq('family_id', familyId)
        .eq('profile_id', user.id)
        .single()

      if (existingMember) {
        setError('This person is already a member of the family')
        return
      }

      // Check if there's already a pending invite
      const { data: existingInvite } = await supabase
        .from('invites')
        .select('*')
        .eq('family_id', familyId)
        .eq('email', email.trim())
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (existingInvite) {
        setError('There is already a pending invitation for this email')
        return
      }

      const token = generateInviteToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

      // Create invite
      const { error: inviteError } = await supabase
        .from('invites')
        .insert({
          family_id: familyId,
          email: email.trim(),
          role,
          token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
        })

      if (inviteError) throw inviteError

      setSuccess(true)
      setTimeout(() => {
        onInviteSent()
      }, 2000)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitation Sent!</DialogTitle>
            <DialogDescription>
              An invitation has been sent to {email}. They will receive instructions on how to join your family.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={onClose}>Close</Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Family Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your family on LifeScribe
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
              placeholder="Enter email address..."
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

          <div className="flex space-x-4">
            <Button type="submit" disabled={loading || !email.trim()}>
              {loading ? 'Sending...' : 'Send Invitation'}
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