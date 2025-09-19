import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAnalytics } from './useAnalytics';
import { toast } from '@/hooks/use-toast';
import type { 
  ContentItem, 
  ContentSearchFilters, 
  ContentSuggestion,
  ContentAuditLog,
  BulkEditRequest,
  ContentType
} from '@/lib/contentAdminTypes';

export const useContentSearch = (filters: ContentSearchFilters) => {
  return useQuery({
    queryKey: ['content-search', filters],
    queryFn: async () => {
      const results: ContentItem[] = [];
      
      // Search stories
      if (!filters.content_type || filters.content_type.includes('story')) {
        let storyQuery = supabase
          .from('stories')
          .select(`
            id,
            title,
            content,
            created_at,
            updated_at,
            family_id,
            profile_id,
            person_story_links(
              id,
              person:people(id, full_name)
            )
          `)
          .order('created_at', { ascending: false });

        if (filters.family_id) {
          storyQuery = storyQuery.eq('family_id', filters.family_id);
        }
        if (filters.search_term) {
          storyQuery = storyQuery.or(`title.ilike.%${filters.search_term}%,content.ilike.%${filters.search_term}%`);
        }

        const { data: stories } = await storyQuery;
        
        if (stories) {
          results.push(...stories.map(story => ({
            id: story.id,
            type: 'story' as ContentType,
            title: story.title,
            content: story.content,
            created_at: story.created_at,
            updated_at: story.updated_at,
            family_id: story.family_id,
            profile_id: story.profile_id,
            people_links: (story.person_story_links as any[])?.map(link => ({
              id: link.id,
              person_id: link.person.id,
              person_name: link.person.full_name
            })) || []
          })));
        }
      }

      // Search media
      if (!filters.content_type || filters.content_type.includes('media')) {
        let mediaQuery = supabase
          .from('media')
          .select(`
            id,
            file_name,
            mime_type,
            created_at,
            family_id,
            profile_id,
            transcript_text
          `)
          .order('created_at', { ascending: false });

        if (filters.family_id) {
          mediaQuery = mediaQuery.eq('family_id', filters.family_id);
        }
        if (filters.search_term) {
          mediaQuery = mediaQuery.or(`file_name.ilike.%${filters.search_term}%,transcript_text.ilike.%${filters.search_term}%`);
        }

        const { data: media } = await mediaQuery;
        
        if (media) {
          results.push(...media.map(item => ({
            id: item.id,
            type: 'media' as ContentType,
            title: item.file_name,
            content: item.transcript_text,
            created_at: item.created_at,
            family_id: item.family_id,
            profile_id: item.profile_id,
            file_name: item.file_name,
            mime_type: item.mime_type,
            people_links: []
          })));
        }
      }

      // Search answers
      if (!filters.content_type || filters.content_type.includes('answer')) {
        let answerQuery = supabase
          .from('answers')
          .select(`
            id,
            answer_text,
            created_at,
            updated_at,
            family_id,
            profile_id,
            occurred_on,
            person_answer_links(
              id,
              person:people(id, full_name)
            )
          `)
          .order('created_at', { ascending: false });

        if (filters.family_id) {
          answerQuery = answerQuery.eq('family_id', filters.family_id);
        }
        if (filters.search_term) {
          answerQuery = answerQuery.ilike('answer_text', `%${filters.search_term}%`);
        }

        const { data: answers } = await answerQuery;
        
        if (answers) {
          results.push(...answers.map(answer => ({
            id: answer.id,
            type: 'answer' as ContentType,
            title: answer.answer_text.substring(0, 100) + '...',
            content: answer.answer_text,
            created_at: answer.created_at,
            updated_at: answer.updated_at,
            family_id: answer.family_id,
            profile_id: answer.profile_id,
            answer_text: answer.answer_text,
            occurred_on: answer.occurred_on,
            people_links: (answer.person_answer_links as any[])?.map(link => ({
              id: link.id,
              person_id: link.person.id,
              person_name: link.person.full_name
            })) || []
          })));
        }
      }

      // Sort by created_at DESC
      return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });
};

export const useContentSuggestions = (contentId?: string) => {
  return useQuery({
    queryKey: ['content-suggestions', contentId],
    queryFn: async () => {
      let query = supabase
        .from('content_suggestions')
        .select('*')
        .eq('status', 'pending')
        .order('confidence_score', { ascending: false });

      if (contentId) {
        query = query.eq('content_id', contentId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as ContentSuggestion[];
    },
  });
};

export const useContentAuditLog = (contentId?: string) => {
  return useQuery({
    queryKey: ['content-audit-log', contentId],
    queryFn: async () => {
      let query = supabase
        .from('content_audit_log')
        .select(`
          *,
          editor:profiles!editor_id(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (contentId) {
        query = query.eq('content_id', contentId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data as any[]).map(log => ({
        ...log,
        editor_name: log.editor?.full_name || 'Unknown'
      })) as ContentAuditLog[];
    },
  });
};

export const useUpdateContent = () => {
  const queryClient = useQueryClient();
  const { track } = useAnalytics();

  return useMutation({
    mutationFn: async ({
      contentType,
      contentId,
      updates,
      changeReason,
      familyId
    }: {
      contentType: ContentType;
      contentId: string;
      updates: Record<string, any>;
      changeReason?: string;
      familyId: string;
    }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Get current values for audit log
      let currentValues: any = {};
      const tableName = contentType === 'story' ? 'stories' : 
                       contentType === 'media' ? 'media' : 'answers';
      
      const { data: current } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', contentId)
        .single();

      if (current) {
        currentValues = Object.keys(updates).reduce((acc, key) => {
          acc[key] = current[key];
          return acc;
        }, {} as any);
      }

      // Update the content
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', contentId)
        .select()
        .single();

      if (error) throw error;

      // Log the change
      await supabase.rpc('log_content_change', {
        p_content_type: contentType,
        p_content_id: contentId,
        p_family_id: familyId,
        p_editor_id: user.id,
        p_action_type: Object.keys(updates).join('_') + '_change',
        p_old_values: currentValues,
        p_new_values: updates,
        p_change_reason: changeReason
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-search'] });
      queryClient.invalidateQueries({ queryKey: ['content-audit-log'] });
      
      toast({
        title: 'Content Updated',
        description: 'Changes have been saved and logged.'
      });
    },
    onError: (error) => {
      console.error('Content update failed:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update content. Please try again.',
        variant: 'destructive'
      });
    }
  });
};

export const useBulkEditContent = () => {
  const queryClient = useQueryClient();
  const { track } = useAnalytics();

  return useMutation({
    mutationFn: async (request: BulkEditRequest) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Create batch operation record
      const { data: batchOp, error: batchError } = await supabase
        .from('content_batch_operations')
        .insert({
          family_id: request.operation_data.family_id,
          operation_type: request.operation_type,
          initiated_by: user.id,
          target_content_ids: request.content_ids,
          operation_data: request.operation_data,
          total_count: request.content_ids.length
        })
        .select()
        .single();

      if (batchError) throw batchError;

      let successCount = 0;
      const errors: any[] = [];

      // Process each content item
      for (const contentId of request.content_ids) {
        try {
          // Determine content type and table
          const contentType = request.operation_data.content_type as ContentType;
          const tableName = contentType === 'story' ? 'stories' : 
                           contentType === 'media' ? 'media' : 'answers';

          // Get current values
          const { data: current } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', contentId)
            .single();

          if (!current) continue;

          // Apply updates based on operation type
          let updates: any = {};
          let actionType = '';

          switch (request.operation_type) {
            case 'bulk_title_update':
              updates.title = request.operation_data.new_title;
              actionType = 'title_change';
              break;
            case 'bulk_date_update':
              if (contentType === 'answer') {
                updates.occurred_on = request.operation_data.new_date;
              } else if (contentType === 'story') {
                updates.updated_at = request.operation_data.new_date;
              }
              actionType = 'date_change';
              break;
            case 'bulk_reassign':
              // This would involve updating person links
              actionType = 'reassign';
              break;
            case 'bulk_pin':
              // This would involve updating pinned status
              actionType = 'pin';
              break;
          }

          if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase
              .from(tableName)
              .update(updates)
              .eq('id', contentId);

            if (updateError) throw updateError;
          }

          // Log the change
          await supabase.rpc('log_content_change', {
            p_content_type: contentType,
            p_content_id: contentId,
            p_family_id: request.operation_data.family_id,
            p_editor_id: user.id,
            p_action_type: actionType,
            p_old_values: {},
            p_new_values: updates,
            p_change_reason: request.change_reason,
            p_batch_id: batchOp.id
          });

          successCount++;
        } catch (error) {
          errors.push({ contentId, error: error.message });
        }
      }

      // Update batch operation status
      await supabase
        .from('content_batch_operations')
        .update({
          status: errors.length > 0 ? 'completed' : 'completed',
          completed_count: successCount,
          error_details: { errors }
        })
        .eq('id', batchOp.id);

      return { batchId: batchOp.id, successCount, errorCount: errors.length, errors };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['content-search'] });
      queryClient.invalidateQueries({ queryKey: ['content-audit-log'] });
      
      track('CONTENT_BULK_EDIT_APPLIED', {
        batch_id: result.batchId,
        success_count: result.successCount,
        error_count: result.errorCount
      });

      toast({
        title: 'Bulk Edit Complete',
        description: `Updated ${result.successCount} items successfully.`
      });
    },
    onError: (error) => {
      console.error('Bulk edit failed:', error);
      toast({
        title: 'Bulk Edit Failed',
        description: 'Failed to apply bulk changes. Please try again.',
        variant: 'destructive'
      });
    }
  });
};

export const useAcceptSuggestion = () => {
  const queryClient = useQueryClient();
  const updateContent = useUpdateContent();

  return useMutation({
    mutationFn: async ({
      suggestionId,
      contentType,
      contentId,
      familyId
    }: {
      suggestionId: string;
      contentType: ContentType;
      contentId: string;
      familyId: string;
    }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Get the suggestion
      const { data: suggestion, error: suggestionError } = await supabase
        .from('content_suggestions')
        .select('*')
        .eq('id', suggestionId)
        .single();

      if (suggestionError) throw suggestionError;

      // Apply the suggestion
      let updates: any = {};
      switch (suggestion.suggestion_type) {
        case 'title':
          const titleValue = suggestion.suggested_value as any;
          updates.title = titleValue.title;
          break;
        case 'date':
          const dateValue = suggestion.suggested_value as any;
          if (contentType === 'answer') {
            updates.occurred_on = dateValue.date;
          }
          break;
      }

      if (Object.keys(updates).length > 0) {
        await updateContent.mutateAsync({
          contentType,
          contentId,
          updates,
          changeReason: `AI suggestion accepted: ${suggestion.created_by_ai}`,
          familyId
        });
      }

      // Mark suggestion as accepted
      const { error: acceptError } = await supabase
        .from('content_suggestions')
        .update({
          status: 'accepted',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', suggestionId);

      if (acceptError) throw acceptError;

      return suggestion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-suggestions'] });
      
      toast({
        title: 'Suggestion Applied',
        description: 'AI suggestion has been accepted and applied.'
      });
    }
  });
};