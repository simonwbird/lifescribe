import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Cast to any since these tables were just added
const personRolesTable = (supabase as any).from('person_roles');

export type PersonRole = 'owner' | 'co_curator' | 'steward' | 'contributor' | 'viewer';

// Get roles for a person
export function usePersonRoles(personId: string) {
  return useQuery({
    queryKey: ['person-roles', personId],
    queryFn: async () => {
      const { data, error } = await personRolesTable
        .select(`
          *,
          profile:profile_id(full_name, avatar_url)
        `)
        .eq('person_id', personId)
        .is('revoked_at', null);

      if (error) throw error;
      return data;
    },
  });
}

// Get user's role for a person
export function useUserPersonRole(personId: string, userId: string | undefined) {
  return useQuery({
    queryKey: ['user-person-role', personId, userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return 'viewer';

      const { data, error } = await (supabase.rpc as any)('get_user_person_role', {
        p_user_id: userId,
        p_person_id: personId,
      });

      if (error) throw error;
      return data as PersonRole;
    },
  });
}

// Grant a role to a user
export function useGrantPersonRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      personId,
      profileId,
      familyId,
      role,
      notes,
    }: {
      personId: string;
      profileId: string;
      familyId: string;
      role: PersonRole;
      notes?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await personRolesTable
        .insert([{
          person_id: personId,
          profile_id: profileId,
          family_id: familyId,
          role,
          granted_by: user.user.id,
          notes,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['person-roles', variables.personId] });
      toast({
        title: 'Role granted',
        description: 'The role has been assigned successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to grant role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Revoke a role from a user
export function useRevokePersonRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ roleId, personId }: { roleId: string; personId: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await personRolesTable
        .update({
          revoked_at: new Date().toISOString(),
          revoked_by: user.user.id,
        })
        .eq('id', roleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['person-roles', variables.personId] });
      toast({
        title: 'Role revoked',
        description: 'The role has been revoked successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to revoke role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
