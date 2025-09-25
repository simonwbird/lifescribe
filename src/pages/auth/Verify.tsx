import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useAuthErrors } from '@/hooks/useAuthErrors'

export default function Verify() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const { handleErrorWithFallback } = useAuthErrors()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        if (!token || type !== 'email') {
          setStatus('error')
          return
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        })

        if (error) {
          handleErrorWithFallback(error, 'Email verification failed')
          setStatus('error')
        } else {
          setStatus('success')
          // Redirect to home after successful verification
          setTimeout(() => navigate('/home'), 2000)
        }
      } catch (error) {
        handleErrorWithFallback(error, 'Email verification failed')
        setStatus('error')
      }
    }

    verifyEmail()
  }, [searchParams, navigate, handleErrorWithFallback])

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
          <CardContent className="text-center">
            <Button onClick={() => navigate('/auth/login')} className="w-full">
              Back to Login
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}