import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export type ImportStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed' | 'partial'

interface ImportOptions {
  personId: string
  csvFile: File
  imageFiles: File[]
}

export function usePersonImport() {
  const [status, setStatus] = useState<ImportStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [importResult, setImportResult] = useState<{
    processed: number
    failed: number
    errors: any[]
  } | null>(null)
  const { toast } = useToast()

  const importData = async ({ personId, csvFile, imageFiles }: ImportOptions) => {
    setStatus('uploading')
    setProgress(5)

    try {
      // Read CSV file
      const csvText = await csvFile.text()
      setProgress(10)

      // Upload images to storage
      const imageMapping: Record<string, string> = {}
      
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]
        const filename = file.name
        const filePath = `person-imports/${personId}/${Date.now()}_${filename}`

        setProgress(10 + (i / imageFiles.length) * 40)

        const { data, error } = await supabase.storage
          .from('media')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (error) {
          console.error(`Failed to upload ${filename}:`, error)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath)

        imageMapping[filename] = publicUrl
      }

      setStatus('processing')
      setProgress(60)

      // Call import function
      const { data, error } = await supabase.functions.invoke('import-person-data', {
        body: {
          personId,
          csvData: csvText,
          imageMapping
        }
      })

      if (error) throw error

      setProgress(100)
      
      setImportResult({
        processed: data.processed,
        failed: data.failed,
        errors: data.errors
      })

      if (data.failed === 0) {
        setStatus('completed')
        toast({
          title: 'Import completed',
          description: `Successfully imported ${data.processed} items`,
        })
      } else if (data.processed > 0) {
        setStatus('partial')
        toast({
          title: 'Import partially completed',
          description: `Imported ${data.processed} items, ${data.failed} failed`,
          variant: 'destructive',
        })
      } else {
        setStatus('failed')
        toast({
          title: 'Import failed',
          description: 'No items were imported successfully',
          variant: 'destructive',
        })
      }

      setTimeout(() => {
        if (status !== 'failed') {
          setStatus('idle')
          setProgress(0)
          setImportResult(null)
        }
      }, 5000)

    } catch (error: any) {
      console.error('Import error:', error)
      setStatus('failed')
      toast({
        title: 'Import failed',
        description: error.message || 'An error occurred during import',
        variant: 'destructive',
      })

      setTimeout(() => {
        setStatus('idle')
        setProgress(0)
      }, 3000)
    }
  }

  const reset = () => {
    setStatus('idle')
    setProgress(0)
    setImportResult(null)
  }

  return {
    importData,
    status,
    progress,
    importResult,
    isImporting: status === 'uploading' || status === 'processing',
    reset
  }
}
