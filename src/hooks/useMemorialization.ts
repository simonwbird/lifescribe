import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Cast to any since these tables were just added
const deathVerificationsTable = (supabase as any).from('death_verifications');
const memorializationRecordsTable = (supabase as any).from('memorialization_records');

// Get memorialization record for a person
export function useMemorializationRecord(personId: string) {
  return useQuery({
    queryKey: ['memorialization-record', personId],
    queryFn: async () => {
      const { data, error } = await memorializationRecordsTable
        .select(`
          *,
          verification:verification_id(*),
          initiated_by_profile:initiated_by(full_name, avatar_url)
        `)
        .eq('person_id', personId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

// Get death verification for a person
export function useDeathVerification(personId: string) {
  return useQuery({
    queryKey: ['death-verification', personId],
    queryFn: async () => {
      const { data, error } = await deathVerificationsTable
        .select('*')
        .eq('person_id', personId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

// Submit death verification
export function useSubmitDeathVerification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (verification: {
      person_id: string;
      family_id: string;
      verification_type: string;
      document_type?: string;
      document_url?: string;
      death_date?: string;
      death_place?: string;
      certificate_number?: string;
      issuing_authority?: string;
      admin_override?: boolean;
      override_reason?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await deathVerificationsTable
        .insert([{ ...verification, verified_by: user.user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['death-verification', variables.person_id] });
      toast({
        title: 'Verification submitted',
        description: 'Death verification has been recorded.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Verification failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Initiate memorialization
export function useInitiateMemorialization() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      personId,
      verificationId,
      stewardIds,
    }: {
      personId: string;
      verificationId: string;
      stewardIds: string[];
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await (supabase.rpc as any)('initiate_memorialization', {
        p_person_id: personId,
        p_initiated_by: user.user.id,
        p_verification_id: verificationId,
        p_steward_ids: stewardIds,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memorialization-record', variables.personId] });
      toast({
        title: 'Memorialization initiated',
        description: 'The memorialization process has been started.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Initiation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Complete memorialization
export function useCompleteMemorialization() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      memorializationId,
      deathDate,
      personId,
    }: {
      memorializationId: string;
      deathDate: string;
      personId: string;
    }) => {
      const { data, error } = await (supabase.rpc as any)('complete_memorialization', {
        p_memorialization_id: memorializationId,
        p_death_date: deathDate,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memorialization-record', variables.personId] });
      queryClient.invalidateQueries({ queryKey: ['person-roles', variables.personId] });
      toast({
        title: 'Memorialization completed',
        description: 'The person page has been converted to a tribute page.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Completion failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Reverse memorialization
export function useReverseMemorialization() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      memorializationId,
      reason,
      personId,
    }: {
      memorializationId: string;
      reason: string;
      personId: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await (supabase.rpc as any)('reverse_memorialization', {
        p_memorialization_id: memorializationId,
        p_reversed_by: user.user.id,
        p_reason: reason,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['memorialization-record', variables.personId] });
      queryClient.invalidateQueries({ queryKey: ['person-roles', variables.personId] });
      toast({
        title: 'Memorialization reversed',
        description: 'The tribute page has been restored to a life page.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Reversal failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
