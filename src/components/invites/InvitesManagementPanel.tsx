import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog' 
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Mail, 
  Clock, 
  Check, 
  X, 
  RefreshCw, 
  Trash2, 
  Shield, 
  Eye, 
  Edit,
  UserX,
  Send,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatForUser, getCurrentUserRegion } from '@/utils/date'

interface Invite {
  id: string
  email: string
  role: string
  status: string
  sent_at: string
  expires_at: string
  accepted_at?: string
  revoked_at?: string
  revoke_reason?: string
  profiles?: {
    full_name: string
    avatar_url?: string
  }
}

interface Member {
  id: string
  role: string
  joined_at: string
  profiles: {
    id: string
    full_name: string
    avatar_url?: string
    email?: string
  }
}

interface InvitesManagementPanelProps {
  familyId: string
  familyName: string
  onInviteRevoked?: () => void
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'admin': return <Shield className="h-4 w-4" />
    case 'contributor': return <Edit className="h-4 w-4" />
    case 'member': return <Edit className="h-4 w-4" />
    case 'viewer': return <Eye className="h-4 w-4" />
    case 'guest': return <Eye className="h-4 w-4" />
    default: return <Eye className="h-4 w-4" />
  }
}

const getRoleColor = (role: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (role) {
    case 'admin': return 'default'
    case 'contributor': return 'secondary'
    case 'member': return 'secondary'
    case 'viewer': return 'outline'
    case 'guest': return 'outline'
    default: return 'outline'
  }
}

const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'pending': return 'outline'
    case 'accepted': return 'default'
    case 'expired': return 'secondary'
    case 'revoked': return 'destructive'
    default: return 'outline'
  }
}

export default function InvitesManagementPanel({ familyId, familyName, onInviteRevoked }: InvitesManagementPanelProps) {
  const [invites, setInvites] = useState<Invite[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [revokeLoading, setRevokeLoading] = useState(false)
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current user's role
      const { data: currentMember } = await supabase
        .from('members')
        .select('role')
        .eq('family_id', familyId)
        .eq('profile_id', user.id)
        .single()

      if (!currentMember) return
      setCurrentUserRole(currentMember.role)

      // Load invites
      const { data: invitesData } = await supabase
        .from('invites')
        .select(`
          *,
          profiles:invited_by(full_name, avatar_url)
        `)
        .eq('family_id', familyId)
        .order('sent_at', { ascending: false })

      if (invitesData) {
        setInvites(invitesData)
      }

      // Load current members
      const { data: membersData } = await supabase
        .from('members')
        .select(`
          *,
          profiles(id, full_name, avatar_url, email)
        `)
        .eq('family_id', familyId)
        .order('joined_at')

      if (membersData) {
        setMembers(membersData)
      }

    } catch (error) {
      console.error('Error loading invites:', error)
      toast({
        title: "Error",
        description: "Failed to load invites data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [familyId, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleResendInvite = async (inviteId: string) => {
    try {
      const { data, error } = await supabase.rpc('resend_invite', {
        p_invite_id: inviteId
      })

      if (error) throw error

      if ((data as any).success) {
        toast({
          title: "Invite resent",
          description: (data as any).message
        })
        loadData() // Refresh data
      } else {
        throw new Error((data as any).error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend invite",
        variant: "destructive"
      })
    }
  }

  const handleRevokeInvite = async () => {
    if (!selectedInvite) return
    
    setRevokeLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.rpc('revoke_invite', {
        p_invite_id: selectedInvite.id,
        p_revoked_by: user.id,
        p_reason: revokeReason.trim() || null
      })

      if (error) throw error

      if ((data as any).success) {
        toast({
          title: "Invite revoked",
          description: (data as any).message
        })
        setRevokeDialogOpen(false)
        setSelectedInvite(null)
        setRevokeReason('')
        onInviteRevoked?.()
        loadData() // Refresh data
      } else {
        throw new Error((data as any).error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke invite",
        variant: "destructive"
      })
    } finally {
      setRevokeLoading(false)
    }
  }

  const isInviteExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const canManageInvites = currentUserRole === 'admin'
  const pendingInvites = invites.filter(i => i.status === 'pending' && !isInviteExpired(i.expires_at))
  const expiredInvites = invites.filter(i => i.status === 'pending' && isInviteExpired(i.expires_at))
  const completedInvites = invites.filter(i => ['accepted', 'revoked'].includes(i.status))

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current Members ({members.length})
          </CardTitle>
          <CardDescription>
            Active family members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profiles.avatar_url || ''} />
                    <AvatarFallback>
                      {member.profiles.full_name?.charAt(0) || 'M'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.profiles.full_name || 'Family Member'}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {formatForUser(member.joined_at, 'dateOnly', getCurrentUserRegion())}
                    </p>
                  </div>
                </div>
                <Badge variant={getRoleColor(member.role)} className="flex items-center gap-1">
                  {getRoleIcon(member.role)}
                  {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Invites ({pendingInvites.length})
            </CardTitle>
            <CardDescription>
              Invitations waiting for response
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border border-dashed">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited {formatForUser(invite.sent_at, 'relative', getCurrentUserRegion())} • 
                        Expires {formatForUser(invite.expires_at, 'relative', getCurrentUserRegion())}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleColor(invite.role)} className="flex items-center gap-1">
                      {getRoleIcon(invite.role)}
                      {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                    </Badge>
                    {canManageInvites && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResendInvite(invite.id)}
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedInvite(invite)
                            setRevokeDialogOpen(true)
                          }}
                        >
                          <UserX className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expired Invites */}
      {expiredInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Expired Invites ({expiredInvites.length})
            </CardTitle>
            <CardDescription>
              Invitations that have expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiredInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-muted-foreground">{invite.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Expired {formatForUser(invite.expires_at, 'relative', getCurrentUserRegion())}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Expired</Badge>
                    {canManageInvites && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResendInvite(invite.id)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Resend
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Invites */}
      {completedInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Invite History ({completedInvites.length})</CardTitle>
            <CardDescription>
              Previously sent invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {invite.status === 'accepted' ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {invite.status === 'accepted' && invite.accepted_at
                          ? `Accepted ${formatForUser(invite.accepted_at, 'relative', getCurrentUserRegion())}`
                          : invite.status === 'revoked' && invite.revoked_at
                          ? `Revoked ${formatForUser(invite.revoked_at, 'relative', getCurrentUserRegion())}`
                          : `${invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}`
                        }
                      </p>
                      {invite.revoke_reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Reason: {invite.revoke_reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={getStatusColor(invite.status)}>
                    {invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No invites state */}
      {invites.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No invites yet</h3>
            <p className="text-muted-foreground">
              Send your first invitation to grow your family on {familyName}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Revoke Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Invitation</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke the invitation for {selectedInvite?.email}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="revoke-reason">Reason (optional)</Label>
              <Textarea
                id="revoke-reason"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Why are you revoking this invitation?"
                rows={3}
              />
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleRevokeInvite}
                disabled={revokeLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {revokeLoading ? 'Revoking...' : 'Revoke Invite'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRevokeDialogOpen(false)
                  setSelectedInvite(null)
                  setRevokeReason('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}