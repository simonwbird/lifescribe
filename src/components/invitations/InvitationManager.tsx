import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal, 
  Copy, 
  Trash2, 
  Shield, 
  Users, 
  Eye,
  RefreshCw
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Invitation {
  id: string
  email: string
  role: 'admin' | 'contributor' | 'member' | 'viewer' | 'guest'
  status: string
  created_at: string
  expires_at: string
  accepted_at: string | null
  token: string
  invited_by: string
  inviter_name?: string
}

interface Member {
  id: string
  profile: {
    full_name: string
    email: string
  }
  role: 'admin' | 'contributor' | 'member' | 'viewer' | 'guest'
  joined_at: string
  invited_by: string | null
  inviter_name?: string
}

interface InvitationManagerProps {
  familyId: string
  currentUserRole: 'admin' | 'member' | 'guest'
}

const roleIcons = {
  admin: Shield,
  member: Users,
  guest: Eye
}

const roleLabels = {
  admin: 'Admin',
  member: 'Contributor', 
  guest: 'Viewer'
}

const roleColors = {
  admin: 'destructive',
  member: 'default',
  guest: 'secondary'
} as const

export default function InvitationManager({ familyId, currentUserRole }: InvitationManagerProps) {
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([])
  const [acceptedInvites, setAcceptedInvites] = useState<Invitation[]>([])
  const [currentMembers, setCurrentMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [selectedInvite, setSelectedInvite] = useState<Invitation | null>(null)
  const [changingRole, setChangingRole] = useState<string | null>(null)
  const { toast } = useToast()
  const { track } = useAnalytics()

  useEffect(() => {
    loadInvitations()
    loadMembers()
  }, [familyId])

  const loadInvitations = async () => {
    try {
      const { data: invites, error } = await supabase
        .from('invites')
        .select(`
          *,
          profiles!invites_invited_by_fkey(full_name)
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const processedInvites = invites?.map(invite => ({
        ...invite,
        inviter_name: invite.profiles?.full_name || 'Unknown'
      })) || []

      setPendingInvites(processedInvites.filter(invite => 
        invite.status === 'pending' && new Date(invite.expires_at) > new Date()
      ))
      setAcceptedInvites(processedInvites.filter(invite => invite.status === 'accepted'))

    } catch (error) {
      console.error('Error loading invitations:', error)
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive"
      })
    }
  }

  const loadMembers = async () => {
    try {
      const { data: members, error } = await supabase
        .from('members')
        .select(`
          id,
          role,
          joined_at,
          profiles!members_profile_id_fkey(full_name, email)
        `)
        .eq('family_id', familyId)
        .order('joined_at', { ascending: false })

      if (error) throw error

      const processedMembers = members?.map(member => ({
        id: member.id,
        profile: {
          full_name: member.profiles?.full_name || 'Unknown',
          email: member.profiles?.email || ''
        },
        role: member.role,
        joined_at: member.joined_at,
        invited_by: null,
        inviter_name: null
      })) || []

      setCurrentMembers(processedMembers)

    } catch (error) {
      console.error('Error loading members:', error)
    } finally {
      setLoading(false)
    }
  }

  const revokeInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('invites')
        .update({ status: 'revoked' })
        .eq('id', inviteId)

      if (error) throw error

      await loadInvitations()
      
      toast({
        title: "Invitation revoked",
        description: "The invitation has been cancelled"
      })

      track('invite_revoked', { 
        familyId, 
        inviteId,
        role: currentUserRole 
      })

    } catch (error) {
      console.error('Error revoking invite:', error)
      toast({
        title: "Error",
        description: "Failed to revoke invitation",
        variant: "destructive"
      })
    }
  }

  const resendInvite = async (invite: Invitation) => {
    try {
      // Update expiration date
      const newExpiresAt = new Date()
      newExpiresAt.setDate(newExpiresAt.getDate() + 7)

      const { error } = await supabase
        .from('invites')
        .update({ 
          expires_at: newExpiresAt.toISOString(),
          status: 'pending'
        })
        .eq('id', invite.id)

      if (error) throw error

      await loadInvitations()
      
      toast({
        title: "Invitation resent",
        description: `New invitation sent to ${invite.email}`
      })

      track('invite_resent', { 
        familyId, 
        inviteId: invite.id,
        recipientEmail: invite.email 
      })

    } catch (error) {
      console.error('Error resending invite:', error)
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive"
      })
    }
  }

  const changeMemberRole = async (memberId: string, newRole: 'admin' | 'contributor' | 'member' | 'viewer' | 'guest') => {
    if (currentUserRole !== 'admin') {
      toast({
        title: "Permission denied",
        description: "Only admins can change member roles",
        variant: "destructive"
      })
      return
    }

    setChangingRole(memberId)

    try {
      const { error } = await supabase
        .from('members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error

      await loadMembers()
      
      toast({
        title: "Role updated",
        description: `Member role changed to ${roleLabels[newRole]}`
      })

      track('member_role_update', { 
        familyId, 
        memberId,
        newRole,
        changedBy: currentUserRole 
      })

    } catch (error) {
      console.error('Error changing member role:', error)
      toast({
        title: "Error",
        description: "Failed to change member role",
        variant: "destructive"
      })
    } finally {
      setChangingRole(null)
    }
  }

  const copyInviteLink = async (token: string, email: string) => {
    try {
      const appUrl = window.location.origin
      const link = `${appUrl}/invite/${token}`
      await navigator.clipboard.writeText(link)
      
      toast({
        title: "Link copied!",
        description: `Invitation link for ${email} copied to clipboard`
      })

    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      })
    }
  }

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
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingInvites.length})
          </TabsTrigger>
          <TabsTrigger value="accepted" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Accepted ({acceptedInvites.length})
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members ({currentMembers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Invitations that haven't been accepted yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingInvites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No pending invitations
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingInvites.map((invite) => {
                    const RoleIcon = roleIcons[invite.role]
                    const isExpired = new Date(invite.expires_at) < new Date()
                    
                    return (
                      <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <RoleIcon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{invite.email}</div>
                              <div className="text-sm text-muted-foreground">
                                Invited by {invite.inviter_name} • {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={roleColors[invite.role]}>
                            {roleLabels[invite.role]}
                          </Badge>
                          
                          {isExpired ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            <Badge variant="outline">
                              Expires {formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })}
                            </Badge>
                          )}
                          
                          {currentUserRole === 'admin' && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyInviteLink(invite.token, invite.email)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              
                              {isExpired ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => resendInvite(invite)}
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              ) : null}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedInvite(invite)
                                  setRevokeDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accepted" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accepted Invitations</CardTitle>
              <CardDescription>
                Invitations that have been accepted and became members
              </CardDescription>
            </CardHeader>
            <CardContent>
              {acceptedInvites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No accepted invitations yet
                </div>
              ) : (
                <div className="space-y-3">
                  {acceptedInvites.map((invite) => {
                    const RoleIcon = roleIcons[invite.role]
                    
                    return (
                      <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <RoleIcon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{invite.email}</div>
                            <div className="text-sm text-muted-foreground">
                              Joined {formatDistanceToNow(new Date(invite.accepted_at!), { addSuffix: true })} • 
                              Invited by {invite.inviter_name}
                            </div>
                          </div>
                        </div>
                        
                        <Badge variant={roleColors[invite.role]}>
                          {roleLabels[invite.role]}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Members</CardTitle>
              <CardDescription>
                Active family members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentMembers.map((member) => {
                  const RoleIcon = roleIcons[member.role]
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <RoleIcon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{member.profile.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {member.profile.email} • 
                              Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                            </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {currentUserRole === 'admin' ? (
                          <Select
                            value={member.role}
                            onValueChange={(newRole: 'admin' | 'member' | 'guest') => 
                              changeMemberRole(member.id, newRole)
                            }
                            disabled={changingRole === member.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Contributor</SelectItem>
                              <SelectItem value="guest">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={roleColors[member.role]}>
                            {roleLabels[member.role]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Revoke Invitation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the invitation for {selectedInvite?.email}? 
              They will no longer be able to use this invitation link to join the family.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedInvite) {
                  revokeInvite(selectedInvite.id)
                }
                setRevokeDialogOpen(false)
                setSelectedInvite(null)
              }}
            >
              Revoke Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}