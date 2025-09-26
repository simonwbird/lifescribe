import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Mail, 
  Copy, 
  RefreshCw, 
  Settings, 
  UserX, 
  Users, 
  Shield, 
  Eye,
  UserCheck,
  Clock,
  CheckCircle2,
  X
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EnhancedInviteModalProps {
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
  invited_by: string
}

interface Member {
  id: string
  profile_id: string
  role: string
  status: string
  joined_at: string
  profiles?: {
    full_name: string | null
    email: string | null
    avatar_url: string | null
  }
}

type RoleType = 'admin' | 'member' | 'guest'

const roleOptions = [
  {
    value: 'guest' as RoleType,
    label: 'Viewer',
    description: 'Can view content and comment',
    icon: Eye,
    permissions: ['View all content', 'Add comments', 'React to posts']
  },
  {
    value: 'member' as RoleType,
    label: 'Contributor', 
    description: 'Can add content and invite others',
    icon: Users,
    permissions: ['All viewer permissions', 'Create stories', 'Upload media', 'Invite family members']
  },
  {
    value: 'admin' as RoleType,
    label: 'Admin',
    description: 'Full family management rights',
    icon: Shield,
    permissions: ['All contributor permissions', 'Manage family settings', 'Remove members', 'Delete content']
  }
]

