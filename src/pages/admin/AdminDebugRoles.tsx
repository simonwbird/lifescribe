import { useState } from 'react'
import { useAuth } from '@/contexts/AuthProvider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Shield, Users, AlertCircle, UserPlus } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface MyRole {
  family_id: string
  family_name: string
  role: string
  joined_at: string
}

interface AllMember {
  id: string
  family_id: string
  profile_id: string
  role: string
  joined_at: string
  families: {
    name: string
  }
  profiles: {
    full_name: string | null
    settings: any
  }
}

export default function AdminDebugRoles() {
  const { user, profile, loading, isSuperAdmin } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedFamily, setSelectedFamily] = useState<string>('')
  const [selectedMember, setSelectedMember] = useState<string>('')

  const { data: myRoles, isLoading: rolesLoading } = useQuery<MyRole[]>({
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

  const { data: allMembers, isLoading: membersLoading } = useQuery<AllMember[]>({
    queryKey: ['all-members', selectedFamily],
    queryFn: async () => {
      const query = supabase
        .from('members')
        .select(`
          *,
          families:family_id (name),
          profiles:profile_id (full_name, settings)
        `)
        .order('joined_at', { ascending: false })

      if (selectedFamily) {
        query.eq('family_id', selectedFamily)
      }

      const { data, error } = await query
      
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id && isSuperAdmin
  })

  const promoteToAdminMutation = useMutation({
    mutationFn: async ({ memberId, familyId }: { memberId: string; familyId: string }) => {
      const { error } = await supabase
        .from('members')
        .update({ role: 'admin' })
        .eq('id', memberId)
        .eq('family_id', familyId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-members'] })
      queryClient.invalidateQueries({ queryKey: ['my-roles'] })
      toast({
        title: 'Success',
        description: 'Member promoted to admin',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
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
        <h1 className="text-3xl font-bold mb-2">Admin Role Diagnostics</h1>
        <p className="text-muted-foreground">
          QA tools for managing and verifying admin roles
        </p>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Roles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
            <span className="font-medium">System Role:</span>
            <Badge variant={isSuperAdmin ? 'destructive' : 'default'}>
              {isSuperAdmin ? 'super_admin' : 'member'}
            </Badge>
          </div>

          {myRoles && myRoles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Family Memberships:</h4>
              {myRoles.map((role) => (
                <div key={role.family_id} className="flex items-center justify-between border rounded p-2">
                  <span className="text-sm">{role.family_name}</span>
                  <Badge variant={role.role === 'admin' ? 'default' : 'secondary'}>
                    {role.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Super Admin Tools */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Promote Member to Admin (Super Admin Only)
            </CardTitle>
            <CardDescription>
              Select a family and member to promote to admin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Filter by Family</Label>
              <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                <SelectTrigger>
                  <SelectValue placeholder="All families" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All families</SelectItem>
                  {myRoles?.map((role) => (
                    <SelectItem key={role.family_id} value={role.family_id}>
                      {role.family_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {membersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>All Members</Label>
                <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                  {allMembers?.map((member) => (
                    <div key={member.id} className="p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {member.profiles?.full_name || 'Unnamed User'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.families?.name}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {member.profile_id}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                          {member.role}
                        </Badge>
                        {member.role !== 'admin' && (
                          <Button
                            size="sm"
                            onClick={() => promoteToAdminMutation.mutate({
                              memberId: member.id,
                              familyId: member.family_id
                            })}
                            disabled={promoteToAdminMutation.isPending}
                          >
                            {promoteToAdminMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              'Promote'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>QA Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">For Regular Users:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Check your family memberships above</li>
              <li>Verify your role matches expectations (admin or member)</li>
              <li>If you should be an admin but aren't, contact a super admin</li>
            </ul>
          </div>
          {isSuperAdmin && (
            <div>
              <h4 className="font-medium mb-2">For Super Admins:</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Use the "Promote Member" tool to grant admin rights</li>
                <li>Filter by family to find specific members</li>
                <li>Only promote trusted users to admin</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
