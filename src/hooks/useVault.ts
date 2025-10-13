import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VaultSection {
  id: string;
  family_id: string;
  owner_id: string;
  section_type: 'documents' | 'accounts' | 'contacts' | 'other';
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VaultItem {
  id: string;
  section_id: string;
  family_id: string;
  title: string;
  encrypted_data: any;
  item_type: string;
  file_path?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface VaultDelegate {
  id: string;
  section_id: string;
  family_id: string;
  delegate_id: string;
  granted_by: string;
  access_level: 'view' | 'edit' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface VaultAccessCondition {
  id: string;
  section_id: string;
  family_id: string;
  condition_type: 'time_lock' | 'admin_unlock' | 'death_verification' | 'manual';
  unlock_date?: string;
  is_unlocked: boolean;
  unlocked_at?: string;
  unlocked_by?: string;
  created_at: string;
  updated_at: string;
}

export const useVaultSections = (familyId?: string) => {
  return useQuery({
    queryKey: ['vault-sections', familyId],
    queryFn: async () => {
      let query = supabase
        .from('vault_sections')
        .select('*')
        .eq('is_active', true);
      
      if (familyId) {
        query = query.eq('family_id', familyId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as VaultSection[];
    },
    enabled: !!familyId,
  });
};

export const useVaultItems = (sectionId?: string) => {
  return useQuery({
    queryKey: ['vault-items', sectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vault_items')
        .select('*')
        .eq('section_id', sectionId!);
      
      if (error) throw error;
      return data as VaultItem[];
    },
    enabled: !!sectionId,
  });
};

export const useVaultDelegates = (sectionId?: string) => {
  return useQuery({
    queryKey: ['vault-delegates', sectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vault_delegates')
        .select('*, profiles:delegate_id(full_name, avatar_url)')
        .eq('section_id', sectionId!)
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!sectionId,
  });
};

export const useVaultAccessConditions = (sectionId?: string) => {
  return useQuery({
    queryKey: ['vault-access-conditions', sectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vault_access_conditions')
        .select('*')
        .eq('section_id', sectionId!);
      
      if (error) throw error;
      return data as VaultAccessCondition[];
    },
    enabled: !!sectionId,
  });
};

export const useVaultProgress = (familyId?: string) => {
  return useQuery({
    queryKey: ['vault-progress', familyId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('calculate_vault_progress', {
        p_family_id: familyId!,
        p_user_id: user.id,
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!familyId,
  });
};

export const useCreateVaultSection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (section: Partial<VaultSection>) => {
      const { data, error } = await supabase
        .from('vault_sections')
        .insert([section] as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-sections'] });
      toast({ title: 'Section created successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to create section', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};

export const useCreateVaultItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Partial<VaultItem>) => {
      const { data, error } = await supabase
        .from('vault_items')
        .insert([item] as any)
        .select()
        .single();
      
      if (error) throw error;

      // Log access
      await supabase.rpc('log_vault_access', {
        p_section_id: item.section_id,
        p_item_id: data.id,
        p_access_type: 'edit',
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-items'] });
      toast({ title: 'Item added successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to add item', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};

export const useAddVaultDelegate = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (delegate: Partial<VaultDelegate>) => {
      const { data, error } = await supabase
        .from('vault_delegates')
        .insert([delegate] as any)
        .select()
        .single();
      
      if (error) throw error;

      // Log access
      await supabase.rpc('log_vault_access', {
        p_section_id: delegate.section_id,
        p_item_id: null,
        p_access_type: 'delegate',
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-delegates'] });
      toast({ title: 'Delegate added successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to add delegate', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};

export const useUpdateAccessCondition = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<VaultAccessCondition> 
    }) => {
      const { data, error } = await supabase
        .from('vault_access_conditions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-access-conditions'] });
      toast({ title: 'Access condition updated' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update condition', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};

export const useCheckVaultAccess = (sectionId?: string) => {
  return useQuery({
    queryKey: ['vault-access-check', sectionId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('check_vault_access', {
        p_section_id: sectionId!,
        p_user_id: user.id,
      });
      
      if (error) throw error;
      return data as boolean;
    },
    enabled: !!sectionId,
  });
};
