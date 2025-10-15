import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DocumentDialog } from './DocumentDialog'
import { useDocuments } from '@/hooks/useDocuments'
import { FileText, Download, Trash2, Calendar, AlertCircle } from 'lucide-react'
import { DOCUMENT_TYPES } from '@/lib/documentTypes'
import { supabase } from '@/integrations/supabase/client'

interface PropertyDocumentsTabProps {
  propertyId: string
  familyId: string
}

export function PropertyDocumentsTab({ propertyId, familyId }: PropertyDocumentsTabProps) {
  const { documents, isLoading, createDocument, deleteDocument, uploadFile } = useDocuments(
    propertyId,
    familyId
  )

  const getExpiryBadge = (expiresAt: string | null | undefined) => {
    if (!expiresAt) return null

    const expiryDate = new Date(expiresAt)
    const now = new Date()
    const daysUntil = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntil < 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          Expired
        </Badge>
      )
    }

    if (daysUntil <= 30) {
      return (
        <Badge variant="outline" className="gap-1 border-warning text-warning">
          <AlertCircle className="w-3 h-3" />
          Expires in {daysUntil}d
        </Badge>
      )
    }

    return null
  }

  const handleDownload = async (filePath: string, title: string) => {
    const { data, error } = await supabase.storage
      .from('property-documents')
      .download(filePath)

    if (error) {
      console.error('Error downloading file:', error)
      return
    }

    const url = URL.createObjectURL(data)
    const a = document.createElement('a')
    a.href = url
    a.download = title
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading documents...</p>
        </CardContent>
      </Card>
    )
  }

  const sortedDocuments = [...documents].sort((a, b) => {
    if (a.expires_at && b.expires_at) {
      return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime()
    }
    if (a.expires_at) return -1
    if (b.expires_at) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Documents</CardTitle>
          <DocumentDialog
            propertyId={propertyId}
            familyId={familyId}
            onSubmit={createDocument}
            onUploadFile={uploadFile}
          />
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-body-sm text-muted-foreground text-center py-8">
            No documents yet. Add deeds, surveys, warranties and other important documents.
          </p>
        ) : (
          <div className="space-y-3">
            {sortedDocuments.map((doc) => {
              const docType = DOCUMENT_TYPES.find((t) => t.value === doc.doc_type)
              const expiryBadge = getExpiryBadge(doc.expires_at)

              return (
                <div
                  key={doc.id}
                  className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm">{doc.title}</h4>
                      {expiryBadge}
                    </div>

                    {docType && (
                      <p className="text-xs text-muted-foreground mb-1">{docType.label}</p>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {doc.issued_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Issued: {new Date(doc.issued_at).toLocaleDateString()}
                        </span>
                      )}
                      {doc.expires_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Expires: {new Date(doc.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {doc.notes && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {doc.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {doc.file_path && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc.file_path!, doc.title)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Document</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{doc.title}"? This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteDocument(doc.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
