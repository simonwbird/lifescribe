import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const Index = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          // Check if user is part of a family
          const { data: member } = await supabase
            .from('members')
            .select('*')
            .eq('profile_id', session.user.id)
            .single()
          
          if (member) {
            navigate('/feed')
          } else {
            navigate('/onboarding')
          }
        } else {
          navigate('/onboarding')
        }
      } else {
        navigate('/login')
      }
    }
    
    checkAuth()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

export default Index;
