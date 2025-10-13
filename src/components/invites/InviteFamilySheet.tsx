import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, Copy, Check, Mail } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface InviteFamilySheetProps {
  familyId: string
}

export function InviteFamilySheet({ familyId }: InviteFamilySheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'member' | 'admin'>('member')
  const [expiryDays, setExpiryDays] = useState('7')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  const generateInvite = async () => {
    if (!email && !generatedLink) {
      toast({
        title: "Email required",
        description: "Please enter an email address to invite",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Generate token
      const token = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays))

      // Create invite record
      const { error: inviteError } = await supabase
        .from('invites')
        .insert({
          family_id: familyId,
          email: email || null,
          invited_by: user.id,
          role: role,
          token: token,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })

      if (inviteError) throw inviteError

      // Generate magic link
      const magicLink = `${window.location.origin}/invite/${token}`
      setGeneratedLink(magicLink)

      toast({
        title: "Invite created! 🎉",
        description: email 
          ? `Magic link generated for ${email}` 
          : "Share the magic link with your family member",
      })
    } catch (error) {
      console.error('Error generating invite:', error)
      toast({
        title: "Failed to create invite",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      toast({
        title: "Link copied! 📋",
      })
    } catch (error) {
      toast({
        title: "Failed to copy",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setEmail('')
    setRole('member')
    setExpiryDays('7')
    setGeneratedLink('')
    setIsCopied(false)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setTimeout(resetForm, 300) // Reset after close animation
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Family
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Invite to Family</SheetTitle>
          <SheetDescription>
            Generate a magic link to invite family members. No password needed!
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {!generatedLink ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="family@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email is optional. You can share the link directly.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as 'member' | 'admin')}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      <div>
                        <div className="font-medium">Member</div>
                        <div className="text-xs text-muted-foreground">
                          Can view and contribute content
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div>
                        <div className="font-medium">Admin</div>
                        <div className="text-xs text-muted-foreground">
                          Full access and family management
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry">Link expires in</Label>
                <Select value={expiryDays} onValueChange={setExpiryDays}>
                  <SelectTrigger id="expiry">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={generateInvite} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Magic Link'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Magic Link Generated! ✨</Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyLink}
                    className={cn(
                      "shrink-0",
                      isCopied && "bg-green-50 border-green-200"
                    )}
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link with your family member. It expires in {expiryDays} days.
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="font-medium">Invite Details</span>
                </div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  {email && <div>Email: {email}</div>}
                  <div>Role: {role === 'admin' ? 'Admin' : 'Member'}</div>
                  <div>Expires: {expiryDays} days from now</div>
                </div>
              </div>

              <Button 
                onClick={resetForm}
                variant="outline"
                className="w-full"
              >
                Create Another Invite
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
