import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import Landing from './Landing'

const Index = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setIsAuthenticated(true)
        // Check if user has completed onboarding
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          // Check if user is part of a family
          const { data: member } = await (supabase as any)
            .from('members')
            .select('*')
            .eq('profile_id', session.user.id)
            .single()
          
          if (member) {
            navigate('/home')
          } else {
            navigate('/onboarding')
          }
        } else {
          navigate('/onboarding')
        }
      } else {
        setIsAuthenticated(false)
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [navigate])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  if (!isAuthenticated) {
    return <Landing />
  }

  // This should not render as authenticated users are redirected
  return null
}

export default Index;
