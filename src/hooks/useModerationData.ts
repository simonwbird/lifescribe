import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAnalytics } from './useAnalytics';
import { toast } from '@/hooks/use-toast';
import type { 
  ModerationQueueItem, 
  ModerationFilters, 
  BulkModerationRequest,
  ModerationActionType 
} from '@/lib/moderationTypes';

export const useModerationQueue = (filters?: ModerationFilters) => {
  return useQuery({
    queryKey: ['moderation-queue', filters],
    queryFn: async () => {
      let query = supabase
        .from('moderation_queue_items')
        .select(`
          *,
          flag:moderation_flags(*),
          actions:moderation_actions(*),
          assigned_user:profiles!assigned_to(full_name, email)
        `)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.item_type?.length) {
        query = query.in('item_type', filters.item_type);
      }
      if (filters?.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.overdue_only) {
        query = query.lt('sla_due_at', new Date().toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data as any[]).map(item => ({
        ...item,
        flag: item.flag || null,
        actions: Array.isArray(item.actions) ? item.actions : [],
        assigned_user: item.assigned_user || null
      })) as ModerationQueueItem[];
    },
  });
};

export const useModerationItem = (itemId: string) => {
  return useQuery({
    queryKey: ['moderation-item', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('moderation_queue_items')
        .select(`
          *,
          flag:moderation_flags(*),
          actions:moderation_actions(*),
          assigned_user:profiles!assigned_to(full_name, email)
        `)
        .eq('id', itemId)
        .single();

      if (error) throw error;

      const processedItem = {
        ...data,
        flag: (data as any).flag || null,
        actions: Array.isArray((data as any).actions) ? (data as any).actions : [],
        assigned_user: (data as any).assigned_user || null
      };

      // Fetch the actual content based on item type
      let itemData = null;
      const item = processedItem as ModerationQueueItem;
      
      try {
        switch (item.item_type) {
          case 'story':
            const { data: storyData } = await supabase
              .from('stories')
              .select('*')
              .eq('id', item.item_id)
              .single();
            itemData = storyData;
            break;
          case 'media':
            const { data: mediaData } = await supabase
              .from('media')
              .select('*')
              .eq('id', item.item_id)
              .single();
            itemData = mediaData;
            break;
          case 'answer':
            const { data: answerData } = await supabase
              .from('answers')
              .select('*')
              .eq('id', item.item_id)
              .single();
            itemData = answerData;
            break;
          case 'comment':
            const { data: commentData } = await supabase
              .from('comments')
              .select('*')
              .eq('id', item.item_id)
              .single();
            itemData = commentData;
            break;
        }
      } catch (err) {
        console.warn('Failed to fetch item data:', err);
      }

      return { ...item, item_data: itemData };
    },
  });
};

export const useModerationAction = () => {
  const queryClient = useQueryClient();
  const { track } = useAnalytics();

  return useMutation({
    mutationFn: async ({ 
      queueItemId, 
      actionType, 
      rationale,
      metadata = {}
    }: { 
      queueItemId: string; 
      actionType: ModerationActionType; 
      rationale: string;
      metadata?: Record<string, any>;
    }) => {
      // Get the queue item to find the flag_id
      const { data: queueItem, error: queueError } = await supabase
        .from('moderation_queue_items')
        .select('flag_id, status')
        .eq('id', queueItemId)
        .single();

      if (queueError) throw queueError;

      // Create the moderation action
      const { data: action, error: actionError } = await supabase
        .from('moderation_actions')
        .insert({
          flag_id: queueItem.flag_id,
          action_type: actionType,
          rationale,
          metadata,
          actor_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (actionError) throw actionError;

      // Update queue item status
      const newStatus = actionType === 'resolve' ? 'resolved' : 
                       actionType === 'escalate' ? 'escalated' : 'in_review';
      
      const { error: updateError } = await supabase
        .from('moderation_queue_items')
        .update({ 
          status: newStatus,
          assigned_to: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', queueItemId);

      if (updateError) throw updateError;

      return action;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      queryClient.invalidateQueries({ queryKey: ['moderation-item'] });
      
      track('MOD_ACTION_APPLIED', {
        action: variables.actionType,
        queue_item_id: variables.queueItemId
      });

      if (variables.actionType === 'resolve') {
        track('FLAG_RESOLVED', {
          queue_item_id: variables.queueItemId
        });
      }

      toast({
        title: 'Action Applied',
        description: `Successfully applied ${variables.actionType} action.`
      });
    },
    onError: (error) => {
      console.error('Moderation action failed:', error);
      toast({
        title: 'Action Failed',
        description: 'Failed to apply moderation action. Please try again.',
        variant: 'destructive'
      });
    }
  });
};

export const useBulkModerationAction = () => {
  const queryClient = useQueryClient();
  const { track } = useAnalytics();

  return useMutation({
    mutationFn: async ({ item_ids, action_type, rationale }: BulkModerationRequest) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      const results = [];
      
      for (const itemId of item_ids) {
        try {
          // Get the queue item to find the flag_id
          const { data: queueItem, error: queueError } = await supabase
            .from('moderation_queue_items')
            .select('flag_id')
            .eq('id', itemId)
            .single();

          if (queueError) {
            console.error(`Failed to get queue item ${itemId}:`, queueError);
            continue;
          }

          // Create the moderation action
          const { data: action, error: actionError } = await supabase
            .from('moderation_actions')
            .insert({
              flag_id: queueItem.flag_id,
              action_type,
              rationale,
              actor_id: user.id
            })
            .select()
            .single();

          if (actionError) {
            console.error(`Failed to create action for ${itemId}:`, actionError);
            continue;
          }

          // Update queue item status
          const newStatus = action_type === 'resolve' ? 'resolved' : 
                           action_type === 'escalate' ? 'escalated' : 'in_review';
          
          const { error: updateError } = await supabase
            .from('moderation_queue_items')
            .update({ 
              status: newStatus,
              assigned_to: user.id
            })
            .eq('id', itemId);

          if (updateError) {
            console.error(`Failed to update queue item ${itemId}:`, updateError);
            continue;
          }

          results.push({ itemId, success: true, action });
        } catch (error) {
          console.error(`Bulk action failed for item ${itemId}:`, error);
          results.push({ itemId, success: false, error });
        }
      }

      return results;
    },
    onSuccess: (results, variables) => {
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;

      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
      
      track('MOD_ACTION_APPLIED', {
        action: variables.action_type,
        bulk: true,
        success_count: successCount,
        total_count: totalCount
      });

      if (variables.action_type === 'resolve') {
        track('FLAG_RESOLVED', {
          bulk: true,
          count: successCount
        });
      }

      toast({
        title: 'Bulk Action Complete',
        description: `Applied ${variables.action_type} to ${successCount}/${totalCount} items.`
      });
    },
    onError: (error) => {
      console.error('Bulk moderation action failed:', error);
      toast({
        title: 'Bulk Action Failed',
        description: 'Failed to apply bulk moderation action. Please try again.',
        variant: 'destructive'
      });
    }
  });
};