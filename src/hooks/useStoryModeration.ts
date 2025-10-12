import { supabase } from '@/integrations/supabase/client'

export interface ModerationResult {
  duplicate_score: number
  duplicate_ids: string[]
  sensitivity_score: number
  concerns: string[]
  priority: number
  needs_review: boolean
}

export async function moderateStory(
  storyId: string,
  title: string,
  content: string,
  familyId: string
): Promise<ModerationResult> {
  const { data, error } = await supabase.functions.invoke('moderate-story', {
    body: { storyId, title, content, familyId }
  })

  if (error) throw error
  return data as ModerationResult
}
