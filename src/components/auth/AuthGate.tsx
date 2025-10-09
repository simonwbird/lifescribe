import { useEffect, useState } from 'react'
import { useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthProvider'

interface AuthGateProps {
  children: React.ReactNode
}

export default function AuthGate({ children }: AuthGateProps) {
  const { session, loading, isAuthenticated } = useAuth()
  const location = useLocation()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (!loading) {
      // Small delay to prevent flicker
      const timer = setTimeout(() => setShowContent(true), 50)
      return () => clearTimeout(timer)
    }
  }, [loading])

  // Show loading spinner while checking auth
  if (loading || !showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Preparing your workspace…</p>
        </div>
      </div>
    )
  }

  // Redirect to login with next parameter if not authenticated
  if (!session || !isAuthenticated) {
    const nextUrl = location.pathname + location.search
    return <Navigate to={`/auth/login?next=${encodeURIComponent(nextUrl)}`} replace />
  }

  return <>{children}</>
}