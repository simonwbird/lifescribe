import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  MoreHorizontal, 
  Shield, 
  UserCheck, 
  Bug, 
  Crown,
  Users,
  Mail,
  Calendar,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  avatar_url?: string;
  settings?: any; // Using any to handle JSON type from Supabase
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  phone_confirmed_at?: string;
}

const USER_ROLES = [
  { value: 'user', label: 'Regular User', icon: Users, color: 'bg-gray-100 text-gray-800' },
  { value: 'bug_tester', label: 'Bug Tester', icon: Bug, color: 'bg-blue-100 text-blue-800' },
  { value: 'admin', label: 'Admin', icon: Shield, color: 'bg-green-100 text-green-800' },
  { value: 'super_admin', label: 'Super Admin', icon: Crown, color: 'bg-purple-100 text-purple-800' },
];

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get users from profiles table (which is synced with auth.users)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(profiles || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error loading users",
        description: "Unable to load user data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdating(userId);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          settings: { 
            role: newRole,
            permissions: getRolePermissions(newRole)
          } 
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              settings: { 
                ...user.settings, 
                role: newRole,
                permissions: getRolePermissions(newRole)
              } 
            }
          : user
      ));

      toast({
        title: "Role Updated",
        description: `User role has been updated to ${getRoleLabel(newRole)}.`
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Update Failed",
        description: "Unable to update user role.",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const getRolePermissions = (role: string): string[] => {
    switch (role) {
      case 'super_admin':
        return ['manage_users', 'manage_system', 'view_analytics', 'bug_testing', 'moderate_content'];
      case 'admin':
        return ['moderate_content', 'view_analytics', 'bug_testing'];
      case 'bug_tester':
        return ['bug_testing'];
      default:
        return [];
    }
  };

  const getRoleLabel = (role?: string): string => {
    const roleConfig = USER_ROLES.find(r => r.value === role);
    return roleConfig?.label || 'Regular User';
  };

  const getRoleIcon = (role?: string) => {
    const roleConfig = USER_ROLES.find(r => r.value === role);
    const Icon = roleConfig?.icon || Users;
    return Icon;
  };

  const getRoleColor = (role?: string): string => {
    const roleConfig = USER_ROLES.find(r => r.value === role);
    return roleConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const userRole = user.settings?.role || 'user';
    const matchesRole = roleFilter === 'all' || userRole === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage user roles, permissions, and system access
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {USER_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <div className="flex gap-2">
              {USER_ROLES.map((role) => {
                const count = users.filter(u => (u.settings?.role || 'user') === role.value).length;
                return (
                  <Badge key={role.value} variant="outline" className={role.color}>
                    <role.icon className="w-3 h-3 mr-1" />
                    {count} {role.label}s
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const userRole = user.settings?.role || 'user';
                    const permissions = user.settings?.permissions || [];
                    const RoleIcon = getRoleIcon(userRole);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img 
                                src={user.avatar_url} 
                                alt={user.full_name}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{user.full_name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getRoleColor(userRole)}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {getRoleLabel(userRole)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {permissions.length > 0 ? (
                              permissions.slice(0, 2).map((perm) => (
                                <Badge key={perm} variant="outline" className="text-xs">
                                  {perm.replace('_', ' ')}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">None</span>
                            )}
                            {permissions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{permissions.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {format(new Date(user.created_at), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.last_sign_in_at ? (
                            <span className="text-sm">
                              {format(new Date(user.last_sign_in_at), 'MMM dd, yyyy')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {user.email_confirmed_at ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                <Mail className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">
                                <Mail className="w-3 h-3 mr-1" />
                                Unverified
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                disabled={updating === user.id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {USER_ROLES.map((role) => (
                                <DropdownMenuItem
                                  key={role.value}
                                  onClick={() => updateUserRole(user.id, role.value)}
                                  disabled={userRole === role.value || updating === user.id}
                                >
                                  <role.icon className="mr-2 h-4 w-4" />
                                  Set as {role.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found matching your criteria
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Role Descriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {USER_ROLES.map((role) => (
              <div key={role.value} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <role.icon className="w-5 h-5 text-primary" />
                  <span className="font-medium">{role.label}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {role.value === 'super_admin' && 'Full system access, can manage all users and settings'}
                  {role.value === 'admin' && 'Can moderate content, view analytics, and test bugs'}
                  {role.value === 'bug_tester' && 'Can access bug testing features and submit detailed reports'}
                  {role.value === 'user' && 'Standard user with basic platform access'}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {getRolePermissions(role.value).map((perm) => (
                    <Badge key={perm} variant="outline" className="text-xs">
                      {perm.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}