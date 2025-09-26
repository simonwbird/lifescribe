import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAnalytics } from '@/hooks/useAnalytics'

interface PromptCard {
  id: string
  title: string
  description: string
  theme: 'family' | 'childhood' | 'wisdom' | 'adventure' | 'love' | 'tradition'
  illustration?: string
  examples?: string[]
  difficulty: 'easy' | 'medium' | 'deep'
  estimatedTime: string
  personalityTags?: string[]
  category?: string
}

interface UserPromptHistory {
  promptId: string
  usedAt: Date
  completed: boolean
  topics?: string[]
  responseLength?: number
}

interface PromptSequencingState {
  currentPrompt: PromptCard | null
  availablePrompts: PromptCard[]
  history: UserPromptHistory[]
  streak: number
  progress: number
  personalizationLevel: number
  preferredThemes: string[]
  loading: boolean
}

// Mock prompt database - in real app this would come from Supabase
const PROMPT_DATABASE: PromptCard[] = [
  {
    id: 'childhood-toy',
    title: 'Your favorite childhood toy',
    description: 'Tell us about a toy that brought you joy as a child',
    theme: 'childhood',
    difficulty: 'easy',
    estimatedTime: '2-3 min',
    examples: [
      'I had this teddy bear named...',
      'My favorite toy was a set of blocks...',
      'I remember playing with my toy car...'
    ],
    personalityTags: ['nostalgic', 'playful', 'sentimental']
  },
  {
    id: 'family-recipe',
    title: 'A treasured family recipe',
    description: 'Share the story behind a recipe that\'s been passed down in your family',
    theme: 'family',
    difficulty: 'medium',
    estimatedTime: '4-5 min',
    examples: [
      'My grandmother\'s secret ingredient was...',
      'Every holiday, we would make...',
      'This recipe has been in our family for...'
    ],
    personalityTags: ['traditional', 'culinary', 'heritage']
  },
  {
    id: 'life-lesson',
    title: 'A lesson that changed everything',
    description: 'Tell about a moment when you learned something that shaped who you are',
    theme: 'wisdom',
    difficulty: 'deep',
    estimatedTime: '5-7 min',
    examples: [
      'I learned that kindness really does...',
      'My father taught me that...',
      'I discovered that failure is actually...'
    ],
    personalityTags: ['reflective', 'philosophical', 'growth']
  },
  {
    id: 'first-adventure',
    title: 'Your first big adventure',
    description: 'Describe the first time you ventured somewhere new and exciting',
    theme: 'adventure',
    difficulty: 'medium',
    estimatedTime: '3-4 min',
    examples: [
      'The first time I traveled alone...',
      'I remember my first day at summer camp...',
      'When I finally worked up the courage to...'
    ],
    personalityTags: ['adventurous', 'brave', 'exploratory']
  },
  {
    id: 'love-story',
    title: 'How you knew it was love',
    description: 'Share the moment you realized you were truly in love',
    theme: 'love',
    difficulty: 'deep',
    estimatedTime: '4-6 min',
    examples: [
      'I knew it was love when...',
      'The moment that changed everything was...',
      'Looking back, I realize that...'
    ],
    personalityTags: ['romantic', 'emotional', 'intimate']
  },
  {
    id: 'holiday-tradition',
    title: 'A holiday tradition you treasure',
    description: 'Tell about a holiday tradition that makes the season special',
    theme: 'tradition',
    difficulty: 'easy',
    estimatedTime: '3-4 min',
    examples: [
      'Every year on Christmas morning...',
      'Our family always celebrates by...',
      'The tradition started when...'
    ],
    personalityTags: ['traditional', 'celebratory', 'family-oriented']
  }
]

