import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthProvider'
import { ABTest, ABVariant, ABAssignment } from '@/types/analytics'

export function useABTesting() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  // Load user's test assignments
  useEffect(() => {
    if (!user?.id) return

    const loadAssignments = async () => {
      try {
        // In a real implementation, this would query the AB test assignments table
        // For now, we'll simulate it with localStorage for demo purposes
        const stored = localStorage.getItem(`ab_assignments_${user.id}`)
        if (stored) {
          setAssignments(JSON.parse(stored))
        }
      } catch (error) {
        console.error('Failed to load AB assignments:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAssignments()
  }, [user?.id])

  // Get variant for a specific test
  const getVariant = useCallback(async (testId: string): Promise<string | null> => {
    if (!user?.id) return null

    // Check existing assignment
    if (assignments[testId]) {
      return assignments[testId]
    }

    try {
      // Simulate AB test configuration (in real app, this would come from database)
      const activeTests: Record<string, ABTest> = {
        'prompt_visual_test': {
          id: 'prompt_visual_test',
          name: 'Prompt Visual Design Test',
          status: 'active',
          traffic_allocation: 50,
          variants: [
            { id: 'control', name: 'Control', allocation: 50, config: { style: 'default' } },
            { id: 'visual_enhanced', name: 'Enhanced Visual', allocation: 50, config: { style: 'enhanced', showIcons: true } }
          ],
          metrics: ['prompt_view', 'story_start']
        },
        'cta_copy_test': {
          id: 'cta_copy_test',
          name: 'CTA Copy Test',
          status: 'active',
          traffic_allocation: 100,
          variants: [
            { id: 'control', name: 'Create Story', allocation: 33, config: { text: 'Create Story' } },
            { id: 'variant_a', name: 'Share Memory', allocation: 33, config: { text: 'Share Memory' } },
            { id: 'variant_b', name: 'Record Story', allocation: 34, config: { text: 'Record Story' } }
          ],
          metrics: ['story_start', 'story_save']
        },
        'card_density_test': {
          id: 'card_density_test',
          name: 'Card Density Test',
          status: 'active',
          traffic_allocation: 80,
          variants: [
            { id: 'control', name: 'Standard', allocation: 50, config: { density: 'standard', cardsPerRow: 3 } },
            { id: 'compact', name: 'Compact', allocation: 50, config: { density: 'compact', cardsPerRow: 4 } }
          ],
          metrics: ['prompt_view', 'prompt_shuffle']
        }
      }

      const test = activeTests[testId]
      if (!test || test.status !== 'active') return null

      // Check if user should be included in test
      const userHash = hashUserId(user.id, testId)
      const shouldInclude = userHash < test.traffic_allocation

      if (!shouldInclude) return null

      // Assign variant based on hash
      let cumulativeAllocation = 0
      let assignedVariant = test.variants[0].id

      for (const variant of test.variants) {
        cumulativeAllocation += variant.allocation
        if (userHash < cumulativeAllocation) {
          assignedVariant = variant.id
          break
        }
      }

      // Store assignment
      const newAssignments = { ...assignments, [testId]: assignedVariant }
      setAssignments(newAssignments)
      localStorage.setItem(`ab_assignments_${user.id}`, JSON.stringify(newAssignments))

      return assignedVariant
    } catch (error) {
      console.error('Failed to get AB variant:', error)
      return null
    }
  }, [user?.id, assignments])

  // Get test configuration for a variant
  const getTestConfig = useCallback(async (testId: string): Promise<Record<string, any> | null> => {
    const variant = await getVariant(testId)
    if (!variant) return null

    const activeTests: Record<string, ABTest> = {
      'prompt_visual_test': {
        id: 'prompt_visual_test',
        name: 'Prompt Visual Design Test',
        status: 'active',
        traffic_allocation: 50,
        variants: [
          { id: 'control', name: 'Control', allocation: 50, config: { style: 'default' } },
          { id: 'visual_enhanced', name: 'Enhanced Visual', allocation: 50, config: { style: 'enhanced', showIcons: true } }
        ],
        metrics: ['prompt_view', 'story_start']
      },
      'cta_copy_test': {
        id: 'cta_copy_test',
        name: 'CTA Copy Test',
        status: 'active',
        traffic_allocation: 100,
        variants: [
          { id: 'control', name: 'Create Story', allocation: 33, config: { text: 'Create Story' } },
          { id: 'variant_a', name: 'Share Memory', allocation: 33, config: { text: 'Share Memory' } },
          { id: 'variant_b', name: 'Record Story', allocation: 34, config: { text: 'Record Story' } }
        ],
        metrics: ['story_start', 'story_save']
      },
      'card_density_test': {
        id: 'card_density_test',
        name: 'Card Density Test',
        status: 'active',
        traffic_allocation: 80,
        variants: [
          { id: 'control', name: 'Standard', allocation: 50, config: { density: 'standard', cardsPerRow: 3 } },
          { id: 'compact', name: 'Compact', allocation: 50, config: { density: 'compact', cardsPerRow: 4 } }
        ],
        metrics: ['prompt_view', 'prompt_shuffle']
      }
    }

    const test = activeTests[testId]
    const variantConfig = test?.variants.find(v => v.id === variant)
    return variantConfig?.config || null
  }, [getVariant])

  return {
    getVariant,
    getTestConfig,
    assignments,
    loading
  }
}

// Simple hash function for consistent user bucketing
function hashUserId(userId: string, testId: string): number {
  const str = `${userId}_${testId}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash) % 100
}