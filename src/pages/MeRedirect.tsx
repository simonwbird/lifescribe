import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthProvider'
import { supabase } from '@/lib/supabase'
import { getCurrentSpaceId } from '@/lib/spaceUtils'

export default function MeRedirect() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      navigate('/auth/login', { replace: true })
      return
    }

    const go = async () => {
      const spaceId = await getCurrentSpaceId()
      if (!spaceId) {
        navigate('/home', { replace: true })
        return
      }

      const { data: link } = await supabase
        .from('person_user_links')
        .select('person_id')
        .eq('user_id', user.id)
        .eq('family_id', spaceId)
        .maybeSingle()

      if (link?.person_id) {
        navigate(`/people/${link.person_id}`, { replace: true })
      } else {
        navigate('/home', { replace: true })
      }
    }

    void go()
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
