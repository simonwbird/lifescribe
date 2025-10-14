import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthProvider'

export default function MeRedirect() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      navigate('/auth/login', { replace: true })
      return
    }

    // Redirect directly to the current user's LifePage (person page)
    navigate(`/people/${user.id}`, { replace: true })
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
