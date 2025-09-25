import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Mail, Check, AlertCircle, Shield, Eye, Edit, UserPlus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'

interface EnhancedInviteModalProps {
  familyId: string
  familyName: string
  onClose: () => void
  onInviteSent: () => void
}

type Role = 'admin' | 'contributor' | 'viewer'

const roleOptions = [
  {
    value: 'viewer' as Role,
    label: 'Viewer',
    description: 'Can view stories and add comments',
    icon: Eye,
    permissions: ['View stories', 'Add comments', 'View family tree']
  },
  {
    value: 'contributor' as Role,
    label: 'Contributor', 
    description: 'Can create stories and participate fully',
    icon: Edit,
    permissions: ['All viewer permissions', 'Create stories', 'Upload media', 'Edit own content']
  },
  {
    value: 'admin' as Role,
    label: 'Admin',
    description: 'Full control including family management',
    icon: Shield,
    permissions: ['All contributor permissions', 'Invite members', 'Manage family settings', 'Moderate content']
  }
]

export default function EnhancedInviteModal({ familyId, familyName, onClose, onInviteSent }: EnhancedInviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('contributor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const { toast } = useToast()
  const { track } = useAnalytics()

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    return emailRegex.test(email.trim())
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Email address is required')
      return
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if user is admin
      const { data: memberCheck } = await supabase
        .from('members')
        .select('role')
        .eq('family_id', familyId)
        .eq('profile_id', user.id)
        .single()

      if (!memberCheck || memberCheck.role !== 'admin') {
        throw new Error('Only admins can send invites')
      }

      // Check if there's already a pending invite
      const { data: existingInvite } = await supabase
        .from('invites')
        .select('*')
        .eq('family_id', familyId)
        .eq('email', trimmedEmail)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (existingInvite) {
        setError('There is already a pending invitation for this email address')
        return
      }

      // Check if user is already a member
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', trimmedEmail)
        .maybeSingle()

      if (profiles) {
        const { data: existingMember } = await supabase
          .from('members')
          .select('*')
          .eq('family_id', familyId)
          .eq('profile_id', profiles.id)
          .maybeSingle()

        if (existingMember) {
          setError('This person is already a member of the family')
          return
        }
      }

      // Generate secure token
      const token = crypto.randomUUID() + '-' + Date.now().toString(36)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

      // Create invite
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .insert({
          family_id: familyId,
          email: trimmedEmail,
          role,
          token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
          sent_at: new Date().toISOString(),
          invite_method: 'email'
        })
        .select()
        .single()

      if (inviteError) throw inviteError

      // Call edge function to send email
      const { error: emailError } = await supabase.functions.invoke('send-invite', {
        body: {
          inviteId: invite.id,
          email: trimmedEmail,
          familyName,
          role,
          token,
          inviterName: user.user_metadata?.full_name || user.email
        }
      })

      if (emailError) {
        console.warn('Email sending failed:', emailError)
        // Don't fail the invite creation if email fails
      }

      // Generate invite link
      const appUrl = window.location.origin
      const link = `${appUrl}/invite/${token}`
      setInviteLink(link)
      setSuccess(true)

      // Track analytics
      track('invite_sent', {
        familyId,
        recipientEmail: trimmedEmail,
        role,
        method: 'email'
      })

      toast({
        title: "Invitation sent!",
        description: `Invite sent to ${trimmedEmail} as ${roleOptions.find(r => r.value === role)?.label}`,
      })

      setTimeout(() => {
        onInviteSent()
      }, 3000)

    } catch (error: any) {
      const message = error.message || 'Failed to send invitation'
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setLinkCopied(true)
      toast({
        title: "Link copied!",
        description: "Invite link copied to clipboard",
      })
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy link to clipboard",
        variant: "destructive"
      })
    }
  }

  const selectedRoleOption = roleOptions.find(r => r.value === role)

  if (success) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Invitation Sent Successfully!
            </DialogTitle>
            <DialogDescription>
              {email} has been invited to join {familyName} as a {selectedRoleOption?.label}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                An email with login instructions has been sent to {email}.
              </AlertDescription>
            </Alert>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                You can also share this direct link:
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="text-xs font-mono"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyInviteLink}
                  className={linkCopied ? 'text-green-600' : ''}
                >
                  {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite to {familyName}
          </DialogTitle>
          <DialogDescription>
            Send a secure invitation with specific role permissions
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSendInvite} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="family@example.com"
              required
              className={error && !validateEmail(email.trim()) ? 'border-destructive' : ''}
            />
            {email.trim() && !validateEmail(email.trim()) && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Please enter a valid email address
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="role">Role & Permissions *</Label>
            <Select value={role} onValueChange={(value: Role) => setRole(value)}>
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
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">This role includes:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {selectedRoleOption.permissions.map((permission, index) => (
                    <li key={index} className="flex items-center gap-1">
                      <Check className="h-3 w-3 text-green-600" />
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button 
              type="submit" 
              disabled={loading || !email.trim() || !validateEmail(email.trim())}
              className="flex-1"
            >
              <Mail className="h-4 w-4 mr-2" />
              {loading ? 'Sending Invite...' : 'Send Invitation'}
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