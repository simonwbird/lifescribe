import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { CheckCircle, XCircle, Loader2, Mail, RefreshCw } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthProvider'
import { useAuthErrors } from '@/hooks/useAuthErrors'
import { useToast } from '@/hooks/use-toast'

const resendSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

type ResendFormData = z.infer<typeof resendSchema>

export default function Verify() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { session, user, refreshProfile } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unverified'>('loading')
  const [isResending, setIsResending] = useState(false)
  const [lastResendTime, setLastResendTime] = useState<number | null>(null)
  const [pollCount, setPollCount] = useState(0)
  const { handleErrorWithFallback } = useAuthErrors()
  const { toast } = useToast()

  const form = useForm<ResendFormData>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      email: location.state?.email || ''
    }
  })

  // Check if we're coming from email link verification
  useEffect(() => {
    const token = searchParams.get('token')
    const type = searchParams.get('type')

    if (token && type === 'email') {
      // Handle email link verification
      const verifyEmail = async () => {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          })

          if (error) {
            handleErrorWithFallback(error, 'Email verification failed')
            setStatus('error')
          } else {
            setStatus('success')
            await refreshProfile()
            setTimeout(() => navigate('/home'), 2000)
          }
        } catch (error) {
          handleErrorWithFallback(error, 'Email verification failed')
          setStatus('error')
        }
      }
      verifyEmail()
    } else if (user && !user.email_confirmed_at) {
      // User is logged in but email not verified
      setStatus('unverified')
      form.setValue('email', user.email || '')
    } else if (user && user.email_confirmed_at) {
      // User is already verified
      navigate('/home')
    } else {
      // No token and no user - show error
      setStatus('error')
    }
  }, [searchParams, navigate, handleErrorWithFallback, user, refreshProfile, form])

  // Polling for verification status
  useEffect(() => {
    if (status === 'unverified' && pollCount < 20) {
      const pollInterval = setInterval(async () => {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession()
          if (currentSession?.user?.email_confirmed_at) {
            setStatus('success')
            await refreshProfile()
            setTimeout(() => navigate('/home'), 1000)
            clearInterval(pollInterval)
          } else {
            setPollCount(prev => prev + 1)
          }
        } catch (error) {
          console.error('Error polling verification status:', error)
        }
      }, 3000) // Poll every 3 seconds

      return () => clearInterval(pollInterval)
    }
  }, [status, pollCount, navigate, refreshProfile])

  const canResend = !lastResendTime || Date.now() - lastResendTime > 60000 // 1 minute cooldown

  const resendVerification = async (data: ResendFormData) => {
    if (!canResend) {
      toast({
        title: 'Please wait',
        description: 'You can resend verification in a few moments.',
        variant: 'destructive'
      })
      return
    }

    setIsResending(true)
    try {
      const response = await fetch('https://imgtnixyralpdrmedwzi.supabase.co/functions/v1/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          email: data.email,
          redirectTo: `${window.location.origin}/auth/verify`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send verification email')
      }

      setLastResendTime(Date.now())
      toast({
        title: 'Verification email sent',
        description: 'Please check your email for the verification link.'
      })
    } catch (error) {
      handleErrorWithFallback(error, 'Failed to resend verification email')
    } finally {
      setIsResending(false)
    }
  }

  const checkVerificationStatus = async () => {
    try {
      await supabase.auth.refreshSession()
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      
      if (currentSession?.user?.email_confirmed_at) {
        setStatus('success')
        await refreshProfile()
        setTimeout(() => navigate('/home'), 1000)
      } else {
        toast({
          title: 'Not verified yet',
          description: 'Please check your email and click the verification link.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      handleErrorWithFallback(error, 'Failed to check verification status')
    }
  }

  if (status === 'unverified') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Verify Your Email</CardTitle>
            <CardDescription>
              We've sent a verification email to your address. Please check your email and click the verification link, or resend if needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(resendVerification)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                          disabled
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isResending || !canResend}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      {canResend ? 'Resend Verification Email' : 'Wait to Resend'}
                    </>
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={checkVerificationStatus}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                I've Verified - Check Status
              </Button>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Didn't receive the email? Check your spam folder or try resending.</p>
              {!canResend && (
                <p className="mt-2">You can resend in {Math.ceil((60000 - (Date.now() - (lastResendTime || 0))) / 1000)} seconds</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            {status === 'loading' && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
            {status === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
            {status === 'error' && <XCircle className="w-6 h-6 text-destructive" />}
          </div>
          <CardTitle className="text-xl">
            {status === 'loading' && 'Verifying Email'}
            {status === 'success' && 'Email Verified'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your email address...'}
            {status === 'success' && 'Your email has been successfully verified. Redirecting you to the app...'}
            {status === 'error' && 'We were unable to verify your email address. The link may be expired or invalid.'}
          </CardDescription>
        </CardHeader>
        {status === 'error' && (
          <CardContent className="text-center space-y-4">
            <Button onClick={() => navigate('/auth/login')} className="w-full">
              Back to Login
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setStatus('unverified')} 
              className="w-full"
            >
              Resend Verification Email
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}