import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Copy, RefreshCw, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Person } from '@/lib/familyTreeTypes'

interface InvitePersonModalProps {
  person: Person
  familyId: string
  onClose: () => void
  onSuccess: () => void
}

interface Invite {
  id: string
  email: string
  role: string
  status: string
  token: string
  created_at: string
  expires_at: string
  accepted_at?: string
  invited_by: string
  family_id: string
}

export default function InvitePersonModal({ person, familyId, onClose, onSuccess }: InvitePersonModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'guest'>('member')
  const [existingInvites, setExistingInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(false)
  const [sendingInvite, setSendingInvite] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchExistingInvites()
  }, [])

  const fetchExistingInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExistingInvites(data || [])
    } catch (error) {
      console.error('Error fetching invites:', error)
    }
  }

  const generateInviteToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive"
      })
      return
    }

    setSendingInvite(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      // Check if email is already invited
      const existingInvite = existingInvites.find(inv => 
        inv.email.toLowerCase() === email.toLowerCase().trim() && 
        inv.status === 'pending'
      )

      if (existingInvite) {
        toast({
          title: "Error",
          description: "This email already has a pending invitation",
          variant: "destructive"
        })
        return
      }

      const token = generateInviteToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

      // Create the invitation
      const { error } = await supabase
        .from('invites')
        .insert([{
          family_id: familyId,
          email: email.toLowerCase().trim(),
          role: role,
          token: token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        }])

      if (error) throw error

      // TODO: Send actual email via edge function
      const inviteLink = `${window.location.origin}/invite/${token}`
      
      toast({
        title: "Success",
        description: "Invitation sent successfully!"
      })

      // Copy invite link to clipboard
      navigator.clipboard.writeText(inviteLink)
      
      setEmail('')
      fetchExistingInvites()
      onSuccess()
    } catch (error) {
      console.error('Error sending invite:', error)
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      })
    } finally {
      setSendingInvite(false)
    }
  }

  const handleCopyInviteLink = (token: string) => {
    const inviteLink = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(inviteLink)
    toast({
      title: "Success", 
      description: "Invite link copied to clipboard"
    })
  }

  const handleResendInvite = async (inviteId: string) => {
    try {
      const newToken = generateInviteToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error } = await supabase
        .from('invites')
        .update({
          token: newToken,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        })
        .eq('id', inviteId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Invitation refreshed and link copied to clipboard"
      })

      handleCopyInviteLink(newToken)
      fetchExistingInvites()
    } catch (error) {
      console.error('Error resending invite:', error)
      toast({
        title: "Error", 
        description: "Failed to resend invitation",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      case 'accepted':
        return <Badge variant="default">Accepted</Badge>
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite {person.full_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Send New Invite */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Send Invitation
              </CardTitle>
              <CardDescription>
                Invite {person.full_name} to join your family space
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={(value: 'member' | 'guest') => setRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={sendingInvite} className="w-full">
                  {sendingInvite ? 'Sending...' : 'Send Invitation'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Invites */}
          {existingInvites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Existing Invitations</CardTitle>
                <CardDescription>
                  Previously sent invitations for this family
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {existingInvites.slice(0, 5).map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{invite.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {invite.role} • Sent {new Date(invite.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(invite.status)}
                        
                        {invite.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopyInviteLink(invite.token)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvite(invite.id)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
