import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  Crown, 
  Shield, 
  Eye, 
  Edit3, 
  Search,
  UserPlus,
  Settings,
  AlertTriangle
} from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  created_at: string
  last_sign_in_at?: string
  role: 'admin' | 'contributor' | 'viewer'
  family_id: string
  family_name: string
  status: 'active' | 'inactive' | 'suspended'
}

interface Family {
  id: string
  name: string
  member_count: number
  admin_count: number
  created_at: string
  status: 'active' | 'provisional' | 'merged'
}

export default function UserPermissionsDashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState('users')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  
  const { track } = useAnalytics()
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
    loadFamilies()
  }, [])

  const loadUsers = async () => {
    try {
      // Mock data for demonstration - replace with actual API calls
      const mockUsers: User[] = [
        {
          id: '1',
          full_name: 'John Doe',
          email: 'john@example.com',
          created_at: '2024-01-15T10:00:00Z',
          last_sign_in_at: '2024-01-20T15:30:00Z',
          role: 'admin',
          family_id: 'family-1',
          family_name: 'The Doe Family',
          status: 'active'
        },
        {
          id: '2',
          full_name: 'Jane Smith',
          email: 'jane@example.com',
          created_at: '2024-01-10T08:00:00Z',
          last_sign_in_at: '2024-01-19T12:15:00Z',
          role: 'contributor',
          family_id: 'family-2',
          family_name: 'Smith Family',
          status: 'active'
        },
        {
          id: '3',
          full_name: 'Mike Johnson',
          email: 'mike@example.com',
          created_at: '2024-01-05T14:30:00Z',
          role: 'viewer',
          family_id: 'family-1',
          family_name: 'The Doe Family',
          status: 'inactive'
        }
      ]
      setUsers(mockUsers)
    } catch (error) {
      console.error('Failed to load users:', error)
      toast({
        title: 'Error',
        description: 'Failed to load users. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const loadFamilies = async () => {
    try {
      // Mock data for demonstration
      const mockFamilies: Family[] = [
        {
          id: 'family-1',
          name: 'The Doe Family',
          member_count: 8,
          admin_count: 2,
          created_at: '2024-01-01T00:00:00Z',
          status: 'active'
        },
        {
          id: 'family-2',
          name: 'Smith Family',
          member_count: 5,
          admin_count: 1,
          created_at: '2024-01-10T00:00:00Z',
          status: 'active'
        },
        {
          id: 'family-3',
          name: 'Johnson Family',
          member_count: 3,
          admin_count: 0,
          created_at: '2024-01-05T00:00:00Z',
          status: 'provisional'
        }
      ]
      setFamilies(mockFamilies)
    } catch (error) {
      console.error('Failed to load families:', error)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />
      case 'contributor': return <Edit3 className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'default',
      contributor: 'secondary',
      viewer: 'outline'
    } as const
    
    return (
      <Badge variant={variants[role as keyof typeof variants] || 'outline'} className="gap-1">
        {getRoleIcon(role)}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive'
    } as const
    
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>
  }

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    setIsLoading(true)
    try {
      track('admin_action' as any)
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole as any } : user
      ))
      
      toast({
        title: 'Role Updated',
        description: `User role has been changed to ${newRole}.`,
      })
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuspendUser = async (userId: string) => {
    try {
      track('admin_action' as any)
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: 'suspended' } : user
      ))
      
      toast({
        title: 'User Suspended',
        description: 'The user has been suspended successfully.',
      })
      
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to suspend user. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const filteredUsers = users.filter(user => 
    !searchQuery || 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.family_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredFamilies = families.filter(family =>
    !searchQuery ||
    family.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and family permissions</p>
        </div>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users or families..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
          <TabsTrigger value="families">Families ({families.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Family: {user.family_name}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setSelectedUser(user)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manage User: {user.full_name}</DialogTitle>
                            <DialogDescription>
                              Update user role and permissions
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Role</label>
                              <Select 
                                defaultValue={user.role}
                                onValueChange={(value) => handleChangeUserRole(user.id, value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="viewer">Viewer - Can view content</SelectItem>
                                  <SelectItem value="contributor">Contributor - Can add stories</SelectItem>
                                  <SelectItem value="admin">Admin - Full management access</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <div className="text-sm">
                                <div className="font-medium">Account Status: {user.status}</div>
                                <div className="text-muted-foreground">
                                  {user.last_sign_in_at 
                                    ? `Last active: ${new Date(user.last_sign_in_at).toLocaleDateString()}`
                                    : 'Never signed in'
                                  }
                                </div>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            {user.status !== 'suspended' && (
                              <Button 
                                variant="destructive" 
                                onClick={() => handleSuspendUser(user.id)}
                              >
                                Suspend User
                              </Button>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="families" className="space-y-4">
          <div className="grid gap-4">
            {filteredFamilies.map((family) => (
              <Card key={family.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {family.name}
                        {family.status !== 'active' && (
                          <Badge variant="outline">{family.status}</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {family.member_count} members • {family.admin_count} admins
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(family.created_at).toLocaleDateString()}
                      </div>
                      {family.admin_count === 0 && (
                        <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                          <AlertTriangle className="h-3 w-3" />
                          No admin assigned
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        View Members
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}