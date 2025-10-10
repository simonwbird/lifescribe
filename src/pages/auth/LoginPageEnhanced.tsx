import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthProvider'
import { useAuthErrors } from '@/hooks/useAuthErrors'
import { useAuthTimeout } from '@/hooks/useAuthTimeout'
import { signInWithPassword, signInWithGoogle } from '@/services/authService'
import Captcha from '@/components/ui/captcha'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPageEnhanced() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { handleError } = useAuthErrors()
  const { executeWithTimeout, cancel, cleanup } = useAuthTimeout()
  
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [requiresCaptcha, setRequiresCaptcha] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [lockoutInfo, setLockoutInfo] = useState<{
    locked_until?: string
    attempts_remaining?: number
  } | null>(null)

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const next = searchParams.get('next')
      navigate(next || '/home', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate, searchParams])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  const onSubmit = async (data: LoginFormData) => {
    if (isLoading) return
    
    // Check if captcha is required but not provided
    if (requiresCaptcha && !captchaToken) {
      form.setError('root', {
        message: 'Please complete the security verification.'
      })
      return
    }

    setIsLoading(true)
    
    try {
      const result = await executeWithTimeout(
        async (signal) => {
          return await signInWithPassword({
            email: data.email,
            password: data.password,
            captchaToken: captchaToken || undefined
          }, signal)
        },
        {
          timeout: 10000, // 10 second timeout
          onTimeout: () => {
            form.setError('root', {
              message: 'Login request timed out. Please try again.'
            })
          }
        }
      )

      if (result.error) {
        // Handle rate limiting and captcha requirements
        if (result.rateLimitInfo) {
          setLockoutInfo({
            locked_until: result.rateLimitInfo.locked_until,
            attempts_remaining: result.rateLimitInfo.attempts_remaining
          })
          
          if (result.rateLimitInfo.requires_captcha) {
            setRequiresCaptcha(true)
          }
        }

        // Show specific error message
        if (result.error.code === 'AUTH/CAPTCHA_REQUIRED') {
          setRequiresCaptcha(true)
          form.setError('root', {
            message: result.error.message
          })
        } else if (result.error.code === 'AUTH/RATE_LIMITED') {
          form.setError('root', {
            message: result.error.message
          })
        } else {
          handleError(result.error)
          form.setError('root', {
            message: result.error.message
          })
        }
      } else {
        // Success - clear any previous captcha requirements
        setRequiresCaptcha(false)
        setCaptchaToken(null)
        setLockoutInfo(null)
        
        // Navigation is handled by the auth state change
      }
    } catch (error) {
      console.error('Login error:', error)
      form.setError('root', {
        message: 'An unexpected error occurred. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token)
    setRequiresCaptcha(false)
    
    // Clear any captcha-related errors
    form.clearErrors('root')
  }

  const handleCaptchaError = (error: string) => {
    setCaptchaToken(null)
    form.setError('root', { message: error })
  }

  const handleCancel = () => {
    cancel()
    setIsLoading(false)
  }

  const handleGoogleSignIn = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    const result = await signInWithGoogle()
    
    if (result.error) {
      handleError(result.error)
      form.setError('root', {
        message: result.error.message
      })
      setIsLoading(false)
    }
    // If successful, user will be redirected by Google OAuth flow
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your LifeScribe account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {form.formState.errors.root && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {form.formState.errors.root.message}
                    </AlertDescription>
                  </Alert>
                )}

                {lockoutInfo?.locked_until && (
                  <Alert>
                    <AlertDescription>
                      Account temporarily locked until{' '}
                      {new Date(lockoutInfo.locked_until).toLocaleString()}
                    </AlertDescription>
                  </Alert>
                )}

                {lockoutInfo?.attempts_remaining && !requiresCaptcha && (
                  <Alert>
                    <AlertDescription>
                      {lockoutInfo.attempts_remaining} attempts remaining before security verification is required.
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            disabled={isLoading}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {requiresCaptcha && (
                  <div className="space-y-2">
                    <Captcha
                      onVerify={handleCaptchaVerify}
                      onError={handleCaptchaError}
                      loading={isLoading}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Link
                    to="/auth/reset/request"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="flex gap-2">
                  {isLoading && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={isLoading || (requiresCaptcha && !captchaToken)}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/auth/signup" className="text-primary hover:underline">
                  Create one here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}