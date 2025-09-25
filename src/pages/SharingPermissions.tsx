import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import EnhancedInviteModal from '@/components/invites/EnhancedInviteModal'
import InvitesManagementPanel from '@/components/invites/InvitesManagementPanel'
import ShareLinkGenerator from '@/components/sharing/ShareLinkGenerator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  UserPlus, 
  Settings, 
  Link2, 
  Shield, 
  Users,
  Mail,
  Eye,
  Edit
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Family {
  id: string
  name: string
  description?: string
}

interface UserRole {
  role: string
  permissions: any
}

export default function SharingPermissions() {
  const [family, setFamily] = useState<Family | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadFamilyData()
  }, [])

  const loadFamilyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's family and role
      const { data: memberData } = await supabase
        .from('members')
        .select(`
          role,
          families (
            id,
            name,
            description
          )
        `)
        .eq('profile_id', user.id)
        .single()

      if (memberData) {
        setFamily(memberData.families)
        
        // Get role permissions
        const { data: permissions } = await supabase.rpc('get_role_permissions', {
          user_role: memberData.role
        })
        
        setUserRole({
          role: memberData.role,
          permissions: permissions || {}
        })
      }
    } catch (error) {
      console.error('Error loading family data:', error)
      toast({
        title: "Error",
        description: "Failed to load family information",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />
      case 'contributor': return <Edit className="h-4 w-4" />
      case 'member': return <Edit className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
      case 'guest': return <Eye className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string): "default" | "secondary" | "outline" => {
    switch (role) {
      case 'admin': return 'default'
      case 'contributor': return 'secondary'
      case 'member': return 'secondary'
      case 'viewer': return 'outline'
      case 'guest': return 'outline'
      default: return 'outline'
    }
  }

  const canInvite = userRole?.permissions?.can_invite || false
  const canManageFamily = userRole?.permissions?.can_manage_family || false

  if (loading) {
    return (
      <AuthGate>
        <div className="min-h-screen">
          <Header />
          <div className="container mx-auto px-4 py-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AuthGate>
    )
  }

  if (!family) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <Card>
              <CardContent className="text-center py-8">
                <h3 className="text-lg font-medium mb-2">No Family Found</h3>
                <p className="text-muted-foreground">
                  You need to be a member of a family to manage sharing and permissions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGate>
    )
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Settings className="h-8 w-8" />
                  Sharing & Permissions
                </h1>
                <p className="text-muted-foreground mt-2 flex items-center gap-2">
                  Manage access to <strong>{family.name}</strong>
                  <Badge variant={getRoleColor(userRole?.role || '')} className="flex items-center gap-1">
                    {getRoleIcon(userRole?.role || '')}
                    Your role: {userRole?.role?.charAt(0).toUpperCase() + userRole?.role?.slice(1)}
                  </Badge>
                </p>
              </div>
              
              {canInvite && (
                <Button onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Invite
                </Button>
              )}
            </div>

            <Tabs defaultValue="members" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="members" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Members & Invites
                </TabsTrigger>
                <TabsTrigger value="sharing" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Share Links
                </TabsTrigger>
                <TabsTrigger value="permissions" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Permissions
                </TabsTrigger>
              </TabsList>

              {/* Members & Invites Tab */}
              <TabsContent value="members" className="space-y-6">
                <InvitesManagementPanel
                  familyId={family.id}
                  familyName={family.name}
                  onInviteRevoked={loadFamilyData}
                />
              </TabsContent>

              {/* Share Links Tab */}
              <TabsContent value="sharing" className="space-y-6">
                {canInvite ? (
                  <ShareLinkGenerator
                    familyId={family.id}
                    familyName={family.name}
                  />
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Permission Required</h3>
                      <p className="text-muted-foreground">
                        Only admins can generate share links. Contact a family admin to create invite links.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Permissions Tab */}
              <TabsContent value="permissions" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Your Permissions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {getRoleIcon(userRole?.role || '')}
                        Your Permissions
                      </CardTitle>
                      <CardDescription>
                        What you can do as a {userRole?.role}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {userRole?.permissions && Object.entries(userRole.permissions).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm capitalize">
                              {key.replace('can_', '').replace('_', ' ')}
                            </span>
                            <Badge variant={value ? 'default' : 'secondary'}>
                              {value ? 'Allowed' : 'Restricted'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Role Definitions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Role Definitions</CardTitle>
                      <CardDescription>
                        Understanding family roles and their capabilities
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Admin</h4>
                            <p className="text-sm text-muted-foreground">
                              Full control including inviting members and family management
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                          <Edit className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Contributor</h4>
                            <p className="text-sm text-muted-foreground">
                              Can create and share stories, upload media, and edit own content
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                          <Eye className="h-5 w-5 text-gray-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Viewer</h4>
                            <p className="text-sm text-muted-foreground">
                              Can view family content and add comments
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && family && (
          <EnhancedInviteModal
            familyId={family.id}
            familyName={family.name}
            onClose={() => setShowInviteModal(false)}
            onInviteSent={() => {
              setShowInviteModal(false)
              loadFamilyData() // Refresh data
            }}
          />
        )}
      </div>
    </AuthGate>
  )
}