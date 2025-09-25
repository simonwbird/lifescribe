import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { CheckCircle, XCircle } from 'lucide-react'
import { updatePassword } from '@/services/auth'
import { useAuthErrors } from '@/hooks/useAuthErrors'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

const resetConfirmSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

type ResetConfirmFormData = z.infer<typeof resetConfirmSchema>

export default function ResetConfirm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const { handleError } = useAuthErrors()
  const { toast } = useToast()

  const form = useForm<ResetConfirmFormData>({
    resolver: zodResolver(resetConfirmSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  })

  useEffect(() => {
    const verifyResetToken = async () => {
      const token = searchParams.get('token')
      const type = searchParams.get('type')

      if (!token || type !== 'recovery') {
        setIsValid(false)
        return
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery'
        })

        setIsValid(!error)
      } catch (error) {
        setIsValid(false)
      }
    }

    verifyResetToken()
  }, [searchParams])

  const onSubmit = async (data: ResetConfirmFormData) => {
    setIsLoading(true)
    try {
      const { error } = await updatePassword(data.password)
      
      if (error) {
        handleError(error)
      } else {
        toast({
          title: 'Password updated',
          description: 'Your password has been successfully updated. You can now sign in with your new password.'
        })
        navigate('/auth/login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Reset links are only valid for 1 hour after being sent.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <Button onClick={() => navigate('/auth/reset/request')} className="w-full">
              Request New Reset Link
            </Button>
            <Button variant="outline" onClick={() => navigate('/auth/login')} className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Set New Password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter new password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}