import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { selectSpark, interpolateSpark } from '@/lib/sparks/selectSpark'

interface Person {
  id: string
  first_name?: string
  birth_date?: string
  death_date?: string
}

interface Viewer {
  relationship_to_person?: string
}

interface Context {
  type?: 'photo' | 'place' | 'date'
  place?: string
}

interface Spark {
  id: string
  text: string
  category: string
  relationship_targets?: string[]
  seasonal_tags?: string[]
  weight: number
}

const MAX_RECENT_SPARKS = 3

export function useMemorySpark(person: Person, viewer?: Viewer, context?: Context) {
  const [allSparks, setAllSparks] = useState<Spark[]>([])
  const [currentSpark, setCurrentSpark] = useState<Spark | null>(null)
  const [recentIds, setRecentIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  const storageKey = `memory-sparks-${person.id}-${viewer?.relationship_to_person || 'viewer'}`
  
  // Load sparks from database
  useEffect(() => {
    async function loadSparks() {
      try {
        const { data, error } = await supabase
          .from('tribute_sparks')
          .select('*')
          .order('weight', { ascending: false })
        
        if (error) throw error
        if (data) {
          setAllSparks(data)
          
          // Load recent history from localStorage
          const stored = localStorage.getItem(storageKey)
          const recent = stored ? JSON.parse(stored) : []
          setRecentIds(recent)
          
          // Select initial spark
          const selected = selectSpark({ person, viewer, context, recentIds: recent }, data)
          if (selected) {
            setCurrentSpark(selected)
            updateRecentIds(selected.id, recent)
          }
        }
      } catch (error) {
        console.error('Error loading sparks:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadSparks()
  }, [person.id])
  
  const updateRecentIds = useCallback((sparkId: string, currentRecent: string[] = recentIds) => {
    const updated = [sparkId, ...currentRecent.filter(id => id !== sparkId)].slice(0, MAX_RECENT_SPARKS)
    setRecentIds(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
  }, [storageKey, recentIds])
  
  const shuffle = useCallback(() => {
    if (allSparks.length === 0) return
    
    const selected = selectSpark({ person, viewer, context, recentIds }, allSparks)
    if (selected) {
      setCurrentSpark(selected)
      updateRecentIds(selected.id)
    }
  }, [allSparks, person, viewer, context, recentIds, updateRecentIds])
  
  const interpolatedText = currentSpark 
    ? interpolateSpark(currentSpark.text, person, context)
    : null
  
  return {
    currentSpark,
    interpolatedText,
    loading,
    shuffle,
    allSparks
  }
}
