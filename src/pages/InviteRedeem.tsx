import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, UserPlus, AlertCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { GuestOnboarding } from '@/components/invites/GuestOnboarding'

export default function InviteRedeem() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [invite, setInvite] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)

  useEffect(() => {
    validateInvite()
  }, [token])

  const validateInvite = async () => {
    if (!token) {
      setError('Invalid invite link')
      setIsLoading(false)
      return
    }

    try {
      // Fetch invite details
      const { data: inviteData, error: inviteError } = await supabase
        .from('invites')
        .select('*, families(name)')
        .eq('token', token)
        .eq('status', 'pending')
        .single()

      if (inviteError || !inviteData) {
        setError('This invite link is invalid or has already been used')
        setIsLoading(false)
        return
      }

      // Check if expired
      const expiresAt = new Date(inviteData.expires_at)
      if (expiresAt < new Date()) {
        setError('This invite link has expired')
        setIsLoading(false)
        return
      }

      setInvite(inviteData)
    } catch (err) {
      console.error('Error validating invite:', err)
      setError('Failed to validate invite')
    } finally {
      setIsLoading(false)
    }
  }

  const redeemInvite = async () => {
    if (!invite) return

    setIsRedeeming(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // If not logged in, create temporary guest session
      if (!user) {
        // For now, redirect to auth with invite token in state
        navigate(`/auth?invite=${token}`)
        return
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('members')
        .select('id')
        .eq('family_id', invite.family_id)
        .eq('profile_id', user.id)
        .single()

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "You're already part of this family!",
        })
        navigate('/home-v2')
        return
      }

      // Add user to family
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          family_id: invite.family_id,
          profile_id: user.id,
          role: invite.role,
          invited_by: invite.invited_by
        })

      if (memberError) throw memberError

      // Mark invite as accepted
      await supabase
        .from('invites')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('token', token)

      // Check if this is first family membership (new guest)
      const { count: membershipCount } = await supabase
        .from('members')
        .select('id', { count: 'exact', head: true })
        .eq('profile_id', user.id)

      const isNewGuest = (membershipCount ?? 0) <= 1

      if (isNewGuest) {
        // Show onboarding for new guests
        setFamilyId(invite.family_id)
        setShowOnboarding(true)
      } else {
        // Existing user, just redirect
        toast({
          title: "Welcome to the family! 🎉",
          description: `You've joined ${invite.families?.name}`,
        })
        navigate('/home-v2')
      }
    } catch (err) {
      console.error('Error redeeming invite:', err)
      toast({
        title: "Failed to join family",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive"
      })
    } finally {
      setIsRedeeming(false)
    }
  }

  const handleOnboardingComplete = () => {
    navigate('/home-v2')
  }

  if (showOnboarding && familyId) {
    return <GuestOnboarding familyId={familyId} onComplete={handleOnboardingComplete} />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Invalid Invite</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/home-v2')}
              variant="outline"
              className="w-full"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <CardTitle>You're Invited!</CardTitle>
          </div>
          <CardDescription>
            Join {invite?.families?.name} and start sharing family memories together
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="text-sm font-medium">Invite Details</div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Family: {invite?.families?.name}</div>
              <div>Role: {invite?.role === 'admin' ? 'Admin' : 'Member'}</div>
              <div>
                Expires: {new Date(invite?.expires_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <Button 
            onClick={redeemInvite}
            disabled={isRedeeming}
            className="w-full"
          >
            {isRedeeming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              'Accept Invite & Join Family'
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By accepting, you'll become a {invite?.role || 'member'} of this family
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
