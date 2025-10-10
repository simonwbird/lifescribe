import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePersonRoles, useGrantPersonRole, useRevokePersonRole, PersonRole } from '@/hooks/usePersonRoles';
import { useState } from 'react';
import { Shield, Plus, X, Loader2 } from 'lucide-react';

interface RolesManagerProps {
  personId: string;
  familyId: string;
  personStatus: 'living' | 'passed';
  familyMembers: Array<{ id: string; name: string; avatar?: string }>;
}

export function RolesManager({ personId, familyId, personStatus, familyMembers }: RolesManagerProps) {
  const { data: roles = [], isLoading } = usePersonRoles(personId);
  const grantRole = useGrantPersonRole();
  const revokeRole = useRevokePersonRole();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedRole, setSelectedRole] = useState<PersonRole>('contributor');
  const [notes, setNotes] = useState('');

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'steward':
        return 'destructive';
      case 'co_curator':
        return 'secondary';
      case 'contributor':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Owner';
      case 'co_curator':
        return 'Co-Curator';
      case 'steward':
        return 'Steward';
      case 'contributor':
        return 'Contributor';
      case 'viewer':
        return 'Viewer';
      default:
        return role;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'owner':
        return 'Full control, can edit all content';
      case 'co_curator':
        return 'Can edit and manage content';
      case 'steward':
        return 'Manages tribute page, approves content';
      case 'contributor':
        return 'Can add content for review';
      case 'viewer':
        return 'Can only view content';
      default:
        return '';
    }
  };

  const availableRoles: PersonRole[] =
    personStatus === 'living'
      ? ['owner', 'co_curator', 'contributor', 'viewer']
      : ['steward', 'contributor', 'viewer'];

  const handleAddRole = async () => {
    if (!selectedMember || !selectedRole) return;

    await grantRole.mutateAsync({
      personId,
      profileId: selectedMember,
      familyId,
      role: selectedRole,
      notes,
    });

    setAddDialogOpen(false);
    setSelectedMember('');
    setSelectedRole('contributor');
    setNotes('');
  };

  const handleRevokeRole = async (roleId: string) => {
    await revokeRole.mutateAsync({ roleId, personId });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Page Roles & Permissions
          </CardTitle>
          <CardDescription>
            Manage who can view and edit this {personStatus === 'living' ? 'life' : 'tribute'} page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : roles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No roles assigned yet</p>
          ) : (
            <div className="space-y-3">
              {roles.map((role: any) => (
                <div
                  key={role.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <Avatar className="h-10 w-10">
                    {role.profile?.avatar_url && <AvatarImage src={role.profile.avatar_url} />}
                    <AvatarFallback>
                      {role.profile?.full_name
                        ?.split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{role.profile?.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getRoleDescription(role.role)}
                    </p>
                  </div>
                  <Badge variant={getRoleBadgeVariant(role.role)}>
                    {getRoleLabel(role.role)}
                  </Badge>
                  {role.role !== 'owner' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRevokeRole(role.id)}
                      disabled={revokeRole.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Role Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Role</DialogTitle>
            <DialogDescription>
              Assign a role to a family member for this page
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-select">Family Member</Label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger id="member-select">
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  {familyMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-select">Role</Label>
              <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as PersonRole)}>
                <SelectTrigger id="role-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      <div>
                        <div className="font-medium">{getRoleLabel(role)}</div>
                        <div className="text-xs text-muted-foreground">
                          {getRoleDescription(role)}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this role assignment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddRole}
              disabled={!selectedMember || !selectedRole || grantRole.isPending}
            >
              {grantRole.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
