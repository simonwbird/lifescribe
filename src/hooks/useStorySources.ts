import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StorySource, CreateSourceInput } from '@/lib/citations/citationTypes';
import { useToast } from '@/hooks/use-toast';

export function useStorySources(storyId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['story-sources', storyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('story_sources')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as StorySource[];
    },
    enabled: !!storyId,
  });

  const addSource = useMutation({
    mutationFn: async (input: CreateSourceInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('story_sources')
        .insert({
          ...input,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-sources', storyId] });
      queryClient.invalidateQueries({ queryKey: ['uncited-stories'] });
      toast({
        title: 'Source added',
        description: 'Citation source added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteSource = useMutation({
    mutationFn: async (sourceId: string) => {
      const { error } = await supabase
        .from('story_sources')
        .delete()
        .eq('id', sourceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-sources', storyId] });
      queryClient.invalidateQueries({ queryKey: ['uncited-stories'] });
      toast({
        title: 'Source removed',
        description: 'Citation source removed',
      });
    },
  });

  return {
    sources,
    isLoading,
    isCited: sources.length > 0,
    addSource: addSource.mutate,
    deleteSource: deleteSource.mutate,
    isAdding: addSource.isPending,
  };
}

export function useUncitedStories(familyId: string) {
  return useQuery({
    queryKey: ['uncited-stories', familyId],
    queryFn: async () => {
      const { data: stories, error: storiesError } = await supabase
        .from('stories')
        .select('id, title, created_at')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });

      if (storiesError) throw storiesError;

      const { data: sources, error: sourcesError } = await supabase
        .from('story_sources')
        .select('story_id')
        .eq('family_id', familyId);

      if (sourcesError) throw sourcesError;

      const citedStoryIds = new Set(sources.map((s) => s.story_id));
      return stories.filter((story) => !citedStoryIds.has(story.id));
    },
    enabled: !!familyId,
  });
}
