import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Event, EventRSVP, RSVPResponse, RSVPCounts } from '@/lib/events/eventTypes';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export function useEvent(eventId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data as Event;
    },
    enabled: !!eventId,
  });

  const { data: rsvps = [], isLoading: rsvpsLoading } = useQuery({
    queryKey: ['event-rsvps', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', eventId);

      if (error) throw error;
      return data as EventRSVP[];
    },
    enabled: !!eventId,
  });

  const { data: myRsvp } = useQuery({
    queryKey: ['my-rsvp', eventId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as EventRSVP | null;
    },
    enabled: !!eventId,
  });

  // Live RSVP updates
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel('event-rsvps-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_rsvps',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['event-rsvps', eventId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, queryClient]);

  const updateRsvp = useMutation({
    mutationFn: async ({ response, notes, guestCount }: { 
      response: RSVPResponse; 
      notes?: string;
      guestCount?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('event_rsvps')
        .upsert({
          event_id: eventId,
          user_id: user.id,
          response,
          notes: notes || null,
          guest_count: guestCount || 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-rsvps', eventId] });
      queryClient.invalidateQueries({ queryKey: ['my-rsvp', eventId] });
      toast({
        title: 'RSVP updated',
        description: 'Your response has been recorded',
      });
    },
  });

  const rsvpCounts: RSVPCounts = {
    yes: rsvps.filter((r) => r.response === 'yes').reduce((sum, r) => sum + r.guest_count, 0),
    no: rsvps.filter((r) => r.response === 'no').length,
    maybe: rsvps.filter((r) => r.response === 'maybe').reduce((sum, r) => sum + r.guest_count, 0),
    total: rsvps.length,
  };

  return {
    event,
    rsvps,
    myRsvp,
    rsvpCounts,
    isLoading,
    rsvpsLoading,
    updateRsvp: updateRsvp.mutate,
    isUpdating: updateRsvp.isPending,
  };
}
