import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'
import { trackCodeConsumed, trackJoinStarted } from '@/lib/eventTrackingService'
import { toast } from 'sonner'
import { Users, Link, Hash, AlertTriangle, Clock, Ban } from 'lucide-react'

interface JoinFamilyCardProps {
  onSuccess?: () => void
}

export function JoinFamilyCard({ onSuccess }: JoinFamilyCardProps) {
  const [familyCode, setFamilyCode] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [familyName, setFamilyName] = useState<string | null>(null)
  const navigate = useNavigate()
  const { isEnabled } = useFeatureFlags()

  const codesEnabled = isEnabled('onboarding.codes_v1')
  const joinEnabled = isEnabled('onboarding.join_v1')

  if (!joinEnabled) {
    return null
  }

  const handleJoinByCode = async () => {
    if (!familyCode.trim()) {
      setError('Please enter a family code')
      return
    }

    setIsLoading(true)
    setError(null)
    setErrorCode(null)
    setFamilyName(null)

    try {
      // Track join attempt
      await trackJoinStarted({
        join_method: 'code',
        family_id: undefined,
        invite_id: undefined
      })

      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        navigate('/login?redirect=onboarding')
        return
      }

      const response = await supabase.functions.invoke('join-by-code', {
        body: { code: familyCode.trim().toUpperCase() },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      })

      if (response.error) {
        throw response.error
      }

      const result = response.data

      if (result.error) {
        setError(result.error)
        setErrorCode(result.error_code)
        setFamilyName(result.family_name)
        return
      }

      // Success
      toast.success(`Successfully joined ${result.family.name}!`)
      if (onSuccess) {
        onSuccess()
      } else {
        navigate('/feed')
      }

    } catch (error: any) {
      console.error('Error joining by code:', error)
      setError(error.message || 'Failed to join family. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinByLink = async () => {
    if (!inviteLink.trim()) {
      setError('Please enter an invite link')
      return
    }

    setIsLoading(true)
    setError(null)
    setErrorCode(null)

    try {
      // Extract token from invite link
      const url = new URL(inviteLink)
      const token = url.searchParams.get('token') || url.pathname.split('/').pop()

      if (!token) {
        setError('Invalid invite link format')
        return
      }

      // Track join attempt
      await trackJoinStarted({
        join_method: 'invite',
        family_id: undefined,
        invite_id: token
      })

      // Validate the invite
      const { data: validation } = await supabase.functions.invoke('invite-validate', {
        body: { token }
      })

      if (validation.error) {
        setError('Invalid or expired invite link')
        return
      }

      // Navigate to invitation acceptance page
      navigate(`/invite/${token}`)

    } catch (error: any) {
      console.error('Error processing invite link:', error)
      setError('Invalid invite link. Please check the link and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestAccess = () => {
    navigate('/request-access')
  }

  const getErrorIcon = () => {
    switch (errorCode) {
      case 'RATE_LIMITED':
        return <Clock className="h-4 w-4" />
      case 'EXPIRED_CODE':
        return <AlertTriangle className="h-4 w-4" />
      case 'INVALID_CODE':
        return <Ban className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getErrorVariant = () => {
    switch (errorCode) {
      case 'RATE_LIMITED':
        return 'destructive'
      case 'EXPIRED_CODE':
      case 'INVALID_CODE':
        return 'default'
      default:
        return 'destructive'
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Join an Existing Family</CardTitle>
        <CardDescription>
          Join your family's LifeScribe space using an invite link or family code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={codesEnabled ? "code" : "link"} className="w-full">
          {codesEnabled && (
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Family Code
              </TabsTrigger>
              <TabsTrigger value="link" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Invite Link
              </TabsTrigger>
            </TabsList>
          )}

          {codesEnabled && (
            <TabsContent value="code" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="family-code">Family Code</Label>
                <Input
                  id="family-code"
                  placeholder="Enter 6-digit code (e.g., ABC123)"
                  value={familyCode}
                  onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="font-mono text-center text-lg tracking-wider"
                />
                <p className="text-sm text-muted-foreground">
                  Ask a family admin for the current family code
                </p>
              </div>

              <Button 
                onClick={handleJoinByCode} 
                className="w-full" 
                disabled={isLoading || !familyCode.trim()}
              >
                {isLoading ? 'Joining...' : 'Join Family'}
              </Button>
            </TabsContent>
          )}

          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-link">Invite Link</Label>
              <Input
                id="invite-link"
                placeholder="Paste your invite link here"
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                type="url"
              />
              <p className="text-sm text-muted-foreground">
                Paste the invite link you received via email or message
              </p>
            </div>

            <Button 
              onClick={handleJoinByLink} 
              className="w-full" 
              disabled={isLoading || !inviteLink.trim()}
            >
              {isLoading ? 'Processing...' : 'Join via Link'}
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant={getErrorVariant() as any}>
            {getErrorIcon()}
            <AlertDescription className="ml-2">
              {error}
              {familyName && (
                <div className="mt-2 text-sm">
                  Family: <span className="font-medium">{familyName}</span>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {error && (errorCode === 'INVALID_CODE' || errorCode === 'EXPIRED_CODE' || errorCode === 'CODE_EXHAUSTED') && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Don't have a valid code?
            </p>
            <Button 
              variant="outline" 
              onClick={handleRequestAccess}
              className="w-full"
            >
              Request Access Instead
            </Button>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an invite?{' '}
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/onboarding')}>
              Create your own family space
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}