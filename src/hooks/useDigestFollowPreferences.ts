import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FollowPreference {
  id: string;
  user_id: string;
  family_id: string;
  followed_member_id: string;
  created_at: string;
  updated_at: string;
}

interface FamilyMemberWithFollow {
  id: string;
  profile_id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_followed: boolean;
}

// Get current user's follow preferences for a family
export function useDigestFollowPreferences(familyId: string | null) {
  return useQuery({
    queryKey: ['digest-follow-preferences', familyId],
    queryFn: async (): Promise<FollowPreference[]> => {
      if (!familyId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('digest_follow_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('family_id', familyId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!familyId,
  });
}

// Get family members with follow status
export function useFamilyMembersWithFollowStatus(familyId: string | null) {
  return useQuery({
    queryKey: ['family-members-follow-status', familyId],
    queryFn: async (): Promise<FamilyMemberWithFollow[]> => {
      if (!familyId) return [];

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get all family members
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select(`
          id,
          profile_id,
          profiles!inner(
            full_name,
            avatar_url
          )
        `)
        .eq('family_id', familyId);

      if (membersError) throw membersError;

      // Get follow preferences
      const { data: followPrefs, error: prefsError } = await supabase
        .from('digest_follow_preferences')
        .select('followed_member_id')
        .eq('user_id', user.id)
        .eq('family_id', familyId);

      if (prefsError) throw prefsError;

      const followedIds = new Set(
        (followPrefs || []).map(p => p.followed_member_id)
      );

      return (members || []).map(member => ({
        id: member.id,
        profile_id: member.profile_id,
        full_name: (member.profiles as any)?.full_name || null,
        avatar_url: (member.profiles as any)?.avatar_url || null,
        is_followed: followedIds.has(member.profile_id),
      }));
    },
    enabled: !!familyId,
  });
}

// Toggle follow preference for a member
export function useToggleFollowPreference() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      familyId,
      memberId,
      isCurrentlyFollowed,
    }: {
      familyId: string;
      memberId: string;
      isCurrentlyFollowed: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isCurrentlyFollowed) {
        // Unfollow - delete the preference
        const { error } = await supabase
          .from('digest_follow_preferences')
          .delete()
          .eq('user_id', user.id)
          .eq('family_id', familyId)
          .eq('followed_member_id', memberId);

        if (error) throw error;
      } else {
        // Follow - insert the preference
        const { error } = await supabase
          .from('digest_follow_preferences')
          .insert({
            user_id: user.id,
            family_id: familyId,
            followed_member_id: memberId,
          });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['digest-follow-preferences', variables.familyId],
      });
      queryClient.invalidateQueries({
        queryKey: ['family-members-follow-status', variables.familyId],
      });

      toast({
        title: variables.isCurrentlyFollowed ? 'Unfollowed' : 'Following',
        description: variables.isCurrentlyFollowed
          ? 'Updates from this member will no longer appear in your digest'
          : 'Updates from this member will now appear in your digest',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update follow preference',
        variant: 'destructive',
      });
      console.error('Follow preference error:', error);
    },
  });
}

// Clear all follow preferences (follow everyone)
export function useClearFollowPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (familyId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('digest_follow_preferences')
        .delete()
        .eq('user_id', user.id)
        .eq('family_id', familyId);

      if (error) throw error;
    },
    onSuccess: (_, familyId) => {
      queryClient.invalidateQueries({
        queryKey: ['digest-follow-preferences', familyId],
      });
      queryClient.invalidateQueries({
        queryKey: ['family-members-follow-status', familyId],
      });

      toast({
        title: 'Following everyone',
        description: 'You will now receive updates from all family members',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update follow preferences',
        variant: 'destructive',
      });
      console.error('Clear preferences error:', error);
    },
  });
}
