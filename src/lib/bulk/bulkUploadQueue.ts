/**
 * Bulk Upload Queue Manager
 * Handles processing of large batches with progress tracking
 */

export interface UploadItem {
  id: string
  file: File
  status: 'pending' | 'processing' | 'success' | 'failed' | 'needs_review'
  progress: number
  error?: string
  metadata?: {
    dateTaken?: string
    location?: { lat: number; lng: number; name?: string }
    faces?: FaceDetection[]
    personMatches?: PersonMatch[]
  }
  uploadedUrl?: string
}

export interface FaceDetection {
  id: string
  bbox: { x: number; y: number; width: number; height: number }
  confidence: number
  embedding?: number[]
}

export interface PersonMatch {
  personId: string
  personName: string
  confidence: number
  faceId: string
}

export interface QueueStats {
  total: number
  pending: number
  processing: number
  success: number
  failed: number
  needsReview: number
}

class BulkUploadQueue {
  private items: Map<string, UploadItem> = new Map()
  private listeners: Set<() => void> = new Set()
  private processingLimit = 3 // Process 3 at a time

  addFiles(files: File[]): string[] {
    const ids: string[] = []
    
    files.forEach(file => {
      const id = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const item: UploadItem = {
        id,
        file,
        status: 'pending',
        progress: 0
      }
      this.items.set(id, item)
      ids.push(id)
    })

    this.notifyListeners()
    return ids
  }

  getItem(id: string): UploadItem | undefined {
    return this.items.get(id)
  }

  getAllItems(): UploadItem[] {
    return Array.from(this.items.values())
  }

  updateItem(id: string, updates: Partial<UploadItem>): void {
    const item = this.items.get(id)
    if (item) {
      Object.assign(item, updates)
      this.notifyListeners()
    }
  }

  removeItem(id: string): void {
    this.items.delete(id)
    this.notifyListeners()
  }

  clearCompleted(): void {
    const toRemove: string[] = []
    this.items.forEach((item, id) => {
      if (item.status === 'success') {
        toRemove.push(id)
      }
    })
    toRemove.forEach(id => this.items.delete(id))
    this.notifyListeners()
  }

  clearAll(): void {
    this.items.clear()
    this.notifyListeners()
  }

  getStats(): QueueStats {
    const items = this.getAllItems()
    return {
      total: items.length,
      pending: items.filter(i => i.status === 'pending').length,
      processing: items.filter(i => i.status === 'processing').length,
      success: items.filter(i => i.status === 'success').length,
      failed: items.filter(i => i.status === 'failed').length,
      needsReview: items.filter(i => i.status === 'needs_review').length
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener())
  }

  getNextBatch(): UploadItem[] {
    const pending = this.getAllItems().filter(i => i.status === 'pending')
    return pending.slice(0, this.processingLimit)
  }

  hasWork(): boolean {
    return this.getAllItems().some(i => i.status === 'pending')
  }
}

export const bulkUploadQueue = new BulkUploadQueue()
