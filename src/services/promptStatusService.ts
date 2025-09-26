import { supabase } from '@/integrations/supabase/client';

export type PromptInstanceStatus = 'open' | 'in_progress' | 'completed' | 'skipped' | 'not_applicable' | 'snoozed';

export interface SkipOptions {
  reason?: string;
}

export interface SnoozeOptions {
  until: Date;
  reason?: string;
}

export interface NotApplicableResponse {
  success: boolean;
  fallbackPrompt?: {
    id: string;
    title: string;
    body: string;
    category: string;
  };
}

// Skip a prompt instance
export async function skipPromptInstance(instanceId: string, options: SkipOptions = {}) {
  const { error } = await supabase
    .from('prompt_instances')
    .update({ 
      status: 'skipped',
      updated_at: new Date().toISOString()
    })
    .eq('id', instanceId);

  if (error) throw error;
  return { success: true };
}

// Mark prompt as not applicable and get fallback suggestion
export async function markNotApplicable(instanceId: string): Promise<NotApplicableResponse> {
  // First update the status
  const { error: updateError } = await supabase
    .from('prompt_instances')
    .update({ 
      status: 'not_applicable',
      updated_at: new Date().toISOString()
    })
    .eq('id', instanceId);

  if (updateError) throw updateError;

  // Get the original prompt to suggest a fallback
  const { data: instance, error: fetchError } = await supabase
    .from('prompt_instances')
    .select(`
      prompt:prompts(id, title, body, category)
    `)
    .eq('id', instanceId)
    .single();

  if (fetchError) throw fetchError;

  // Generate a fallback prompt based on the original category
  const originalCategory = instance.prompt?.category || 'general';
  const fallbackSuggestions: Record<string, any> = {
    'firsts': {
      title: 'First Adventure',
      body: 'Tell us about your first big adventure or journey you took.',
      category: 'firsts'
    },
    'places': {
      title: 'Favorite Childhood Spot',
      body: 'Describe your favorite place to spend time as a child.',
      category: 'places'
    },
    'people': {
      title: 'Someone Special',
      body: 'Tell us about someone who made a big impact on your life.',
      category: 'people'
    },
    'food': {
      title: 'Comfort Food',
      body: 'What\'s a dish that always makes you feel at home?',
      category: 'food'
    }
  };

  const fallback = fallbackSuggestions[originalCategory] || fallbackSuggestions['firsts'];

  return {
    success: true,
    fallbackPrompt: {
      id: crypto.randomUUID(),
      ...fallback
    }
  };
}

// Snooze a prompt instance
export async function snoozePromptInstance(instanceId: string, options: SnoozeOptions) {
  const { error } = await supabase
    .from('prompt_instances')
    .update({ 
      status: 'snoozed',
      snoozed_until: options.until.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', instanceId);

  if (error) throw error;
  return { success: true };
}

// Mark prompt as in progress
export async function markInProgress(instanceId: string) {
  const { error } = await supabase
    .from('prompt_instances')
    .update({ 
      status: 'in_progress',
      updated_at: new Date().toISOString()
    })
    .eq('id', instanceId);

  if (error) throw error;
  return { success: true };
}

// Mark prompt as completed
export async function markCompleted(instanceId: string) {
  const { error } = await supabase
    .from('prompt_instances')
    .update({ 
      status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', instanceId);

  if (error) throw error;
  return { success: true };
}

// Function to check and return snoozed prompts that should be open again
export async function checkSnoozedPrompts() {
  const { error } = await supabase.rpc('check_snoozed_prompts');
  if (error) throw error;
}