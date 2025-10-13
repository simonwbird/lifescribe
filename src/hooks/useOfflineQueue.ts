import { useState, useEffect } from 'react'
import { offlineQueue, QueuedCapture, SyncStatus } from '@/lib/offline/offlineQueue'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedCapture[]>([])
  const [unsyncedCount, setUnsyncedCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const { toast } = useToast()

  // Subscribe to queue changes
  useEffect(() => {
    const updateQueue = () => {
      setQueue(offlineQueue.getQueue())
      setUnsyncedCount(offlineQueue.getUnsyncedCount())
    }

    updateQueue()
    const unsubscribe = offlineQueue.subscribe(updateQueue)
    return unsubscribe
  }, [])

  // Auto-sync when online
  useEffect(() => {
    const handleOnline = () => {
      if (unsyncedCount > 0) {
        toast({
          title: 'Back Online',
          description: `Syncing ${unsyncedCount} queued recording${unsyncedCount > 1 ? 's' : ''}...`,
        })
        syncQueue()
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [unsyncedCount])

  const addToQueue = async (
    audioBlob: Blob,
    metadata: QueuedCapture['metadata']
  ): Promise<string> => {
    const id = await offlineQueue.addToQueue({
      audioBlob,
      metadata
    })

    toast({
      title: 'Recording Queued',
      description: 'Will sync when you\'re back online',
    })

    // Try to sync immediately if online
    if (navigator.onLine) {
      setTimeout(() => syncQueue(), 1000)
    }

    return id
  }

  const syncQueue = async () => {
    if (isSyncing || !navigator.onLine) return

    setIsSyncing(true)
    const itemsToSync = offlineQueue.getItemsToSync()

    for (const item of itemsToSync) {
      try {
        offlineQueue.updateSyncStatus(item.id, 'syncing')

        // Get current user and family
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data: memberData } = await supabase
          .from('members')
          .select('family_id')
          .eq('profile_id', user.id)
          .limit(1)
          .single()

        if (!memberData) throw new Error('No family found')

        // Upload audio
        const fileName = `offline-${item.id}.webm`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media')
          .upload(`audio/${fileName}`, item.audioBlob)

        if (uploadError) throw uploadError

        // Create story
        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .insert({
            title: item.metadata.title,
            content: item.metadata.content,
            family_id: memberData.family_id,
            profile_id: user.id,
            story_type: 'voice'
          })
          .select()
          .single()

        if (storyError) throw storyError

        // Create media record
        await supabase.from('media').insert({
          story_id: storyData.id,
          family_id: memberData.family_id,
          file_path: uploadData.path,
          file_name: fileName,
          mime_type: 'audio/webm',
          file_size: item.audioBlob.size,
          profile_id: user.id
        })

        offlineQueue.updateSyncStatus(item.id, 'synced')
        
        // Remove synced item after a delay
        setTimeout(() => offlineQueue.removeSynced(item.id), 2000)

      } catch (error) {
        console.error('Sync failed for item:', item.id, error)
        offlineQueue.updateSyncStatus(
          item.id, 
          'failed', 
          (error as Error).message
        )
      }
    }

    setIsSyncing(false)

    if (itemsToSync.length > 0) {
      const syncedCount = itemsToSync.filter(
        item => offlineQueue.getQueue().find(q => q.id === item.id)?.syncStatus === 'synced'
      ).length

      if (syncedCount > 0) {
        toast({
          title: 'Sync Complete',
          description: `${syncedCount} recording${syncedCount > 1 ? 's' : ''} synced successfully`,
        })
      }
    }
  }

  return {
    queue,
    unsyncedCount,
    isSyncing,
    addToQueue,
    syncQueue
  }
}
