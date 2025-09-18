import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Copy, MessageCircle, Check, Send } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface InlineInviteButtonProps {
  personName: string
  familyId: string
  profileId: string
  size?: 'sm' | 'default'
  showProgress?: boolean
  className?: string
}

export default function InlineInviteButton({ 
  personName, 
  familyId, 
  profileId, 
  size = 'sm',
  showProgress = false,
  className = '' 
}: InlineInviteButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generateInviteLink = async () => {
    try {
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

      const { error } = await supabase.from('invites').insert({
        family_id: familyId,
        invited_by: profileId,
        email: 'link-invite@family.local', // Placeholder for link invites
        token,
        expires_at: expiresAt.toISOString(),
        role: 'member',
        status: 'pending'
      })

      if (error) throw error

      return `${window.location.origin}/invite/${token}`
    } catch (error) {
      console.error('Error generating invite link:', error)
      throw error
    }
  }

  const handleCopyLink = async () => {
    try {
      const link = await generateInviteLink()
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: 'Link copied!',
        description: 'Share this link with your family member'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate invite link',
        variant: 'destructive'
      })
    }
  }

  const handleWhatsAppShare = async () => {
    try {
      const link = await generateInviteLink()
      const message = `Hi! I'd love for you to join our family space on LifeScribe where we're collecting memories about ${personName}. Join us here: ${link}`
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
      setShowModal(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate invite link',
        variant: 'destructive'
      })
    }
  }

  const handleEmailInvite = async () => {
    if (!email.trim()) return

    setIsSending(true)
    try {
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const { error } = await supabase.from('invites').insert({
        family_id: familyId,
        invited_by: profileId,
        email: email.trim(),
        token,
        expires_at: expiresAt.toISOString(),
        role: 'member',
        status: 'pending'
      })

      if (error) throw error

      // In a real app, this would trigger an email via edge function
      toast({
        title: 'Invitation sent!',
        description: `${email} will receive an email invitation`
      })
      
      setEmail('')
      setShowModal(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="outline"
          size={size}
          onClick={() => setShowModal(true)}
          className="border-brand-200 text-brand-700 hover:bg-brand-50"
        >
          <UserPlus className="h-3 w-3 mr-1" />
          Invite
        </Button>
        
        {showProgress && (
          <Badge variant="secondary" className="text-xs">
            2 invites left to unlock digest
          </Badge>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite someone for {personName}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Invite family members to share memories and stories about {personName}.
            </p>
            
            {/* Quick share options */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex items-center gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copy Link
              </Button>
              
              <Button
                variant="outline"
                onClick={handleWhatsAppShare}
                className="flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or send email</span>
              </div>
            </div>
            
            {/* Email invite */}
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="family@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEmailInvite()}
                />
                <Button
                  onClick={handleEmailInvite}
                  disabled={!email.trim() || isSending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {showProgress && (
              <div className="bg-brand-50 rounded-lg p-3 text-center">
                <p className="text-sm text-brand-700 font-medium">
                  🎁 Get 2+ family members to unlock Weekly Digest
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}