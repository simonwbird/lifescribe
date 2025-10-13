/**
 * Offline Queue for Audio Captures
 * Handles local storage and sync of recordings made while offline
 */

export type SyncStatus = 'queued' | 'syncing' | 'synced' | 'failed'

export interface QueuedCapture {
  id: string
  audioBlob: Blob
  metadata: {
    title: string
    content: string
    recordingTime: number
    capturedAt: string
  }
  syncStatus: SyncStatus
  syncAttempts: number
  lastSyncAttempt?: string
  error?: string
}

const QUEUE_STORAGE_KEY = 'lifescribe_offline_queue'
const MAX_SYNC_ATTEMPTS = 3

class OfflineQueueManager {
  private listeners: Set<() => void> = new Set()

  // Add capture to queue
  async addToQueue(capture: Omit<QueuedCapture, 'id' | 'syncStatus' | 'syncAttempts'>): Promise<string> {
    const id = `capture_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const queueItem: QueuedCapture = {
      id,
      ...capture,
      syncStatus: 'queued',
      syncAttempts: 0
    }

    // Convert blob to base64 for storage
    const base64Audio = await this.blobToBase64(capture.audioBlob)
    
    const queue = this.getQueue()
    queue.push({
      ...queueItem,
      audioBlob: base64Audio as any // Store as base64 string
    })
    
    this.saveQueue(queue)
    this.notifyListeners()
    
    return id
  }

  // Get all queued items
  getQueue(): QueuedCapture[] {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY)
      if (!stored) return []
      
      const queue = JSON.parse(stored)
      return queue.map((item: any) => ({
        ...item,
        audioBlob: this.base64ToBlob(item.audioBlob)
      }))
    } catch (error) {
      console.error('Failed to load queue:', error)
      return []
    }
  }

  // Get unsynced count
  getUnsyncedCount(): number {
    const queue = this.getQueue()
    return queue.filter(item => item.syncStatus !== 'synced').length
  }

  // Update sync status
  updateSyncStatus(id: string, status: SyncStatus, error?: string): void {
    const queue = this.getQueue()
    const item = queue.find(q => q.id === id)
    
    if (item) {
      item.syncStatus = status
      item.syncAttempts++
      item.lastSyncAttempt = new Date().toISOString()
      if (error) item.error = error
      
      this.saveQueue(queue)
      this.notifyListeners()
    }
  }

  // Remove synced item
  removeSynced(id: string): void {
    let queue = this.getQueue()
    queue = queue.filter(item => item.id !== id)
    this.saveQueue(queue)
    this.notifyListeners()
  }

  // Get items ready for sync
  getItemsToSync(): QueuedCapture[] {
    const queue = this.getQueue()
    return queue.filter(item => 
      item.syncStatus === 'queued' || 
      (item.syncStatus === 'failed' && item.syncAttempts < MAX_SYNC_ATTEMPTS)
    )
  }

  // Subscribe to queue changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }

  private saveQueue(queue: any[]): void {
    try {
      const toStore = queue.map(item => ({
        ...item,
        audioBlob: typeof item.audioBlob === 'string' 
          ? item.audioBlob 
          : this.blobToBase64Sync(item.audioBlob)
      }))
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(toStore))
    } catch (error) {
      console.error('Failed to save queue:', error)
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  private blobToBase64Sync(blob: Blob): string {
    // Fallback sync version (should not be used ideally)
    return URL.createObjectURL(blob)
  }

  private base64ToBlob(base64: string): Blob {
    try {
      const arr = base64.split(',')
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'audio/webm'
      const bstr = atob(arr[1])
      let n = bstr.length
      const u8arr = new Uint8Array(n)
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n)
      }
      return new Blob([u8arr], { type: mime })
    } catch (error) {
      console.error('Failed to convert base64 to blob:', error)
      return new Blob([], { type: 'audio/webm' })
    }
  }
}

export const offlineQueue = new OfflineQueueManager()
