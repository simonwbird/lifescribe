import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { AdminRole } from '@/lib/adminTypes'
import { useAnalytics } from '@/hooks/useAnalytics'

interface AdminAuthGuardProps {
  children: React.ReactNode
  requiredRole?: AdminRole
}

// Mock admin check - in real app, this would check user's admin status
const checkAdminRole = async (userId: string): Promise<AdminRole | null> => {
  // For now, return SUPER_ADMIN for demo purposes
  // In production, this would query an admin_users table or similar
  return 'SUPER_ADMIN'
}

export default function AdminAuthGuard({ children, requiredRole }: AdminAuthGuardProps) {
  const [userRole, setUserRole] = useState<AdminRole | null>(null)
  const [loading, setLoading] = useState(true)
  const { track } = useAnalytics()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setUserRole(null)
          setLoading(false)
          return
        }

        const role = await checkAdminRole(user.id)
        setUserRole(role)
        
        if (role) {
          track('ADMIN_ROUTE_ACCESSED' as any, { 
            requiredRole,
            userRole: role,
            path: window.location.pathname
          })
        }
      } catch (error) {
        console.error('Admin auth check failed:', error)
        setUserRole(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [requiredRole, track])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!userRole) {
    return <Navigate to="/" replace />
  }

  // Role hierarchy check
  const roleHierarchy: Record<AdminRole, number> = {
    SUPER_ADMIN: 3,
    ORG_ADMIN: 2,
    FAMILY_ADMIN: 1
  }

  if (requiredRole && roleHierarchy[userRole] < roleHierarchy[requiredRole]) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}