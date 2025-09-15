import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, Copy, RefreshCw, Settings, UserX } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Person } from '@/lib/familyTreeTypes'

interface InviteManageModalProps {
  person: Person
  familyId: string
  currentStatus: 'living_not_on_app' | 'living_invited' | 'living_joined' | 'deceased'
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
}

interface Member {
  id: string
  role: string
  profile_id: string
}

export default function InviteManageModal({ 
  person, 
  familyId, 
  currentStatus, 
  onClose, 
  onSuccess 
}: InviteManageModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'guest'>('member')
  const [existingInvites, setExistingInvites] = useState<Invite[]>([])
  const [memberInfo, setMemberInfo] = useState<Member | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch existing invites
      const { data: invites } = await supabase
        .from('invites')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (invites) {
        setExistingInvites(invites)
      }

      // If person is joined, fetch member info
      if (currentStatus === 'living_joined') {
        const { data: linkData } = await supabase
          .from('person_user_links')
          .select('user_id')
          .eq('person_id', person.id)
          .single()

        if (linkData) {
          const { data: memberData } = await supabase
            .from('members')
            .select('*')
            .eq('profile_id', linkData.user_id)
            .eq('family_id', familyId)
            .single()

          if (memberData) {
            setMemberInfo(memberData)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
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

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const token = generateInviteToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

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

      const inviteLink = `${window.location.origin}/invite/${token}`
      navigator.clipboard.writeText(inviteLink)
      
      toast({
        title: "Success",
        description: "Invitation sent and link copied to clipboard!"
      })

      setEmail('')
      fetchData()
      onSuccess()
    } catch (error) {
      console.error('Error sending invite:', error)
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
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

      handleCopyInviteLink(newToken)
      fetchData()
    } catch (error) {
      console.error('Error resending invite:', error)
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive"
      })
    }
  }

  const handleChangeRole = async (newRole: string) => {
    if (!memberInfo) return

    try {
      const { error } = await supabase
        .from('members')
        .update({ role: newRole as 'admin' | 'member' | 'guest' })
        .eq('id', memberInfo.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Role updated successfully"
      })

      fetchData()
      onSuccess()
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive"
      })
    }
  }

  const handleRevokeAccess = async () => {
    if (!memberInfo) return

    try {
      // Remove from members table but keep person record
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberInfo.id)

      if (error) throw error

      // Remove person-user link
      const { error: linkError } = await supabase
        .from('person_user_links')
        .delete()
        .eq('person_id', person.id)

      if (linkError) throw linkError

      toast({
        title: "Success",
        description: "Access revoked successfully"
      })

      onSuccess()
    } catch (error) {
      console.error('Error revoking access:', error)
      toast({
        title: "Error",
        description: "Failed to revoke access",
        variant: "destructive"
      })
    }
  }

  const getTitle = () => {
    switch (currentStatus) {
      case 'living_not_on_app':
        return `Invite ${person.full_name}`
      case 'living_invited':
        return `Manage Invite for ${person.full_name}`
      case 'living_joined':
        return `Manage Access for ${person.full_name}`
      default:
        return `Manage ${person.full_name}`
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2 space-y-6">
          {/* Send New Invite - for not on app status */}
          {currentStatus === 'living_not_on_app' && (
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

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Manage Existing Invite - for invited status */}
          {currentStatus === 'living_invited' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Pending Invitation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {existingInvites
                  .filter(inv => inv.status === 'pending')
                  .slice(0, 1)
                  .map((invite) => (
                    <div key={invite.id} className="space-y-4">
                      <div>
                        <div className="font-medium">{invite.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {invite.role} • Sent {new Date(invite.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInvite(invite.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Resend
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyInviteLink(invite.token)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  ))
                }
              </CardContent>
            </Card>
          )}

          {/* Manage Member Access - for joined status */}
          {currentStatus === 'living_joined' && memberInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Member Access
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Current Role</Label>
                  <Select value={memberInfo.role as string} onValueChange={handleChangeRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="destructive"
                  onClick={handleRevokeAccess}
                  className="w-full"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Revoke Access
                </Button>
                <p className="text-sm text-muted-foreground">
                  This will remove their access but keep the person record in your family tree.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
