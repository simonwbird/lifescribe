import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Search, 
  Mail, 
  Users, 
  UserCheck, 
  Eye, 
  Shield, 
  Plus,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface FamilyMember {
  id: string
  profile_id: string
  full_name: string | null
  email: string | null
  role: 'admin' | 'member' | 'guest' | 'viewer' | 'contributor'
  status: 'active' | 'pending' | 'inactive'
  joined_at: string
  avatar_url?: string
}

interface PendingInvite {
  id: string
  email: string
  role: 'admin' | 'member' | 'guest' | 'viewer' | 'contributor'
  invited_by: string
  created_at: string
  expires_at: string
  status: 'pending' | 'accepted' | 'expired'
}

interface EnhancedMemberSearchProps {
  familyId: string
  onInviteSent: () => void
  onMemberSelected?: (member: FamilyMember) => void
  showExistingMembers?: boolean
}

type RoleType = 'admin' | 'member' | 'guest' | 'viewer' | 'contributor'

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

export default function EnhancedMemberSearch({ 
  familyId, 
  onInviteSent, 
  onMemberSelected,
  showExistingMembers = true 
}: EnhancedMemberSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<RoleType>('member')
  const [existingMembers, setExistingMembers] = useState<FamilyMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  
  const { track } = useAnalytics()
  const { toast } = useToast()

  useEffect(() => {
    loadFamilyData()
  }, [familyId])

  const loadFamilyData = async () => {
    try {
      setLoading(true)
      
      // Load existing family members
      const { data: membersData } = await supabase
        .from('members')
        .select(`
          id,
          profile_id,
          role,
          status,
          joined_at,
          profiles:profile_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('family_id', familyId)
      
      if (membersData) {
        const members: FamilyMember[] = membersData.map((member: any) => ({
          id: member.id,
          profile_id: member.profile_id,
          full_name: member.profiles?.full_name || null,
          email: member.profiles?.email || null,
          role: member.role,
          status: member.status,
          joined_at: member.joined_at,
          avatar_url: member.profiles?.avatar_url
        }))
        setExistingMembers(members)
      }
      
      // Load pending invites
      const { data: invitesData } = await supabase
        .from('invites')
        .select('*')
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
      
      if (invitesData) {
        const invites: PendingInvite[] = invitesData.map((invite: any) => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          invited_by: invite.invited_by,
          created_at: invite.created_at,
          expires_at: invite.expires_at,
          status: invite.status === 'pending' ? 'pending' : 
                  invite.status === 'accepted' ? 'accepted' : 'expired'
        }))
        setPendingInvites(invites)
      }
      
    } catch (error) {
      console.error('Error loading family data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load family information',
        variant: 'destructive'  
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return existingMembers
    
    const query = searchQuery.toLowerCase()
    return existingMembers.filter(member => 
      member.full_name?.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query)
    )
  }, [existingMembers, searchQuery])

  const filteredInvites = useMemo(() => {
    if (!searchQuery.trim()) return pendingInvites
    
    const query = searchQuery.toLowerCase()
    return pendingInvites.filter(invite => 
      invite.email.toLowerCase().includes(query)
    )
  }, [pendingInvites, searchQuery])

  const isEmailInvited = (email: string) => {
    return pendingInvites.some(invite => 
      invite.email.toLowerCase() === email.toLowerCase()
    )
  }

  const isEmailMember = (email: string) => {
    return existingMembers.some(member => 
      member.email?.toLowerCase() === email.toLowerCase()
    )
  }

  const handleSendInvite = async () => {
    const email = searchQuery.trim().toLowerCase()
    
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive'
      })
      return
    }

    if (isEmailMember(email)) {
      toast({
        title: 'Already a member',
        description: 'This person is already a family member',
        variant: 'destructive'
      })
      return
    }

    if (isEmailInvited(email)) {
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

      // Verify user is admin
      const { data: memberCheck } = await supabase
        .from('members')
        .select('role')
        .eq('family_id', familyId)
        .eq('profile_id', user.id)
        .single()

      if (!memberCheck || memberCheck.role !== 'admin') {
        throw new Error('Only family admins can send invitations')
      }

      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error: inviteError } = await supabase
        .from('invites')
        .insert({
          family_id: familyId,
          email: email,
          role: selectedRole,
          token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })

      if (inviteError) throw inviteError

      // Send email via edge function
      const { error: emailError } = await supabase.functions.invoke('send-invite-email', {
        body: {
          email: email,
          familyId: familyId,
          token: token,
          role: selectedRole
        }
      })

      if (emailError) {
        console.warn('Email sending failed:', emailError)
        // Don't fail the whole operation if email fails
      }

      track('invite_sent', {
        familyId,
        role: selectedRole,
        method: 'enhanced_search'
      })

      toast({
        title: 'Invitation sent!',
        description: `Invited ${email} to join as ${roleOptions.find(r => r.value === selectedRole)?.label}`
      })

      setSearchQuery('')
      setShowInviteForm(false)
      await loadFamilyData()
      onInviteSent()

    } catch (error: any) {
      console.error('Error sending invite:', error)
      toast({
        title: 'Error sending invitation',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive'
      })
    } finally {
      setSending(false)
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

  const selectedRoleOption = roleOptions.find(r => r.value === selectedRole)

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="space-y-2">
        <Label htmlFor="member-search">Search members or enter email to invite</Label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="member-search"
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Existing Members */}
          {showExistingMembers && filteredMembers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Family Members</h4>
              <div className="space-y-1">
                {filteredMembers.map((member) => {
                  const RoleIcon = getRoleIcon(member.role)
                  return (
                    <Card 
                      key={member.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => onMemberSelected?.(member)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {member.full_name || 'Unnamed'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {member.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <RoleIcon className="h-3 w-3" />
                              {getRoleLabel(member.role)}
                            </Badge>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Pending Invites */}
          {filteredInvites.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Pending Invitations</h4>
              <div className="space-y-1">
                {filteredInvites.map((invite) => {
                  const RoleIcon = getRoleIcon(invite.role)
                  return (
                    <Card key={invite.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Clock className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {invite.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Invited {new Date(invite.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <RoleIcon className="h-3 w-3" />
                            {getRoleLabel(invite.role)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* No Results / Invite New */}
          {searchQuery.trim() && 
           filteredMembers.length === 0 && 
           filteredInvites.length === 0 && (
            <div className="space-y-4">
              <Separator />
              
              {searchQuery.includes('@') ? (
                // Show invite form for email addresses
                <div className="space-y-4">
                  <div className="text-center">
                    <Mail className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <h4 className="text-sm font-medium">No existing member found</h4>
                    <p className="text-xs text-muted-foreground">
                      Would you like to invite <strong>{searchQuery}</strong> to join?
                    </p>
                  </div>

                  {!showInviteForm ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowInviteForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Invite {searchQuery}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Role & Permissions</Label>
                        <Select value={selectedRole} onValueChange={(value: RoleType) => setSelectedRole(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex items-center gap-2">
                                  <option.icon className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-muted-foreground">{option.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {selectedRoleOption && (
                          <div className="p-2 bg-muted/50 rounded text-xs">
                            <div className="font-medium mb-1">{selectedRoleOption.label} permissions:</div>
                            <ul className="space-y-0.5">
                              {selectedRoleOption.permissions.map((permission, index) => (
                                <li key={index} className="flex items-center gap-1">
                                  <div className="w-1 h-1 bg-current rounded-full" />
                                  {permission}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSendInvite}
                          disabled={sending}
                          className="flex-1"
                        >
                          {sending ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground mr-2" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Invite
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowInviteForm(false)}
                          disabled={sending}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Show no results message for non-email searches
                <div className="text-center py-4">
                  <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <h4 className="text-sm font-medium">No members found</h4>
                  <p className="text-xs text-muted-foreground">
                    Try searching by name or enter an email address to invite someone new
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
