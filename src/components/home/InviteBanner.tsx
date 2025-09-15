import React, { useState, useEffect } from 'react'
import { Users, Copy, Mail, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface InviteBannerProps {
  className?: string
}

export default function InviteBanner({ className }: InviteBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [familyCount, setFamilyCount] = useState(2) // Mock count
  const [isInviting, setIsInviting] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [showEmailInput, setShowEmailInput] = useState(false)
  const { toast } = useToast()
  const { track } = useAnalytics()

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('invite_banner_dismissed')
    if (dismissed === 'true') {
      setIsDismissed(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('invite_banner_dismissed', 'true')
    track('invite_banner_dismissed')
  }

  const handleCopyLink = async () => {
    try {
      // Get current user and their family id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (memberError || !member?.family_id) throw new Error('No family found')

      const inviteLink = `${window.location.origin}/invite/${member.family_id}`
      await navigator.clipboard.writeText(inviteLink)
      toast({
        title: "Link copied!",
        description: "Share this link with your family members"
      })
      track('invite_link_copied')
    } catch (error) {
      toast({
        title: "Copy failed", 
        description: "Unable to copy link to clipboard",
        variant: "destructive"
      })
    }
  }

  const handleEmailInvite = async () => {
    if (!showEmailInput) {
      setShowEmailInput(true)
      return
    }

    if (!emailInput.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive"
      })
      return
    }

    setIsInviting(true)
    track('invite_email_clicked')

    try {
      // Get current user and their family id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (memberError || !member?.family_id) throw new Error('No family found')

      // Call the invite edge function
      const { data, error } = await supabase.functions.invoke('invite', {
        body: {
          familyId: member.family_id,
          email: emailInput.trim(),
          role: 'member'
        }
      })

      // Check if there's an error or the function returned an error response
      if (error || (data && (data as any).error)) {
        const serverMsg = (data as any)?.error || error?.message
        throw new Error(serverMsg || 'Failed to send invitation')
      }

      // Verify we got a success response
      if (!data || !(data as any).success) {
        throw new Error('Unexpected response from server')
      }

      toast({
        title: "Invitation sent!",
        description: `We've sent an invitation to ${emailInput}`
      })

      setEmailInput('')
      setShowEmailInput(false)

    } catch (error: any) {
      console.error('Error sending invite:', error)
      toast({
        title: "Failed to send invite",
        description: error.message || "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsInviting(false)
    }
  }

  if (isDismissed || familyCount >= 5) {
    return null
  }

  const membersNeeded = Math.max(0, 5 - familyCount)

  return (
    <Card className={cn(
      "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200",
      "dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-800",
      className
    )}>
      <CardContent className="p-4">
        {showEmailInput && (
          <div className="mb-3 flex gap-2">
            <input
              type="email"
              placeholder="Enter email address"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm border border-border rounded-md bg-background"
              onKeyPress={(e) => e.key === 'Enter' && handleEmailInvite()}
              disabled={isInviting}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowEmailInput(false)
                setEmailInput('')
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">
                Invite {membersNeeded} more family member{membersNeeded !== 1 ? 's' : ''} to unlock your weekly digest
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Get automated summaries of your family's stories and memories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline" 
              size="sm"
              onClick={handleCopyLink}
              className="gap-2 text-xs h-8 bg-white dark:bg-gray-900"
            >
              <Copy className="h-3 w-3" />
              Copy link
            </Button>
            
            <Button
              size="sm"
              onClick={handleEmailInvite}
              disabled={isInviting}
              className="gap-2 text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              <Mail className="h-3 w-3" />
              {isInviting ? 'Sending...' : showEmailInput ? 'Send invite' : 'Invite via email'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 w-8 p-0 hover:bg-blue-200 dark:hover:bg-blue-900"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}