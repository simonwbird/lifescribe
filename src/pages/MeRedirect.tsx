import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'

export default function MeRedirect() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      navigate('/auth/login', { replace: true })
      return
    }

    // Fetch the person record for the current user
    supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then((response: any) => {
        if (response?.data?.id) {
          navigate(`/people/${response.data.id}`, { replace: true })
        } else {
          navigate('/home', { replace: true })
        }
      })
      .catch((error: any) => {
        console.error('Error redirecting to person page:', error)
        navigate('/home', { replace: true })
      })
  }, [user, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading your LifePage…</p>
      </div>
    </div>
  )
}
