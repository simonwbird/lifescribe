import { useAuth } from '@/contexts/AuthProvider'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Shield, Users, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface MyRole {
  family_id: string
  family_name: string
  role: string
  joined_at: string
}

export default function ProfileDebug() {
  const { user, profile, loading } = useAuth()

  const { data: roles, isLoading: rolesLoading, error } = useQuery<MyRole[]>({
    queryKey: ['my-roles', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_my_roles')
        .select('*')
      
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id
  })

  if (loading || rolesLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in to view this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Role Diagnostics</h1>
        <p className="text-muted-foreground">
          Debug information for QA testing - verify your family memberships and roles
        </p>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Current User
          </CardTitle>
          <CardDescription>
            Your authentication details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
            <span className="font-medium">User ID:</span>
            <code className="bg-muted px-2 py-1 rounded">{user.id}</code>
            
            <span className="font-medium">Email:</span>
            <span>{user.email}</span>
            
            <span className="font-medium">System Role:</span>
            <Badge variant={profile?.settings?.role === 'super_admin' ? 'destructive' : 'default'}>
              {profile?.settings?.role || 'member'}
            </Badge>
            
            {profile?.settings?.bootstrap_admin && (
              <>
                <span className="font-medium">Bootstrap Admin:</span>
                <Badge variant="outline">Yes</Badge>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Family Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Family Memberships
          </CardTitle>
          <CardDescription>
            Families you belong to and your role in each
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error loading roles: {error.message}
              </AlertDescription>
            </Alert>
          ) : !roles || roles.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You are not a member of any families yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {roles.map((role) => (
                <div
                  key={role.family_id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{role.family_name}</h3>
                    <Badge variant={role.role === 'admin' ? 'default' : 'secondary'}>
                      {role.role}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-2 text-sm text-muted-foreground">
                    <span>Family ID:</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {role.family_id}
                    </code>
                    
                    <span>Joined:</span>
                    <span>{new Date(role.joined_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw Data */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data (JSON)</CardTitle>
          <CardDescription>
            For debugging - copy this if reporting issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
            {JSON.stringify(
              {
                user: {
                  id: user.id,
                  email: user.email,
                },
                profile: profile,
                roles: roles,
              },
              null,
              2
            )}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
