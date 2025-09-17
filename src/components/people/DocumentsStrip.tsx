import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Upload, Eye, Download, X } from 'lucide-react'
import { Person } from '@/utils/personUtils'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { uploadMediaFile, getSignedMediaUrl } from '@/lib/media'

interface DocumentsStripProps {
  person: Person
}

interface Document {
  id: string
  file_name: string
  file_path: string
  mime_type: string
  file_size: number
  created_at: string
  profile_id: string
}

export function DocumentsStrip({ person }: DocumentsStripProps) {
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const { toast } = useToast()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type - allow documents
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, Word, Excel, or text documents only.",
        variant: "destructive"
      })
      return
    }

    // Check file size (10MB limit for documents)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large", 
        description: "Documents must be under 10MB.",
        variant: "destructive"
      })
      return
    }

    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload to storage
      const { path, error: uploadError } = await uploadMediaFile(
        file,
        (person as any).family_id,
        user.id
      )

      if (uploadError) throw new Error(uploadError)

      // Save to media table
      const { error: dbError } = await supabase
        .from('media')
        .insert({
          file_path: path,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          family_id: (person as any).family_id,
          profile_id: user.id,
          // Could add person_id field to link documents to specific people
        })

      if (dbError) throw dbError

      toast({
        title: "Document uploaded",
        description: `${file.name} has been uploaded successfully.`
      })

      // Refresh documents list
      fetchDocuments()

    } catch (error) {
      console.error('Upload failed:', error)
      toast({
        title: "Upload failed",
        description: "Could not upload the document.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
      // Reset input
      event.target.value = ''
    }
  }

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('family_id', (person as any).family_id)
        .in('mime_type', [
          'application/pdf',
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ])
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    }
  }

  const getFileIcon = (mimeType: string) => {
    return <FileText className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const downloadDocument = async (doc: Document) => {
    try {
      const signedUrl = await getSignedMediaUrl(doc.file_path, (person as any).family_id)
      if (signedUrl) {
        const a = document.createElement('a')
        a.href = signedUrl
        a.download = doc.file_name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the document.",
        variant: "destructive"
      })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-dashed border-muted-foreground/20 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5" />
          <div>
            <CardTitle className="text-base">Documents</CardTitle>
            <p className="text-xs text-muted-foreground">Upload important documents</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {documents.length > 0 && (
            <Button variant="ghost" size="sm" onClick={fetchDocuments}>
              <Eye className="h-4 w-4 mr-1" />
              View all ({documents.length})
            </Button>
          )}
          
          <Button variant="ghost" size="sm" disabled={uploading} className="relative">
            <Upload className="h-4 w-4 mr-1" />
            {uploading ? 'Uploading...' : 'Add'}
            <Input
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No documents yet
            </p>
            <div className="relative inline-block">
              <Button variant="outline" disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Document'}
              </Button>
              <Input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Supports PDF, Word, Excel, and text files (max 10MB)
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.slice(0, 3).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(doc.mime_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadDocument(doc)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {documents.length > 3 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" onClick={fetchDocuments}>
                  View {documents.length - 3} more documents
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}