export function usePromptSequencing() {
  const { track } = useAnalytics()
  const [state, setState] = useState<PromptSequencingState>({
    currentPrompt: null,
    availablePrompts: [],
    history: [],
    streak: 0,
    progress: 0,
    personalizationLevel: 0,
    preferredThemes: [],
    loading: true
  })

  // Load user's prompt history and personalization data
  useEffect(() => {
    loadUserPromptData()
  }, [])

  const loadUserPromptData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load user's prompt history
      const { data: historyData } = await supabase
        .from('user_prompt_history')
        .select('*')
        .eq('user_id', user.id)
        .order('used_at', { ascending: false })

      // Load user's streak data
      const { data: streakData } = await supabase
        .from('user_streaks')
        .select('current_streak, longest_streak, total_completed')
        .eq('user_id', user.id)
        .maybeSingle()

      const history: UserPromptHistory[] = historyData?.map(item => ({
        promptId: item.prompt_id,
        usedAt: new Date(item.used_at),
        completed: item.completed,
        topics: item.response_topics || [],
        responseLength: item.response_length
      })) || []

      const streak = streakData?.current_streak || 0
      const totalCompleted = streakData?.total_completed || 0
      const progress = Math.min((totalCompleted % 7) * (100 / 7), 100)
      
      // Determine personalization level and preferred themes
      const personalizationLevel = Math.min(Math.floor(totalCompleted / 3), 5)
      const preferredThemes = extractPreferredThemes(history)

      // Get current prompt
      const currentPrompt = selectNextPrompt(history, personalizationLevel, preferredThemes)
      const availablePrompts = getAvailablePrompts(history)

      setState({
        currentPrompt,
        availablePrompts,
        history,
        streak,
        progress,
        personalizationLevel,
        preferredThemes,
        loading: false
      })

    } catch (error) {
      console.error('Error loading prompt data:', error)
      // Fallback to default state
      const defaultPrompt = PROMPT_DATABASE[0]
      setState({
        currentPrompt: defaultPrompt,
        availablePrompts: PROMPT_DATABASE,
        history: [],
        streak: 0,
        progress: 0,
        personalizationLevel: 0,
        preferredThemes: [],
        loading: false
      })
    }
  }

  const extractPreferredThemes = (history: UserPromptHistory[]): string[] => {
    const completedPrompts = history.filter(h => h.completed)
    if (completedPrompts.length < 3) return []

    const themeCounts: Record<string, number> = {}
    
    completedPrompts.forEach(h => {
      const prompt = PROMPT_DATABASE.find(p => p.id === h.promptId)
      if (prompt) {
        themeCounts[prompt.theme] = (themeCounts[prompt.theme] || 0) + 1
      }
    })

    return Object.entries(themeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([theme]) => theme)
  }

  const selectNextPrompt = (
    history: UserPromptHistory[], 
    personalizationLevel: number, 
    preferredThemes: string[]
  ): PromptCard => {
    const usedRecently = new Set(
      history
        .filter(h => {
          const daysSince = (Date.now() - h.usedAt.getTime()) / (1000 * 60 * 60 * 24)
          return daysSince < 14
        })
        .map(h => h.promptId)
    )

    let availablePrompts = PROMPT_DATABASE.filter(p => !usedRecently.has(p.id))
    
    if (availablePrompts.length === 0) {
      availablePrompts = PROMPT_DATABASE // Fallback if all prompts used recently
    }

    // Apply smart sequencing based on personalization level
    if (personalizationLevel >= 3 && preferredThemes.length > 0) {
      // Personalized selection - prefer themes user has engaged with
      const preferredPrompts = availablePrompts.filter(p => 
        preferredThemes.includes(p.theme)
      )
      
      if (preferredPrompts.length > 0) {
        availablePrompts = preferredPrompts
      }
    }

    // Theme rotation logic - avoid same theme as last prompt
    const lastPrompt = history[0]
    if (lastPrompt && availablePrompts.length > 1) {
      const lastPromptData = PROMPT_DATABASE.find(p => p.id === lastPrompt.promptId)
      if (lastPromptData) {
        const differentThemePrompts = availablePrompts.filter(p => 
          p.theme !== lastPromptData.theme
        )
        if (differentThemePrompts.length > 0) {
          availablePrompts = differentThemePrompts
        }
      }
    }

    // Progressive difficulty based on user experience
    const userLevel = Math.min(Math.floor(history.filter(h => h.completed).length / 5), 2)
    const difficulties = ['easy', 'medium', 'deep']
    const maxDifficulty = difficulties[userLevel]
    
    const appropriateDifficulty = availablePrompts.filter(p => {
      const difficultyIndex = difficulties.indexOf(p.difficulty)
      const maxIndex = difficulties.indexOf(maxDifficulty)
      return difficultyIndex <= maxIndex
    })

    if (appropriateDifficulty.length > 0) {
      availablePrompts = appropriateDifficulty
    }

    // Random selection from filtered prompts
    return availablePrompts[Math.floor(Math.random() * availablePrompts.length)]
  }

  const getAvailablePrompts = (history: UserPromptHistory[]): PromptCard[] => {
    // Return all prompts for browsing, but mark recently used ones
    return PROMPT_DATABASE
  }

  const shufflePrompt = useCallback(async () => {
    track('prompt.shuffle', { 
      currentPromptId: state.currentPrompt?.id,
      personalizationLevel: state.personalizationLevel 
    })

    const newPrompt = selectNextPrompt(
      state.history, 
      state.personalizationLevel, 
      state.preferredThemes
    )

    setState(prev => ({
      ...prev,
      currentPrompt: newPrompt
    }))

    // Record the shuffle in database
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && newPrompt) {
        await supabase.from('user_prompt_history').insert({
          user_id: user.id,
          prompt_id: newPrompt.id,
          used_at: new Date().toISOString(),
          completed: false,
          action: 'shuffled'
        })
      }
    } catch (error) {
      console.error('Error recording shuffle:', error)
    }
  }, [state, track])

  const markPromptCompleted = useCallback(async (
    promptId: string, 
    responseLength: number, 
    topics: string[] = []
  ) => {
    track('create_item_selected', { 
      promptId, 
      responseLength, 
      topics: topics.join(','),
      personalizationLevel: state.personalizationLevel 
    })

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update prompt history
      await supabase.from('user_prompt_history').upsert({
        user_id: user.id,
        prompt_id: promptId,
        used_at: new Date().toISOString(),
        completed: true,
        response_length: responseLength,
        response_topics: topics
      })

      // Update streak using the database function
      const { data: streakResult } = await supabase
        .rpc('update_user_streak', {
          p_user_id: user.id,
          p_completed_today: true
        })
        .single()

      if (streakResult) {
        // Update local state
        setState(prev => ({
          ...prev,
          streak: streakResult.current_streak,
          progress: Math.min((streakResult.total_completed % 7) * (100 / 7), 100),
          personalizationLevel: Math.min(Math.floor(streakResult.total_completed / 3), 5)
        }))
      }

      // Reload prompt data to get fresh recommendations
      setTimeout(loadUserPromptData, 1000)

    } catch (error) {
      console.error('Error marking prompt completed:', error)
    }
  }, [state, track])

  return {
    ...state,
    shufflePrompt,
    markPromptCompleted,
    refreshPrompts: loadUserPromptData
  }
}