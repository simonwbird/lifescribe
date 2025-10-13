import { useState } from 'react';
import { UserPlus, UserX, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVaultDelegates, useAddVaultDelegate } from '@/hooks/useVault';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface VaultDelegateManagerProps {
  sectionId: string;
  familyId: string;
}

export default function VaultDelegateManager({ sectionId, familyId }: VaultDelegateManagerProps) {
  const { data: delegates } = useVaultDelegates(sectionId);
  const addDelegate = useAddVaultDelegate();
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [accessLevel, setAccessLevel] = useState<'view' | 'edit' | 'admin'>('view');

  // Get family members
  const { data: members } = useQuery({
    queryKey: ['family-members', familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('profile_id, profiles(id, full_name, avatar_url)')
        .eq('family_id', familyId);
      
      if (error) throw error;
      return data;
    },
  });

  const handleAddDelegate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedMember) return;

    await addDelegate.mutateAsync({
      section_id: sectionId,
      family_id: familyId,
      delegate_id: selectedMember,
      granted_by: user.id,
      access_level: accessLevel,
    });

    setIsAdding(false);
    setSelectedMember('');
    setAccessLevel('view');
  };

  // Filter out already assigned delegates
  const availableMembers = members?.filter(
    m => !delegates?.some(d => d.delegate_id === m.profiles?.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">Delegates</h3>
          <p className="text-sm text-muted-foreground">
            People who can access this section when conditions are met
          </p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Delegate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Delegate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Family Member</Label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers?.map((member) => (
                      <SelectItem key={member.profile_id} value={member.profile_id}>
                        {(member.profiles as any)?.full_name || 'Unknown'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Access Level</Label>
                <Select value={accessLevel} onValueChange={(v: any) => setAccessLevel(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="edit">View & Edit</SelectItem>
                    <SelectItem value="admin">Full Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleAddDelegate} className="w-full">
                Add Delegate
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!delegates || delegates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No delegates assigned yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {delegates.map((delegate) => (
            <Card key={delegate.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={(delegate.profiles as any)?.avatar_url} />
                      <AvatarFallback>
                        {((delegate.profiles as any)?.full_name || 'U')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {(delegate.profiles as any)?.full_name || 'Unknown'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Added {new Date(delegate.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{delegate.access_level}</Badge>
                    <Button size="sm" variant="ghost">
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
