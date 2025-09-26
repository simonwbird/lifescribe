import { useState, useCallback, useRef, useEffect } from 'react'
import type { DraftData, AutosaveStatus } from './useDraftManager'

export interface UnifiedDraftData extends DraftData {
  type: 'text' | 'audio' | 'photo' | 'video'
  title?: string
  content: {
    text?: string
    media?: File[]
    audio?: Blob
    video?: Blob
    [key: string]: any
  }
}

export interface UnifiedDraftManager {
  autosaveStatus: AutosaveStatus
  availableDrafts: UnifiedDraftData[]
  hasDrafts: boolean
  saveDraft: (data: Omit<UnifiedDraftData, 'timestamp'>) => void
  loadDraft: (draftId: string) => UnifiedDraftData | null
  loadAllDrafts: () => UnifiedDraftData[]
  clearDraft: (draftId: string) => void
  clearAllDrafts: () => void
  startAutosave: (getDataFn: () => any, type: UnifiedDraftData['type']) => void
  stopAutosave: () => void
}

export function useUnifiedDraftManager(draftKeyPrefix = 'unified', autosaveInterval = 5000): UnifiedDraftManager {
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>({
    status: 'idle',
    message: ''
  })
  const [availableDrafts, setAvailableDrafts] = useState<UnifiedDraftData[]>([])
  const [hasDrafts, setHasDrafts] = useState(false)
  
  const autosaveIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentDraftIdRef = useRef<string | null>(null)

  const getDraftKey = useCallback((id: string) => `draft_${draftKeyPrefix}_${id}`, [draftKeyPrefix])
  const getDraftListKey = useCallback(() => `draft_list_${draftKeyPrefix}`, [draftKeyPrefix])

  const updateDraftList = useCallback(() => {
    try {
      const draftListKey = getDraftListKey()
      const storedList = localStorage.getItem(draftListKey)
      const draftIds: string[] = storedList ? JSON.parse(storedList) : []
      
      const validDrafts: UnifiedDraftData[] = []
      const validIds: string[] = []
      
      draftIds.forEach(id => {
        const draftKey = getDraftKey(id)
        const stored = localStorage.getItem(draftKey)
        if (stored) {
          try {
            const draft = JSON.parse(stored) as UnifiedDraftData
            // Only keep drafts from the last 24 hours
            if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
              validDrafts.push(draft)
              validIds.push(id)
            } else {
              localStorage.removeItem(draftKey)
            }
          } catch (error) {
            localStorage.removeItem(draftKey)
          }
        }
      })
      
      // Update the draft list with valid IDs only
      localStorage.setItem(draftListKey, JSON.stringify(validIds))
      
      setAvailableDrafts(validDrafts)
      setHasDrafts(validDrafts.length > 0)
    } catch (error) {
      console.error('Failed to update draft list:', error)
    }
  }, [getDraftKey, getDraftListKey])

  const saveDraft = useCallback((data: Omit<UnifiedDraftData, 'timestamp'>) => {
    try {
      const draft: UnifiedDraftData = {
        ...data,
        timestamp: Date.now()
      }
      
      const draftKey = getDraftKey(draft.id)
      localStorage.setItem(draftKey, JSON.stringify(draft))
      
      // Update draft list
      const draftListKey = getDraftListKey()
      const storedList = localStorage.getItem(draftListKey)
      const draftIds: string[] = storedList ? JSON.parse(storedList) : []
      
      if (!draftIds.includes(draft.id)) {
        draftIds.push(draft.id)
        localStorage.setItem(draftListKey, JSON.stringify(draftIds))
      }
      
      setAutosaveStatus({
        status: 'saved',
        lastSaved: new Date(),
        message: 'Your progress is saved'
      })
      
      updateDraftList()
    } catch (error) {
      console.error('Failed to save draft:', error)
      setAutosaveStatus({
        status: 'error',
        message: 'Failed to save draft'
      })
    }
  }, [getDraftKey, getDraftListKey, updateDraftList])

  const loadDraft = useCallback((draftId: string): UnifiedDraftData | null => {
    try {
      const draftKey = getDraftKey(draftId)
      const stored = localStorage.getItem(draftKey)
      if (stored) {
        const draft = JSON.parse(stored) as UnifiedDraftData
        // Only load recent drafts
        if (Date.now() - draft.timestamp < 24 * 60 * 60 * 1000) {
          return draft
        } else {
          clearDraft(draftId)
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
    return null
  }, [getDraftKey])

  const loadAllDrafts = useCallback((): UnifiedDraftData[] => {
    updateDraftList()
    return availableDrafts
  }, [availableDrafts, updateDraftList])

  const clearDraft = useCallback((draftId: string) => {
    try {
      const draftKey = getDraftKey(draftId)
      localStorage.removeItem(draftKey)
      
      // Update draft list
      const draftListKey = getDraftListKey()
      const storedList = localStorage.getItem(draftListKey)
      const draftIds: string[] = storedList ? JSON.parse(storedList) : []
      const updatedIds = draftIds.filter(id => id !== draftId)
      localStorage.setItem(draftListKey, JSON.stringify(updatedIds))
      
      updateDraftList()
    } catch (error) {
      console.error('Failed to clear draft:', error)
    }
  }, [getDraftKey, getDraftListKey, updateDraftList])

  const clearAllDrafts = useCallback(() => {
    try {
      const draftListKey = getDraftListKey()
      const storedList = localStorage.getItem(draftListKey)
      const draftIds: string[] = storedList ? JSON.parse(storedList) : []
      
      draftIds.forEach(id => {
        const draftKey = getDraftKey(id)
        localStorage.removeItem(draftKey)
      })
      
      localStorage.removeItem(draftListKey)
      setAvailableDrafts([])
      setHasDrafts(false)
      setAutosaveStatus({ status: 'idle', message: '' })
    } catch (error) {
      console.error('Failed to clear all drafts:', error)
    }
  }, [getDraftKey, getDraftListKey])

  const startAutosave = useCallback((getDataFn: () => any, type: UnifiedDraftData['type']) => {
    currentDraftIdRef.current = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const saveCurrentDraft = () => {
      const data = getDataFn()
      if (data && Object.values(data).some(value => 
        (typeof value === 'string' && value.trim()) || 
        (Array.isArray(value) && value.length > 0) ||
        (value instanceof Blob) ||
        (value instanceof File)
      )) {
        setAutosaveStatus({ status: 'saving', message: 'Saving draft...' })
        saveDraft({
          id: currentDraftIdRef.current!,
          type,
          content: data
        })
      }
    }

    if (autosaveIntervalRef.current) {
      clearInterval(autosaveIntervalRef.current)
    }
    
    autosaveIntervalRef.current = setInterval(saveCurrentDraft, autosaveInterval)
  }, [autosaveInterval, saveDraft])

  const stopAutosave = useCallback(() => {
    if (autosaveIntervalRef.current) {
      clearInterval(autosaveIntervalRef.current)
      autosaveIntervalRef.current = null
    }
    currentDraftIdRef.current = null
  }, [])

  // Initialize drafts on mount
  useEffect(() => {
    updateDraftList()
  }, [updateDraftList])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutosave()
    }
  }, [stopAutosave])

  return {
    autosaveStatus,
    availableDrafts,
    hasDrafts,
    saveDraft,
    loadDraft,
    loadAllDrafts,
    clearDraft,
    clearAllDrafts,
    startAutosave,
    stopAutosave
  }
}
