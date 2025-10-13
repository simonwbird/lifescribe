import { useState, useEffect, useCallback } from 'react'
import { bulkUploadQueue, UploadItem, QueueStats } from '@/lib/bulk/bulkUploadQueue'
import { extractExifData } from '@/lib/bulk/exifExtractor'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function useBulkUpload() {
  const [items, setItems] = useState<UploadItem[]>([])
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    pending: 0,
    processing: 0,
    success: 0,
    failed: 0,
    needsReview: 0
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const updateState = () => {
      setItems(bulkUploadQueue.getAllItems())
      setStats(bulkUploadQueue.getStats())
    }

    updateState()
    const unsubscribe = bulkUploadQueue.subscribe(updateState)
    return unsubscribe
  }, [])

  const addFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      toast({
        title: 'No Images',
        description: 'Please select image files to upload',
        variant: 'destructive'
      })
      return
    }

    const ids = bulkUploadQueue.addFiles(imageFiles)
    
    toast({
      title: 'Files Added',
      description: `${imageFiles.length} images queued for processing`
    })

    return ids
  }, [toast])

  const processItem = useCallback(async (item: UploadItem) => {
    try {
      // Step 1: Extract EXIF
      bulkUploadQueue.updateItem(item.id, { status: 'processing', progress: 10 })
      const exifData = await extractExifData(item.file)

      // Step 2: Upload to storage
      bulkUploadQueue.updateItem(item.id, { progress: 30 })
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: memberData } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .limit(1)
        .single()

      if (!memberData) throw new Error('No family found')

      const fileName = `bulk/${Date.now()}_${item.file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, item.file)

      if (uploadError) throw uploadError

      // Step 3: Detect faces (using AI)
      bulkUploadQueue.updateItem(item.id, { progress: 60 })
      const { data: faceData } = await supabase.functions.invoke('detect-faces', {
        body: { filePath: uploadData.path }
      })

      // Step 4: Create media record
      bulkUploadQueue.updateItem(item.id, { progress: 80 })
      const { error: mediaError } = await supabase.from('media').insert({
        family_id: memberData.family_id,
        file_path: uploadData.path,
        file_name: item.file.name,
        mime_type: item.file.type,
        file_size: item.file.size,
        profile_id: user.id,
        captured_at: exifData.dateTaken || null
      })

      if (mediaError) throw mediaError

      // Determine if needs review
      const needsReview = (faceData?.faces?.length || 0) > 0
      
      bulkUploadQueue.updateItem(item.id, {
        status: needsReview ? 'needs_review' : 'success',
        progress: 100,
        metadata: {
          dateTaken: exifData.dateTaken,
          location: exifData.latitude && exifData.longitude ? {
            lat: exifData.latitude,
            lng: exifData.longitude
          } : undefined,
          faces: faceData?.faces || [],
          personMatches: faceData?.matches || []
        },
        uploadedUrl: uploadData.path
      })

    } catch (error) {
      console.error('Upload failed:', error)
      bulkUploadQueue.updateItem(item.id, {
        status: 'failed',
        error: (error as Error).message
      })
    }
  }, [])

  const startProcessing = useCallback(async () => {
    if (isProcessing) return
    
    setIsProcessing(true)

    while (bulkUploadQueue.hasWork()) {
      const batch = bulkUploadQueue.getNextBatch()
      
      if (batch.length === 0) break

      // Process batch in parallel
      await Promise.all(batch.map(item => processItem(item)))
    }

    setIsProcessing(false)
    
    toast({
      title: 'Processing Complete',
      description: `${stats.success} uploaded, ${stats.failed} failed, ${stats.needsReview} need review`
    })
  }, [isProcessing, processItem, stats, toast])

  const clearCompleted = useCallback(() => {
    bulkUploadQueue.clearCompleted()
  }, [])

  const clearAll = useCallback(() => {
    bulkUploadQueue.clearAll()
  }, [])

  return {
    items,
    stats,
    isProcessing,
    addFiles,
    startProcessing,
    clearCompleted,
    clearAll
  }
}
