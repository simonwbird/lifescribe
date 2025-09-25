/**
 * Phase 6: Secure role-based access control
 * Guards components based on database-verified roles only
 */

import React from 'react'
import { useSecureRoles } from '@/hooks/useSecureRoles'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Lock, AlertTriangle } from 'lucide-react'

interface SecureRoleGuardProps {
  children: React.ReactNode
  requiredRole?: 'super_admin' | 'family_admin'
  familyId?: string
  fallback?: React.ReactNode
  showLoading?: boolean
}

/**
 * Secure role guard that only trusts database-verified roles
 * Cannot be bypassed by client-side manipulation
 */
export function SecureRoleGuard({ 
  children, 
  requiredRole, 
  familyId, 
  fallback,
  showLoading = true 
}: SecureRoleGuardProps) {
  const { data: roles, isLoading, error } = useSecureRoles()

  // Show loading state
  if (isLoading && showLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 animate-pulse" />
            <span>Verifying permissions...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show error state
  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto border-destructive">
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>Unable to verify permissions</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Check permissions
  const hasAccess = checkAccess(roles, requiredRole, familyId)

  if (!hasAccess) {
    return fallback || (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Access denied</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}

function checkAccess(
  roles: any,
  requiredRole?: string,
  familyId?: string
): boolean {
  if (!roles) return false

  switch (requiredRole) {
    case 'super_admin':
      return roles.systemRole === 'super_admin'
    
    case 'family_admin':
      if (!familyId) return false
      return roles.familyRoles.some(
        (role: any) => role.familyId === familyId && role.role === 'admin'
      ) || roles.systemRole === 'super_admin'
    
    default:
      // If no specific role required, just need to be authenticated
      return true
  }
}

/**
 * Component to display current user's roles (for debugging/admin interface)
 */
export function RoleDebugDisplay() {
  const { data: roles, isLoading } = useSecureRoles()

  if (isLoading || !roles) return null

  return (
    <Card className="w-full max-w-md mx-auto bg-muted/50">
      <CardContent className="p-4">
        <h4 className="text-sm font-medium mb-2">Current Roles (DB Verified)</h4>
        <div className="space-y-1 text-xs">
          <div>System: {roles.systemRole || 'member'}</div>
          {roles.isBootstrapAdmin && (
            <div className="text-amber-600">⚡ Bootstrap Admin</div>
          )}
          {roles.familyRoles.length > 0 && (
            <div>
              Family Roles:
              {roles.familyRoles.map(role => (
                <div key={role.familyId} className="ml-2">
                  {role.familyName}: {role.role}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}