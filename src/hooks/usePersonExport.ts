import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export type ExportType = 'json' | 'pdf'
export type ExportStatus = 'idle' | 'processing' | 'completed' | 'failed'

interface ExportOptions {
  personId: string
  exportType: ExportType
  includePrivate?: boolean
}

export function usePersonExport() {
  const [status, setStatus] = useState<ExportStatus>('idle')
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const exportPerson = async ({ personId, exportType, includePrivate = false }: ExportOptions) => {
    setStatus('processing')
    setProgress(10)

    try {
      const { data, error } = await supabase.functions.invoke('export-person-data', {
        body: {
          personId,
          exportType,
          includePrivate
        }
      })

      if (error) throw error

      setProgress(70)

      if (exportType === 'json') {
        // Download JSON directly
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `person_export_${Date.now()}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else if (exportType === 'pdf') {
        // For PDF, we'll use html2pdf on the client side
        const html2pdf = (await import('html2pdf.js')).default
        
        setProgress(80)

        const opt = {
          margin: 10,
          filename: `minibook_${Date.now()}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        }

        const element = document.createElement('div')
        element.innerHTML = data.html
        await html2pdf().set(opt).from(element).save()
      }

      setProgress(100)
      setStatus('completed')

      toast({
        title: 'Export completed',
        description: `Successfully exported as ${exportType.toUpperCase()}`,
      })

      setTimeout(() => {
        setStatus('idle')
        setProgress(0)
      }, 2000)

    } catch (error: any) {
      console.error('Export error:', error)
      setStatus('failed')
      toast({
        title: 'Export failed',
        description: error.message || 'An error occurred during export',
        variant: 'destructive',
      })

      setTimeout(() => {
        setStatus('idle')
        setProgress(0)
      }, 3000)
    }
  }

  return {
    exportPerson,
    status,
    progress,
    isExporting: status === 'processing'
  }
}
