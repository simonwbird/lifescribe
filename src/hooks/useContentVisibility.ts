import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

type VisibilityOption = 'family' | 'private' | 'public' | 'circle'

interface UseContentVisibilityProps {
  contentType: 'story' | 'media' | 'comment' | 'tribute' | 'recipe'
  contentId: string
  initialVisibility: VisibilityOption
}

export function useContentVisibility({ 
  contentType, 
  contentId, 
  initialVisibility 
}: UseContentVisibilityProps) {
  const [visibility, setVisibility] = useState<VisibilityOption>(initialVisibility)

  const updateVisibility = async (newVisibility: VisibilityOption) => {
    let error = null
    
    // Update based on content type
    switch (contentType) {
      case 'story':
        const storyResult = await supabase
          .from('stories')
          .update({ visibility: newVisibility } as any)
          .eq('id', contentId)
        error = storyResult.error
        break
      case 'media':
        const mediaResult = await supabase
          .from('media')
          .update({ visibility: newVisibility } as any)
          .eq('id', contentId)
        error = mediaResult.error
        break
      default:
        // For other types, we'll handle them later
        break
    }

    if (error) {
      throw new Error(error.message)
    }

    setVisibility(newVisibility)
  }

  return {
    visibility,
    updateVisibility
  }
}