export default function EnhancedInviteModal({ 
  familyId, 
  onClose, 
  onSuccess 
}: EnhancedInviteModalProps) {
  const [email, setEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState<RoleType>('member')
  const [existingInvites, setExistingInvites] = useState<Invite[]>([])
  const [familyMembers, setFamilyMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [counts, setCounts] = useState({
    members: 0,
    pendingInvites: 0,
    activeInvites: 0
  })
  
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load existing invites
      const { data: invites } = await supabase
        .from('invites')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false })

      // Load family members  
      const { data: members } = await supabase
        .from('members')
        .select(`
          *,
          profiles:profile_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('family_id', familyId)
        .order('joined_at', { ascending: false })

      if (invites) {
        setExistingInvites(invites)
      }

      if (members) {
        // Add default status field if missing
        const membersWithStatus = members.map((member: any) => ({
          ...member,
          status: member.status || 'active'
        }))
        setFamilyMembers(membersWithStatus)
      }

      // Update counts reliably
      const memberCount = members?.length || 0
      const pendingInvitesCount = invites?.filter(inv => 
        inv.status === 'pending' && new Date(inv.expires_at) > new Date()
      ).length || 0
      const activeInvitesCount = invites?.filter(inv => 
        inv.status === 'pending'
      ).length || 0

      setCounts({
        members: memberCount,
        pendingInvites: pendingInvitesCount,
        activeInvites: activeInvitesCount
      })

    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load invite information',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [familyId, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const emailTrimmed = email.trim().toLowerCase()
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      })
      return
    }

    // Check if already a member
    const existingMember = familyMembers.find(m => 
      m.profiles?.email?.toLowerCase() === emailTrimmed
    )
    if (existingMember) {
      toast({
        title: 'Already a member',
        description: 'This person is already a family member',
        variant: 'destructive'
      })
      return
    }

    // Check if already invited
    const existingInvite = existingInvites.find(inv => 
      inv.email.toLowerCase() === emailTrimmed && 
      inv.status === 'pending' && 
      new Date(inv.expires_at) > new Date()
    )
    if (existingInvite) {
      toast({
        title: 'Already invited',
        description: 'This person already has a pending invitation',
        variant: 'destructive'
      })
      return
    }

    setSending(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error } = await supabase
        .from('invites')
        .insert([{
          family_id: familyId,
          email: emailTrimmed,
          role: selectedRole,
          token: token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        }])

      if (error) throw error

      const inviteLink = `${window.location.origin}/invite/${token}`
      await navigator.clipboard.writeText(inviteLink)
      
      toast({
        title: 'Invitation sent!',
        description: `Invited ${emailTrimmed} as ${getRoleLabel(selectedRole)} - Link copied to clipboard!`
      })

      setEmail('')
      await loadData() // Refresh data to update counts
      onSuccess()
      
    } catch (error: any) {
      console.error('Error sending invite:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive'
      })
    } finally {
      setSending(false)
    }
  }

  const handleCopyInviteLink = async (token: string) => {
    try {
      const inviteLink = `${window.location.origin}/invite/${token}`
      await navigator.clipboard.writeText(inviteLink)
      toast({
        title: 'Link copied!',
        description: 'Invite link has been copied to clipboard'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive'
      })
    }
  }

  const handleResendInvite = async (inviteId: string) => {
    try {
      const newToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error } = await supabase
        .from('invites')
        .update({
          token: newToken,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', inviteId)

      if (error) throw error

      await handleCopyInviteLink(newToken)
      await loadData()
      
      toast({
        title: 'Invitation resent!',
        description: 'New invite link generated and copied to clipboard'
      })
    } catch (error) {
      console.error('Error resending invite:', error)
      toast({
        title: 'Error',
        description: 'Failed to resend invitation',
        variant: 'destructive'
      })
    }
  }

  const handleRoleChange = async (memberId: string, newRole: RoleType) => {
    setUpdatingRole(memberId)
    try {
      const { error } = await supabase
        .from('members')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)

      if (error) throw error

      toast({
        title: 'Role updated!',
        description: `Member role changed to ${getRoleLabel(newRole)}`
      })

      await loadData() // Refresh to show updated role
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive'
      })
    } finally {
      setUpdatingRole(null)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('invites')
        .update({ 
          status: 'revoked',
          updated_at: new Date().toISOString()
        })
        .eq('id', inviteId)

      if (error) throw error

      toast({
        title: 'Invite revoked',
        description: 'The invitation has been cancelled'
      })

      await loadData()
    } catch (error) {
      console.error('Error revoking invite:', error)
      toast({
        title: 'Error', 
        description: 'Failed to revoke invitation',
        variant: 'destructive'
      })
    }
  }

  const getRoleIcon = (role: string) => {
    const option = roleOptions.find(r => r.value === role)
    return option?.icon || Users
  }

  const getRoleLabel = (role: string) => {
    const option = roleOptions.find(r => r.value === role)
    return option?.label || role
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'default'
      case 'member': return 'secondary' 
      case 'guest': return 'outline'
      default: return 'secondary'
    }
  }

  const selectedRoleOption = roleOptions.find(r => r.value === selectedRole)

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Manage Family Invitations</span>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{counts.members} Members</span>
              <span>{counts.pendingInvites} Pending</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2 space-y-6">
          {/* Send New Invite */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Invite New Member
              </CardTitle>
              <CardDescription>
                Send an invitation to join your family space
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
                    placeholder="enter@email.com"
                    required
                  />
                </div>

                <div>
                  <Label>Role & Permissions</Label>
                  <Select value={selectedRole} onValueChange={(value: RoleType) => setSelectedRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => {
                        const Icon = option.icon
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-xs text-muted-foreground">{option.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  
                  {selectedRoleOption && (
                    <div className="p-3 bg-muted/50 rounded-md text-xs mt-2">
                      <div className="font-medium mb-1">{selectedRoleOption.label} permissions:</div>
                      <ul className="space-y-0.5">
                        {selectedRoleOption.permissions.map((permission, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-primary" />
                            {permission}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={sending || !email.trim()} className="w-full">
                  {sending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing Members */}
          {familyMembers.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Family Members ({counts.members})</h3>
                <div className="space-y-2">
                  {familyMembers.map((member) => {
                    const RoleIcon = getRoleIcon(member.role)
                    return (
                      <Card key={member.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <UserCheck className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {member.profiles?.full_name || 'Unnamed'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {member.profiles?.email}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Select 
                                value={member.role} 
                                onValueChange={(value: RoleType) => handleRoleChange(member.id, value)}
                                disabled={updatingRole === member.id}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {roleOptions.map((option) => {
                                    const Icon = option.icon
                                    return (
                                      <SelectItem key={option.value} value={option.value}>
                                        <div className="flex items-center gap-2">
                                          <Icon className="h-3 w-3" />
                                          {option.label}
                                        </div>
                                      </SelectItem>
                                    )
                                  })}
                                </SelectContent>
                              </Select>
                              
                              {updatingRole === member.id && (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Pending Invites */}
          {existingInvites.filter(inv => inv.status === 'pending').length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Pending Invitations ({counts.pendingInvites})</h3>
                <div className="space-y-2">
                  {existingInvites
                    .filter(inv => inv.status === 'pending')
                    .map((invite) => {
                      const RoleIcon = getRoleIcon(invite.role)
                      const isExpired = new Date(invite.expires_at) < new Date()
                      
                      return (
                        <Card key={invite.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  isExpired ? 'bg-red-100' : 'bg-yellow-100'
                                }`}>
                                  <Clock className={`h-4 w-4 ${
                                    isExpired ? 'text-red-600' : 'text-yellow-600'
                                  }`} />
                                </div>
                                <div>
                                  <p className="font-medium">{invite.email}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Sent {new Date(invite.created_at).toLocaleDateString()}
                                    {isExpired && <span className="text-red-600 ml-2">• Expired</span>}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge variant={getRoleColor(invite.role)} className="flex items-center gap-1">
                                  <RoleIcon className="h-3 w-3" />
                                  {getRoleLabel(invite.role)}
                                </Badge>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyInviteLink(invite.token)}
                                  disabled={isExpired}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleResendInvite(invite.id)}
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRevokeInvite(invite.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
