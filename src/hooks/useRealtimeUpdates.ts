import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeUpdatesOptions {
  table: string
  filter?: { column: string; value: string | number }
  onInsert?: (payload: any) => void
  onUpdate?: (payload: any) => void
  onDelete?: (payload: any) => void
  enabled?: boolean
}

export function useRealtimeUpdates({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true
}: UseRealtimeUpdatesOptions) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setupChannel = useCallback(() => {
    if (!enabled || !table) return

    try {
      const channelName = `realtime-${table}-${filter ? `${filter.column}-${filter.value}` : 'all'}`
      
      let newChannel = supabase.channel(channelName)

      // Handle inserts
      if (onInsert) {
        let insertConfig: any = {
          event: 'INSERT',
          schema: 'public',
          table: table
        }
        
        if (filter) {
          insertConfig.filter = `${filter.column}=eq.${filter.value}`
        }
        
        newChannel = newChannel.on('postgres_changes', insertConfig, (payload) => {
          console.log('Real-time insert:', payload)
          onInsert(payload)
        })
      }

      // Handle updates
      if (onUpdate) {
        let updateConfig: any = {
          event: 'UPDATE',
          schema: 'public',
          table: table
        }
        
        if (filter) {
          updateConfig.filter = `${filter.column}=eq.${filter.value}`
        }
        
        newChannel = newChannel.on('postgres_changes', updateConfig, (payload) => {
          console.log('Real-time update:', payload)
          onUpdate(payload)
        })
      }

      // Handle deletes
      if (onDelete) {
        let deleteConfig: any = {
          event: 'DELETE',
          schema: 'public',
          table: table
        }
        
        if (filter) {
          deleteConfig.filter = `${filter.column}=eq.${filter.value}`
        }
        
        newChannel = newChannel.on('postgres_changes', deleteConfig, (payload) => {
          console.log('Real-time delete:', payload)
          onDelete(payload)
        })
      }

      // Subscribe and handle connection state
      newChannel
        .subscribe((status) => {
          console.log(`Realtime ${table} subscription status:`, status)
          setIsConnected(status === 'SUBSCRIBED')
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setError(`Connection failed: ${status}`)
          } else {
            setError(null)
          }
        })

      setChannel(newChannel)
    } catch (err) {
      console.error('Error setting up realtime channel:', err)
      setError('Failed to establish real-time connection')
    }
  }, [table, filter, onInsert, onUpdate, onDelete, enabled])

  useEffect(() => {
    setupChannel()

    return () => {
      if (channel) {
        console.log(`Cleaning up realtime channel for ${table}`)
        supabase.removeChannel(channel)
        setChannel(null)
        setIsConnected(false)
      }
    }
  }, [setupChannel])

  const reconnect = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel)
      setChannel(null)
    }
    setupChannel()
  }, [channel, setupChannel])

  return {
    isConnected,
    error,
    reconnect
  }
}

// Specialized hooks for common use cases
export function useRealtimeStories(familyId: string) {
  const [stories, setStories] = useState<any[]>([])

  const { isConnected } = useRealtimeUpdates({
    table: 'stories',
    filter: { column: 'family_id', value: familyId },
    onInsert: (payload) => {
      setStories(prev => [payload.new, ...prev])
    },
    onUpdate: (payload) => {
      setStories(prev => prev.map(story => 
        story.id === payload.new.id ? payload.new : story
      ))
    },
    onDelete: (payload) => {
      setStories(prev => prev.filter(story => story.id !== payload.old.id))
    }
  })

  return {
    stories,
    setStories,
    isConnected
  }
}

export function useRealtimeReactions(targetType: string, targetId: string) {
  const [reactions, setReactions] = useState<any[]>([])

  const { isConnected } = useRealtimeUpdates({
    table: 'reactions',
    filter: { column: `${targetType}_id`, value: targetId },
    onInsert: (payload) => {
      setReactions(prev => [...prev, payload.new])
    },
    onUpdate: (payload) => {
      setReactions(prev => prev.map(reaction => 
        reaction.id === payload.new.id ? payload.new : reaction
      ))
    },
    onDelete: (payload) => {
      setReactions(prev => prev.filter(reaction => reaction.id !== payload.old.id))
    }
  })

  return {
    reactions,
    setReactions,
    isConnected
  }
}

export function useRealtimeFamilyMembers(familyId: string) {
  const [members, setMembers] = useState<any[]>([])

  const { isConnected } = useRealtimeUpdates({
    table: 'family_members',
    filter: { column: 'family_id', value: familyId },
    onInsert: (payload) => {
      setMembers(prev => [...prev, payload.new])
    },
    onUpdate: (payload) => {
      setMembers(prev => prev.map(member => 
        member.id === payload.new.id ? payload.new : member
      ))
    },
    onDelete: (payload) => {
      setMembers(prev => prev.filter(member => member.id !== payload.old.id))
    }
  })

  return {
    members,
    setMembers,
    isConnected
  }
}