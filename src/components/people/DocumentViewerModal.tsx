import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, X, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'

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

  useEffect(() => {
    if (isOpen && document) {
      loadDocument()
    } else {
      // Clean up the URL when modal closes
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl)
        setDocumentUrl('')
      }
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

      console.log('Loading document with session token')

      // Create the URL for the document viewer with proper token
      const supabaseUrl = 'https://imgtnixyralpdrmedwzi.supabase.co'
      const viewerUrl = `${supabaseUrl}/functions/v1/document-viewer?filePath=${encodeURIComponent(document.file_path)}&familyId=${encodeURIComponent(familyId)}&token=${encodeURIComponent(session.access_token)}`
      
      console.log('Document viewer URL:', viewerUrl.replace(session.access_token, '[TOKEN]'))
      setDocumentUrl(viewerUrl)
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
      // For PDFs and other documents that can be displayed in iframe
      if (document.mime_type === 'application/pdf' || 
          document.mime_type.startsWith('text/') ||
          document.mime_type.includes('document') ||
          document.mime_type.includes('sheet')) {
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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