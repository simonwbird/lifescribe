import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          toast({
            title: "Authentication Error",
            description: "Failed to complete sign-in. Please try again.",
            variant: "destructive"
          })
          navigate('/login')
          return
        }

        if (!session?.user) {
          console.log('No session found, redirecting to login')
          navigate('/login')
          return
        }

        const user = session.user

        // Check if profile exists
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile check error:', profileError)
        }

        // Create or update profile for Google users
        if (!existingProfile) {
          const profileData = {
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          const { error: insertError } = await supabase
            .from('profiles')
            .insert(profileData)

          if (insertError) {
            console.error('Profile creation error:', insertError)
            // Don't block login for profile creation failures
            toast({
              title: "Profile Warning",
              description: "Profile created with limited data. You can update it later.",
              variant: "default"
            })
          }
        } else {
          // Update avatar and name if missing from Google data
          const updateData: any = {}
          
          if (!existingProfile.avatar_url && user.user_metadata?.avatar_url) {
            updateData.avatar_url = user.user_metadata.avatar_url
          }
          
          if (!existingProfile.full_name && user.user_metadata?.full_name) {
            updateData.full_name = user.user_metadata.full_name
          }

          if (Object.keys(updateData).length > 0) {
            updateData.updated_at = new Date().toISOString()
            
            const { error: updateError } = await supabase
              .from('profiles')
              .update(updateData)
              .eq('id', user.id)

            if (updateError) {
              console.error('Profile update error:', updateError)
            }
          }
        }

        // Check if user is part of a family
        const { data: member } = await supabase
          .from('members')
          .select('*')
          .eq('profile_id', user.id)
          .single()

        // Navigate based on family membership
        if (member) {
          navigate('/home')
        } else {
          navigate('/onboarding')
        }

        toast({
          title: "Welcome back!",
          description: "You've been successfully signed in.",
          variant: "default"
        })

      } catch (error: any) {
        console.error('Auth callback error:', error)
        toast({
          title: "Authentication Error", 
          description: "Something went wrong during sign-in. Please try again.",
          variant: "destructive"
        })
        navigate('/login')
      } finally {
        setIsProcessing(false)
      }
    }

    handleAuthCallback()
  }, [navigate, toast])

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <h2 className="text-lg font-semibold">Completing sign-in...</h2>
          <p className="text-muted-foreground">Please wait while we set up your account.</p>
        </div>
      </div>
    )
  }

  return null
}