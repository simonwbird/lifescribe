import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Mail, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'
import ModeSelection from '@/components/ModeSelection'

export default function InviteLanding() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { track } = useAnalytics()
  
  const [step, setStep] = useState<'loading' | 'auth' | 'mode' | 'complete'>('loading')
  const [invite, setInvite] = useState<any>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (token) {
      validateInvite()
    }
  }, [token])

  const validateInvite = async () => {
    try {
      const { data: inviteData, error } = await supabase
        .from('invites')
        .select(`
          *,
          families:family_id (name)
        `)
        .eq('token', token)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !inviteData) {
        setError('Invalid or expired invitation link')
        return
      }

      setInvite(inviteData)
      // Clear placeholder invite-link email if present
      const isPlaceholder = typeof inviteData.email === 'string' && inviteData.email.endsWith('@lifescribe.local')
      setEmail(isPlaceholder ? '' : inviteData.email)
      
      // Check if user already exists
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // User is already logged in, proceed to join family
        await joinFamily(user.id)
      } else {
        setStep('auth')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/invite/${token}`,
            data: {
              full_name: fullName,
            }
          }
        })

        if (error) throw error

        if (data.user) {
          // Create profile
          await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: data.user.email!,
              full_name: fullName,
            })

          await joinFamily(data.user.id)
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        if (data.user) {
          await joinFamily(data.user.id)
        }
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const joinFamily = async (userId: string) => {
    try {
      // Add user as member
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          family_id: invite.family_id,
          profile_id: userId,
          role: invite.role,
        })

      if (memberError) throw memberError

      // Mark invite as accepted
      await supabase
        .from('invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite.id)

      // Track analytics event
      track('invite_accepted', {
        familyId: invite.family_id,
        inviteId: invite.id,
        role: invite.role
      })

      toast({
        title: "Welcome!",
        description: `You've joined ${invite.families.name}`,
      })

      setStep('mode')
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleModeSelected = (mode: 'simple' | 'studio') => {
    // Update user settings with selected mode
    supabase
      .from('profiles')
      .update({
        settings: { mode, labs_enabled: mode === 'studio' }
      })
      .eq('id', (supabase.auth as any).user?.id)
      .then(() => {
        // Navigate to home with voice focus
        navigate('/home?focus=voice')
      })
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (step === 'mode') {
    return <ModeSelection onModeSelected={handleModeSelected} familyName={invite?.families?.name} />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Go to LifeScribe
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle>Join {invite?.families?.name}</CardTitle>
          <CardDescription>
            You've been invited to join this family space on LifeScribe
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={true}
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "Create a password" : "Enter your password"}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              <Mail className="w-4 h-4 mr-2" />
              {loading ? 'Processing...' : isSignUp ? 'Join Family' : 'Sign In & Join'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}