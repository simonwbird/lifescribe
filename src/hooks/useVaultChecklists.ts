import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VaultChecklist {
  id: string;
  family_id: string;
  owner_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface VaultChecklistItem {
  id: string;
  checklist_id: string;
  family_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  assigned_to?: string;
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export const useVaultChecklists = (familyId?: string) => {
  return useQuery({
    queryKey: ['vault-checklists', familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vault_checklists')
        .select('*')
        .eq('family_id', familyId!);
      
      if (error) throw error;
      return data as VaultChecklist[];
    },
    enabled: !!familyId,
  });
};

export const useVaultChecklistItems = (checklistId?: string) => {
  return useQuery({
    queryKey: ['vault-checklist-items', checklistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vault_checklist_items')
        .select('*, profiles:assigned_to(full_name, avatar_url)')
        .eq('checklist_id', checklistId!)
        .order('order_index');
      
      if (error) throw error;
      return data;
    },
    enabled: !!checklistId,
  });
};

export const useCreateChecklist = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (checklist: Partial<VaultChecklist>) => {
      const { data, error } = await supabase
        .from('vault_checklists')
        .insert([checklist] as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-checklists'] });
      toast({ title: 'Checklist created successfully' });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to create checklist', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};

export const useCreateChecklistItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: Partial<VaultChecklistItem>) => {
      const { data, error } = await supabase
        .from('vault_checklist_items')
        .insert([item] as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-checklist-items'] });
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

export const useUpdateChecklistItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string; 
      updates: Partial<VaultChecklistItem> 
    }) => {
      const { data, error } = await supabase
        .from('vault_checklist_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-checklist-items'] });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update item', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};

export const useToggleChecklistItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updates: Partial<VaultChecklistItem> = {
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : undefined,
        completed_by: isCompleted ? user?.id : undefined,
      };

      const { data, error } = await supabase
        .from('vault_checklist_items')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vault-checklist-items'] });
      queryClient.invalidateQueries({ queryKey: ['vault-progress'] });
    },
    onError: (error) => {
      toast({ 
        title: 'Failed to update item', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
};
