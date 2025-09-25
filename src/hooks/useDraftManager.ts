import { useState, useCallback, useRef, useEffect } from 'react'

export interface DraftData {
  id: string
  content: {
    text?: string
    media?: File[]
    audio?: Blob
    [key: string]: any
  }
  timestamp: number
}

export interface AutosaveStatus {
  status: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved?: Date
  message: string
}

export function useDraftManager(draftKey: string, autosaveInterval = 10000) {
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>({
    status: 'idle',
    message: ''
  })
  const [hasDraft, setHasDraft] = useState(false)
  const autosaveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const draftDataRef = useRef<any>({})

  const getDraftKey = useCallback((key: string) => `draft_${key}`, [])

  const saveDraft = useCallback((data: Omit<DraftData, 'timestamp'>) => {
    try {
      const draft: DraftData = {
        ...data,
        timestamp: Date.now()
      }
      localStorage.setItem(getDraftKey(draftKey), JSON.stringify(draft))
      setAutosaveStatus({
        status: 'saved',
        lastSaved: new Date(),
        message: 'Draft saved'
      })
      setHasDraft(true)
    } catch (error) {
      console.error('Failed to save draft:', error)
      setAutosaveStatus({
        status: 'error',
        message: 'Failed to save draft'
      })
    }
  }, [draftKey, getDraftKey])

  const loadDraft = useCallback((): DraftData | null => {
    try {
      const saved = localStorage.getItem(getDraftKey(draftKey))
      if (saved) {
        const draft = JSON.parse(saved) as DraftData
        // Only load drafts from the last 24 hours
        if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
          setHasDraft(true)
          return draft
        } else {
          localStorage.removeItem(getDraftKey(draftKey))
          setHasDraft(false)
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
    return null
  }, [draftKey, getDraftKey])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(getDraftKey(draftKey))
    setHasDraft(false)
    setAutosaveStatus({ status: 'idle', message: '' })
  }, [draftKey, getDraftKey])

  const startAutosave = useCallback((getDataFn: () => any) => {
    const saveCurrentDraft = () => {
      const data = getDataFn()
      if (data && Object.values(data).some(value => 
        (typeof value === 'string' && value.trim()) || 
        (Array.isArray(value) && value.length > 0) ||
        (value instanceof Blob)
      )) {
        setAutosaveStatus({ status: 'saving', message: 'Saving draft...' })
        saveDraft({
          id: draftKey,
          content: data
        })
      }
    }

    if (autosaveIntervalRef.current) {
      clearInterval(autosaveIntervalRef.current)
    }
    
    autosaveIntervalRef.current = setInterval(saveCurrentDraft, autosaveInterval)
  }, [draftKey, autosaveInterval, saveDraft])

  const stopAutosave = useCallback(() => {
    if (autosaveIntervalRef.current) {
      clearInterval(autosaveIntervalRef.current)
      autosaveIntervalRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutosave()
    }
  }, [stopAutosave])

  return {
    autosaveStatus,
    hasDraft,
    saveDraft,
    loadDraft,
    clearDraft,
    startAutosave,
    stopAutosave
  }
}