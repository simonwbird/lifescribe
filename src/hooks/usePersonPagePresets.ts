import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { PresetConfig, PersonPageBlock } from '@/types/personPage'
import lifePreset from '@/config/presets/life.json'
import tributePreset from '@/config/presets/tribute.json'

export function usePersonPagePresets(
  personId: string,
  personStatus: 'living' | 'passed',
  existingBlocks: PersonPageBlock[]
) {
  const [currentPreset, setCurrentPreset] = useState<'life' | 'tribute'>(
    personStatus === 'passed' ? 'tribute' : 'life'
  )
  const [isInitialized, setIsInitialized] = useState(false)

  // Get the appropriate preset config
  const presetConfig: PresetConfig = currentPreset === 'tribute' 
    ? (tributePreset as PresetConfig)
    : (lifePreset as PresetConfig)

  useEffect(() => {
    // Auto-switch preset based on person status
    const targetPreset = personStatus === 'passed' ? 'tribute' : 'life'
    if (targetPreset !== currentPreset) {
      setCurrentPreset(targetPreset)
    }
  }, [personStatus])

  const initializePreset = async () => {
    if (existingBlocks.length > 0 || isInitialized) {
      // Already has blocks or already initialized
      setIsInitialized(true)
      return
    }

    try {
      // Create default blocks from preset
      const blocksToCreate = presetConfig.defaultBlocks.map((block) => ({
        person_id: personId,
        type: block.type,
        content_json: {},
        block_order: block.order,
        visibility: block.visibility,
        is_enabled: true
      }))

      const { error } = await supabase
        .from('person_page_blocks')
        .insert(blocksToCreate)

      if (error) throw error

      setIsInitialized(true)
    } catch (err) {
      console.error('Error initializing preset:', err)
      throw err
    }
  }

  const switchPreset = async (newPreset: 'life' | 'tribute') => {
    if (newPreset === currentPreset) return

    try {
      // Map existing blocks to new preset equivalents
      const blockMapping: Record<string, string> = {
        // Life → Tribute
        'hero': 'hero_memorial',
        'timeline': 'life_arc_timeline',
        'story_roll': 'story_collage',
        'people_web': 'relationships',
        'guestbook_live': 'guestbook_tribute',
        'notes_from_friends': 'guestbook_tribute',
        'voice_notes': 'audio_remembrances',
        // Tribute → Life
        'hero_memorial': 'hero',
        'life_arc_timeline': 'timeline',
        'story_collage': 'story_roll',
        'audio_remembrances': 'voice_notes',
        'gallery': 'photos',
        'guestbook_tribute': 'notes_from_friends',
        'service_events': 'now_next'
      }

      // Update existing blocks to match new preset
      for (const block of existingBlocks) {
        const newType = blockMapping[block.type] || block.type
        
        if (newType !== block.type) {
          await supabase
            .from('person_page_blocks')
            .update({ type: newType })
            .eq('id', block.id)
        }
      }

      // Add any missing blocks from the new preset
      const existingTypes = existingBlocks.map(b => blockMapping[b.type] || b.type)
      const newPresetConfig = newPreset === 'tribute' ? tributePreset : lifePreset
      const missingBlocks = (newPresetConfig as PresetConfig).defaultBlocks.filter(
        pb => !existingTypes.includes(pb.type)
      )

      if (missingBlocks.length > 0) {
        const maxOrder = Math.max(...existingBlocks.map(b => b.block_order), 0)
        const blocksToCreate = missingBlocks.map((block, index) => ({
          person_id: personId,
          type: block.type,
          content_json: {},
          block_order: maxOrder + index + 1,
          visibility: block.visibility,
          is_enabled: true
        }))

        await supabase
          .from('person_page_blocks')
          .insert(blocksToCreate)
      }

      setCurrentPreset(newPreset)
    } catch (err) {
      console.error('Error switching preset:', err)
      throw err
    }
  }

  return {
    currentPreset,
    presetConfig,
    initializePreset,
    switchPreset,
    isInitialized
  }
}