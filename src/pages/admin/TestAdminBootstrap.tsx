/**
 * Phase 6: Test page for admin bootstrap functionality
 * Demonstrates secure role checking and first-user admin setup
 */

import React from 'react'
import { SecureRoleGuard, RoleDebugDisplay } from '@/components/admin/SecureRoleGuard'
import { AdminBootstrapStatus } from '@/components/admin/AdminBootstrapStatus'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSecureRoles, useIsSuperAdmin, useInvalidateRoles } from '@/hooks/useSecureRoles'
import { useAuth } from '@/contexts/AuthProvider'
import { Shield, RefreshCw, UserCheck, Lock } from 'lucide-react'
import { toast } from 'sonner'

export default function TestAdminBootstrap() {
  const { user } = useAuth()
  const { data: roles, isLoading, refetch } = useSecureRoles()
  const isSuperAdmin = useIsSuperAdmin()
  const invalidateRoles = useInvalidateRoles()

  const handleRefreshRoles = async () => {
    toast.info('Refreshing role data from database...')
    await refetch()
    invalidateRoles()
    toast.success('Role data refreshed')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Phase 6: Admin Bootstrap Test</h1>
        <p className="text-muted-foreground">
          Test the secure database-side admin role management system. 
          The first confirmed user should automatically become a super admin.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>Current User</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Email:</strong> {user?.email || 'Not authenticated'}</div>
              <div><strong>ID:</strong> {user?.id || 'N/A'}</div>
              <div><strong>Email Confirmed:</strong> {user?.email_confirmed_at ? 'Yes' : 'No'}</div>
            </div>
            <Button 
              onClick={handleRefreshRoles} 
              className="mt-4" 
              variant="outline"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Role Data
            </Button>
          </CardContent>
        </Card>

        {/* Admin Bootstrap Status */}
        <AdminBootstrapStatus />

        {/* Role Debug Display */}
        <RoleDebugDisplay />

        {/* Super Admin Only Section */}
        <SecureRoleGuard requiredRole="super_admin">
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                <Shield className="h-5 w-5" />
                <span>Super Admin Only Area</span>
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                This content is only visible to verified super administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-green-800 dark:text-green-200">
                ✅ Access granted! You have super admin privileges verified from the database.
              </p>
              <div className="mt-4 space-y-2">
                <div className="text-sm">
                  <strong>Bootstrap Status:</strong> {roles?.isBootstrapAdmin ? 'Yes (First User)' : 'No'}
                </div>
                <div className="text-sm">
                  <strong>System Role:</strong> {roles?.systemRole}
                </div>
              </div>
            </CardContent>
          </Card>
        </SecureRoleGuard>

        {/* Testing Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Guidelines</CardTitle>
            <CardDescription>How to test the admin bootstrap system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">✅ Acceptance Tests:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>First confirmed account becomes admin exactly once</li>
                <li>Later users never get automatic admin privileges</li>
                <li>Attempting to change roles from client fails under RLS</li>
                <li>All role checks come from database, never client storage</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">🧪 How to Test:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-4">
                <li>Sign up as a new user and confirm email</li>
                <li>Check if you see the "Super Admin Only Area" above</li>
                <li>Verify "Bootstrap Admin" status in role display</li>
                <li>Sign up additional users - they should NOT get admin access</li>
                <li>Try to manipulate localStorage or session data - should have no effect</li>
              </ol>
            </div>

            <div className="p-4 bg-muted/50 rounded-md">
              <div className="flex items-start space-x-2">
                <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Security Note:</p>
                  <p className="text-xs text-muted-foreground">
                    All role verification happens server-side. Client-side manipulation cannot 
                    escalate privileges. Admin status is permanently recorded in the database 
                    with audit logging.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}