/**
 * Phase 6: Admin Bootstrap Status Component
 * Shows current admin status and first-user bootstrap info
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSecureRoles } from '@/hooks/useSecureRoles'
import { Shield, Crown, Users, AlertCircle } from 'lucide-react'

export function AdminBootstrapStatus() {
  const { data: roles, isLoading } = useSecureRoles()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 animate-pulse" />
            <span>Loading admin status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!roles) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center justify-center p-6">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Unable to load admin status</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Admin Status</span>
        </CardTitle>
        <CardDescription>
          Database-verified role information (secure, cannot be manipulated)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System Role */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="h-4 w-4" />
            <span className="font-medium">System Role:</span>
          </div>
          <Badge variant={roles.systemRole === 'super_admin' ? 'default' : 'secondary'}>
            {roles.systemRole === 'super_admin' ? 'Super Admin' : 'Regular User'}
          </Badge>
        </div>

        {/* Bootstrap Admin Status */}
        {roles.isBootstrapAdmin && (
          <div className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
            <div className="flex items-center space-x-2">
              <Crown className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-800 dark:text-amber-200">
                Bootstrap Admin
              </span>
            </div>
            <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300">
              First User
            </Badge>
          </div>
        )}

        {/* Family Roles */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Users className="h-4 w-4" />
            <span className="font-medium">Family Roles:</span>
          </div>
          {roles.familyRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground ml-6">No family memberships</p>
          ) : (
            <div className="space-y-2 ml-6">
              {roles.familyRoles.map(role => (
                <div key={role.familyId} className="flex items-center justify-between">
                  <span className="text-sm">{role.familyName}</span>
                  <Badge variant={role.role === 'admin' ? 'default' : 'secondary'}>
                    {role.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground">
            🔒 All role information is verified against the database and cannot be manipulated 
            from the client. Admin privileges are assigned server-side only.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}