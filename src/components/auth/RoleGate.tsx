import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface RoleGateProps {
  children: React.ReactNode
  role: string
  fallback?: React.ReactNode
}

export default function RoleGate({ children, role, fallback }: RoleGateProps) {
  const { roles, loading, rolesLoading, profileLoading, isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  // Show loading while roles/profile are being fetched
  if (loading || rolesLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Check if user has the required role
  // For "admin" role, also check super_admin status
  const hasRole = role === 'admin' 
    ? (isSuperAdmin || roles.some(userRole => userRole.role === role))
    : roles.some(userRole => userRole.role === role)

  if (!hasRole) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page. 
              {role && ` This page requires ${role} privileges.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}