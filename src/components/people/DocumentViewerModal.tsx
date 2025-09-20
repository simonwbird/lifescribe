import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker
interface Document {
  id: string
  file_name: string
  file_path: string
  mime_type: string
  file_size: number
  created_at: string
  profile_id: string
  transcript_text?: string
}

interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  document: Document | null
  familyId: string
}

export function DocumentViewerModal({ isOpen, onClose, document, familyId }: DocumentViewerModalProps) {
  const [documentUrl, setDocumentUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [useObjectViewer, setUseObjectViewer] = useState(false)

  useEffect(() => {
    if (isOpen && document) {
      loadDocument()
    } else {
      // Clean up the blob URL when modal closes
      if (documentUrl && documentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(documentUrl)
      }
      setPdfData(null)
      setUseObjectViewer(false)
      setDocumentUrl('')
    }
  }, [isOpen, document])

  const loadDocument = async () => {
    if (!document) return

    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      console.log('Fetching document content directly...')

      // Fetch the document content using fetch with auth header
      const supabaseUrl = 'https://imgtnixyralpdrmedwzi.supabase.co'
      const response = await fetch(`${supabaseUrl}/functions/v1/document-viewer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: document.file_path,
          familyId: familyId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`)
      }

      const fileBlob = await response.blob()
      
      // If PDF, prepare PDF.js data and ensure correct blob MIME
      if (document.mime_type === 'application/pdf') {
        const ab = await fileBlob.arrayBuffer()
        const pdfBytes = new Uint8Array(ab)
        setPdfData(pdfBytes)

        // Create a Blob with the explicit PDF MIME type for reliable <object> rendering
        const typedPdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })
        const blobUrl = URL.createObjectURL(typedPdfBlob)
        console.log('Created blob URL for PDF document with correct MIME')
        setDocumentUrl(blobUrl)
      } else {
        setPdfData(null)
        // Create blob URL for fallback/other types
        const blobUrl = URL.createObjectURL(fileBlob)
        console.log('Created blob URL for document')
        setDocumentUrl(blobUrl)
      }
    } catch (error) {
      console.error('Error loading document:', error)
      setError('Failed to load document. Please try again.')
      toast({
        title: "Failed to load document",
        description: "Could not load the document for viewing.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadDocument = async () => {
    if (!document) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      const supabaseUrl = 'https://imgtnixyralpdrmedwzi.supabase.co'
      const downloadUrl = `${supabaseUrl}/functions/v1/document-viewer?filePath=${encodeURIComponent(document.file_path)}&familyId=${encodeURIComponent(familyId)}&token=${encodeURIComponent(session.access_token)}`
      
      // Create a temporary link to download the file
      const link = window.document.createElement('a')
      link.href = downloadUrl
      link.download = document.file_name
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the document.",
        variant: "destructive"
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const renderDocumentContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading document...</span>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadDocument} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    if (documentUrl && document) {
      if (document.mime_type === 'application/pdf') {
        if (!pdfData) {
          return (
            <div className="flex items-center justify-center h-96">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Preparing PDF...</span>
              </div>
            </div>
          )
        }
        return (
          <div className="w-full max-h-[70vh] overflow-auto border rounded-lg bg-background p-2">
            {useObjectViewer ? (
              <object data={documentUrl} type="application/pdf" width="100%" height="800">
                <div className="p-6 text-center text-muted-foreground">
                  Failed to load PDF. You can
                  <Button onClick={downloadDocument} variant="outline" className="ml-2">Download</Button>
                  instead.
                </div>
              </object>
            ) : (
              <PdfDocument 
                file={{ data: pdfData }} 
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                onLoadError={(err) => { console.error('PDF.js load error', err); setUseObjectViewer(true); }}
              >
                {Array.from({ length: numPages }, (_, i) => (
                  <Page key={`page_${i + 1}`} pageNumber={i + 1} width={800} />
                ))}
              </PdfDocument>
            )}
          </div>
        )
      } else if (
        document.mime_type.startsWith('text/') ||
        document.mime_type.includes('document') ||
        document.mime_type.includes('sheet')
      ) {
        return (
          <iframe
            src={documentUrl}
            className="w-full h-96 border rounded-lg bg-background"
            title={document.file_name}
            style={{ minHeight: '600px' }}
          />
        )
      }

      // For other file types, show a preview message
      return (
        <div className="flex items-center justify-center h-96 border rounded-lg bg-muted/20">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Preview not available for this file type
            </p>
            <Button onClick={downloadDocument} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download to view
            </Button>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <DialogTitle className="text-lg truncate">
                {document?.file_name || 'Document'}
              </DialogTitle>
              {document && (
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>{formatFileSize(document.file_size)}</span>
                  <span>•</span>
                  <span>{new Date(document.created_at).toLocaleDateString()}</span>
                  {document.transcript_text && (
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      {document.transcript_text}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadDocument}
                disabled={!document}
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6">
          {renderDocumentContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}