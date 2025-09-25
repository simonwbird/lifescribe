import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Mail, Check, Shield, Users, Eye } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToast } from '@/hooks/use-toast'

interface EnhancedInviteModalProps {
  familyId: string
  familyName: string
  onClose: () => void
  onInviteSent: () => void
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

export default function EnhancedInviteModal({ familyId, familyName, onClose, onInviteSent }: EnhancedInviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<RoleType>('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const { toast } = useToast()
  const { track } = useAnalytics()

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
      if (!user) {
        setError('You must be logged in to send invitations')
        return
      }

      // Verify user is admin of this family
      const { data: memberCheck } = await supabase
        .from('members')
        .select('role')
        .eq('family_id', familyId)
        .eq('profile_id', user.id)
        .single()

      if (!memberCheck || memberCheck.role !== 'admin') {
        setError('Only family admins can send invitations')
        return
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('members')
        .select('profile_id')
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
        .eq('email', email.trim().toLowerCase())
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (existingInvite) {
        setError('There is already a pending invitation for this email address')
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
          email: email.trim().toLowerCase(),
          role,
          token,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })

      if (inviteError) throw inviteError

      // Generate invite link
      const appUrl = window.location.origin
      const link = `${appUrl}/invite/${token}`
      setInviteLink(link)
      setSuccess(true)
      
      toast({
        title: "Invitation sent successfully!",
        description: `${email} will receive an invitation to join as ${roleOptions.find(r => r.value === role)?.label}`,
      })

      // Track analytics event
      track('invite_sent', { 
        familyId, 
        recipientEmail: email, 
        role,
        method: 'enhanced_modal'
      })

    } catch (error: any) {
      console.error('Invitation error:', error)
      setError(error.message || 'Failed to send invitation. Please try again.')
      toast({
        title: "Error sending invitation",
        description: error.message || 'Failed to send invitation. Please try again.',
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopySuccess(true)
      toast({
        title: "Link copied!",
        description: "Invitation link copied to clipboard",
      })
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive"
      })
    }
  }

  const selectedRoleOption = roleOptions.find(r => r.value === role)

  if (success) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Invitation Sent!
            </DialogTitle>
            <DialogDescription>
              Successfully sent invitation to {email} to join {familyName} as {selectedRoleOption?.label}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Share this invitation link directly:
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
                  className={copySuccess ? 'bg-green-100 text-green-700' : ''}
                >
                  {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                {selectedRoleOption?.icon && <selectedRoleOption.icon className="h-4 w-4 text-blue-600" />}
                <span className="font-medium text-blue-900">{selectedRoleOption?.label} Permissions</span>
              </div>
              <ul className="text-xs text-blue-700 space-y-1">
                {selectedRoleOption?.permissions.map((permission, index) => (
                  <li key={index}>• {permission}</li>
                ))}
              </ul>
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite to {familyName}</DialogTitle>
          <DialogDescription>
            Send an invitation to join your family with specific permissions
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSendInvite} className="space-y-6">
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

          <div className="space-y-3">
            <Label htmlFor="role">Role & Permissions</Label>
            <Select value={role} onValueChange={(value: RoleType) => setRole(value)}>
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
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <selectedRoleOption.icon className="h-4 w-4" />
                  <span className="font-medium">{selectedRoleOption.label} will be able to:</span>
                </div>
                <ul className="text-sm space-y-1">
                  {selectedRoleOption.permissions.map((permission, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-current rounded-full" />
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !email.trim()} className="flex-1">
              <Mail className="h-4 w-4 mr-2" />
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