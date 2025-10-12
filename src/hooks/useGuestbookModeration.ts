import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Cast to any since guestbook_entries was just added and types haven't regenerated
const table = () => (supabase as any).from('guestbook_entries');

interface GuestbookEntry {
  id: string;
  person_id: string;
  family_id: string;
  profile_id?: string;
  visitor_name?: string;
  visitor_email?: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  page_type: 'life' | 'tribute';
  moderation_reason?: string;
  moderated_by?: string;
  moderated_at?: string;
  auto_approved: boolean;
  created_at: string;
  updated_at: string;
  is_anonymous?: boolean;
  is_featured?: boolean;
  featured_at?: string;
  featured_by?: string;
  featured_order?: number;
}

export function useGuestbookEntries(personId: string, pageType: 'life' | 'tribute') {
  return useQuery({
    queryKey: ['guestbook-entries', personId, pageType],
    queryFn: async () => {
      const { data, error } = await table()
        .select(`
          *,
          profile:profile_id(full_name, avatar_url)
        `)
        .eq('person_id', personId)
        .eq('page_type', pageType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (GuestbookEntry & { profile?: { full_name: string; avatar_url: string } })[];
    },
  });
}

export function useGuestbookModerationQueue(familyId: string) {
  return useQuery({
    queryKey: ['guestbook-moderation-queue', familyId],
    queryFn: async () => {
      const { data, error } = await table()
        .select(`
          *,
          profile:profile_id(full_name, avatar_url),
          person:person_id(given_name, surname)
        `)
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useApproveEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ entryId, moderatorId }: { entryId: string; moderatorId: string }) => {
      const { data, error } = await (supabase.rpc as any)('approve_guestbook_entry', {
        p_entry_id: entryId,
        p_moderator_id: moderatorId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guestbook-entries'] });
      queryClient.invalidateQueries({ queryKey: ['guestbook-moderation-queue'] });
      toast({
        title: 'Entry approved',
        description: 'The guestbook entry has been approved and is now visible.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Approval failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRejectEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      entryId,
      moderatorId,
      reason,
    }: {
      entryId: string;
      moderatorId: string;
      reason: string;
    }) => {
      const { data, error } = await (supabase.rpc as any)('reject_guestbook_entry', {
        p_entry_id: entryId,
        p_moderator_id: moderatorId,
        p_reason: reason,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guestbook-entries'] });
      queryClient.invalidateQueries({ queryKey: ['guestbook-moderation-queue'] });
      toast({
        title: 'Entry rejected',
        description: 'The guestbook entry has been rejected.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Rejection failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useSubmitGuestbookEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (entry: {
      person_id: string;
      family_id: string;
      page_type: 'life' | 'tribute';
      content: string;
      profile_id?: string;
      visitor_name?: string;
      visitor_email?: string;
      is_anonymous?: boolean;
      audio_recording_id?: string;
    }) => {
      const { data, error } = await table()
        .insert([entry])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guestbook-entries', variables.person_id] });
      queryClient.invalidateQueries({ queryKey: ['guestbook-moderation-queue', variables.family_id] });
      
      if (variables.page_type === 'tribute') {
        toast({
          title: 'Entry submitted',
          description: 'Your tribute has been submitted for review.',
        });
      } else {
        toast({
          title: 'Entry submitted',
          description: 'Your message has been posted.',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function usePinEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ entryId, personId, pageType }: { entryId: string; personId: string; pageType: 'life' | 'tribute' }) => {
      const { data, error } = await (supabase.rpc as any)('pin_guestbook_entry', {
        p_entry_id: entryId,
        p_person_id: personId,
        p_page_type: pageType,
      });

      if (error) throw error;
      if (data?.success === false) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guestbook-entries', variables.personId] });
      toast({
        title: 'Entry featured',
        description: 'The tribute has been pinned as a featured entry.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Feature failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUnpinEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ entryId, personId }: { entryId: string; personId: string }) => {
      const { data, error } = await (supabase.rpc as any)('unpin_guestbook_entry', {
        p_entry_id: entryId,
        p_person_id: personId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guestbook-entries', variables.personId] });
      toast({
        title: 'Entry unpinned',
        description: 'The tribute is no longer featured.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Unpin failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
