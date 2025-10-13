import { supabase } from '@/integrations/supabase/client';
import { PrintConfig } from './printTypes';

export async function fetchPrintData(config: PrintConfig) {
  const { scope, scopeId, dateRange } = config;

  switch (scope) {
    case 'person':
      return await fetchPersonData(scopeId!);
    
    case 'event':
      return await fetchEventData(scopeId!);
    
    case 'dateRange':
      return await fetchDateRangeData(dateRange!.start, dateRange!.end);
    
    case 'collection':
      return await fetchCollectionData(scopeId!);
    
    default:
      throw new Error('Invalid print scope');
  }
}

async function fetchPersonData(personId: string) {
  try {
    const personResult = await supabase
      .from('people')
      .select('*')
      .eq('id', personId)
      .maybeSingle();

    const storiesResult = await supabase
      .from('stories')
      .select('id, title, content, occurred_at')
      .limit(100);

    const mediaFiles = await supabase
      .from('media')
      .select('id, url, caption, created_at')
      .limit(100);

    return {
      person: personResult.data,
      stories: storiesResult.data || [],
      media: mediaFiles.data || [],
    };
  } catch (error) {
    console.error('Error fetching person data:', error);
    return { person: null, stories: [], media: [] };
  }
}

async function fetchEventData(eventId: string) {
  const eventResult = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  const uploadsResult = await supabase
    .from('event_uploads')
    .select('*')
    .eq('event_id', eventId);

  const rsvpsResult = await supabase
    .from('event_rsvps')
    .select('*')
    .eq('event_id', eventId)
    .eq('response', 'yes');

  return {
    event: eventResult.data,
    uploads: uploadsResult.data || [],
    attendees: rsvpsResult.data || [],
  };
}

async function fetchDateRangeData(start: string, end: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const membershipResult = await supabase
    .from('members')
    .select('family_id')
    .eq('profile_id', user.id)
    .single();

  if (!membershipResult.data) throw new Error('No family membership');

  const storiesResult = await supabase
    .from('stories')
    .select('*')
    .eq('family_id', membershipResult.data.family_id)
    .gte('occurred_at', start)
    .lte('occurred_at', end)
    .order('occurred_at', { ascending: true });

  const mediaResult = await supabase
    .from('media')
    .select('*')
    .eq('family_id', membershipResult.data.family_id)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: true });

  return {
    stories: storiesResult.data || [],
    media: mediaResult.data || [],
    dateRange: { start, end },
  };
}

async function fetchCollectionData(collectionId: string) {
  return {
    collection: null,
    items: [],
  };
}
