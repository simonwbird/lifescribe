import React, { useState, useEffect } from 'react'
import { Users, Copy, Mail, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'
import { cn } from '@/lib/utils'

interface InviteBannerProps {
  className?: string
}

export default function InviteBanner({ className }: InviteBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [familyCount, setFamilyCount] = useState(2) // Mock count
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
    const inviteLink = `${window.location.origin}/invite/family123` // Mock link
    try {
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

  const handleEmailInvite = () => {
    track('invite_email_clicked')
    // In real app, would open invite modal
    toast({
      title: "Email invite",
      description: "Opening email invite modal..."
    })
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
              className="gap-2 text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Mail className="h-3 w-3" />
              Invite via email
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