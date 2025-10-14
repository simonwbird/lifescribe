import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { routes } from '@/lib/routes'
import { useAuth } from '@/contexts/AuthProvider'

export default function MeRedirect() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      navigate('/auth/login', { replace: true })
      return
    }

    // For now, redirect to timeline - we'll update this once we have the person record
    // The person record will be fetched via a custom hook or server action
    navigate(routes.meTimeline(), { replace: true })
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
