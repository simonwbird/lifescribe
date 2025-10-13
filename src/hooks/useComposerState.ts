import { useState, useCallback, useRef, useEffect } from 'react'
import { DatePrecisionValue } from '@/components/DatePrecisionPicker'
import { PersonTag } from '@/components/composer/PeopleTagger'

export type ComposerMode = 'text' | 'photo' | 'voice' | 'video' | 'mixed'
export type StoryPrivacy = 'private' | 'link_only' | 'public'

export interface ComposerState {
  mode: ComposerMode
  title: string
  content: string
  dateValue: DatePrecisionValue
  placeText: string
  privacy: StoryPrivacy
  photos: File[]
  audioBlob: Blob | null
  audioUrl: string | null
  videoBlob: Blob | null
  videoUrl: string | null
  videoThumbnail: string | null
  transcript: string
  tags: string[]
  peopleTags: PersonTag[]
  linkedPlaces: string[]
  promptId: string | null
}

const STORAGE_KEY = 'universal_composer_state'

export function useComposerState(initialMode: ComposerMode = 'text') {
  // Load from localStorage on init
  const loadState = useCallback((): ComposerState => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          ...parsed,
          mode: parsed.mode ?? initialMode,
          title: parsed.title ?? '',
          content: parsed.content ?? '',
          dateValue: {
            date: parsed.dateValue?.date ? new Date(parsed.dateValue.date) : null,
            precision: parsed.dateValue?.precision ?? 'exact',
            yearOnly: parsed.dateValue?.yearOnly || false
          },
          placeText: parsed.placeText ?? '',
          privacy: parsed.privacy ?? 'private',
          tags: parsed.tags ?? [],
          peopleTags: parsed.peopleTags ?? [],
          linkedPlaces: parsed.linkedPlaces ?? [],
          transcript: parsed.transcript ?? '',
          // Can't store Blobs/Files in localStorage, so reset them
          photos: [],
          audioBlob: null,
          videoBlob: null,
          videoThumbnail: null
        }
      }
    } catch (e) {
      console.error('Failed to load composer state:', e)
    }
    return getDefaultState(initialMode)
  }, [initialMode])

  const [state, setState] = useState<ComposerState>(loadState)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()

  // Auto-save to localStorage (debounced)
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const toSave = {
          ...state,
          // Don't save blobs/files
          photos: [],
          audioBlob: null,
          videoBlob: null,
          videoThumbnail: null
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
      } catch (e) {
        console.error('Failed to save composer state:', e)
      }
    }, 500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [state])

  const updateState = useCallback((updates: Partial<ComposerState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const switchMode = useCallback((mode: ComposerMode) => {
    setState(prev => ({ ...prev, mode }))
  }, [])

  const clearState = useCallback(() => {
    setState(getDefaultState('text'))
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const hasContent = useCallback(() => {
    return (
      state.title.trim().length > 0 ||
      state.content.trim().length > 0 ||
      state.photos.length > 0 ||
      state.audioBlob !== null ||
      state.videoBlob !== null ||
      state.transcript.trim().length > 0
    )
  }, [state])

  return {
    state,
    updateState,
    switchMode,
    clearState,
    hasContent
  }
}

function getDefaultState(mode: ComposerMode): ComposerState {
  return {
    mode,
    title: '',
    content: '',
    dateValue: { date: null, precision: 'exact', yearOnly: false },
    placeText: '',
    privacy: 'private',
    photos: [],
    audioBlob: null,
    audioUrl: null,
    videoBlob: null,
    videoUrl: null,
    videoThumbnail: null,
    transcript: '',
    tags: [],
    peopleTags: [],
    linkedPlaces: [],
    promptId: null
  }
}
