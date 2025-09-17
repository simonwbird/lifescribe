import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
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
  transcript_text?: string // Will use this for document description
}

export function DocumentsStrip({ person }: DocumentsStripProps) {
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<Document[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const { toast } = useToast()

  // Fetch documents on component mount and when person changes
  useEffect(() => {
    fetchDocuments()
  }, [person.id])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedFile(file)
    setShowUploadModal(true)
    // Reset input
    event.target.value = ''
  }

  const handleUploadWithDescription = async () => {
    if (!selectedFile) return

    setUploading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload to storage
      const { path, error: uploadError } = await uploadMediaFile(
        selectedFile,
        (person as any).family_id,
        user.id
      )

      if (uploadError) throw new Error(uploadError)

      // Create a lightweight story to satisfy media parent constraint
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: selectedFile.name,
          content: description.trim() || null,
          family_id: (person as any).family_id,
          profile_id: user.id
        })
        .select()
        .single()

      if (storyError || !story) throw storyError || new Error('Failed to create story container')

      // Link story to this person
      const { error: linkError } = await supabase
        .from('person_story_links')
        .insert({
          person_id: person.id,
          story_id: story.id,
          family_id: (person as any).family_id
        })
      if (linkError) throw linkError

      // Save to media table with description (attach to story)
      const { error: dbError } = await supabase
        .from('media')
        .insert({
          file_path: path,
          file_name: selectedFile.name,
          mime_type: selectedFile.type,
          file_size: selectedFile.size,
          family_id: (person as any).family_id,
          profile_id: user.id,
          story_id: story.id,
          transcript_text: description.trim() || null
        })

      if (dbError) throw dbError

      toast({
        title: "Document uploaded",
        description: `${selectedFile.name} has been uploaded successfully.`
      })

      // Reset modal state
      setShowUploadModal(false)
      setSelectedFile(null)
      setDescription('')
      
      // Refresh documents list
      fetchDocuments()

    } catch (error) {
      console.error('Upload failed:', error)
      toast({
        title: "Upload failed",
        description: "Could not upload the document. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      // First get story IDs that are linked to this person
      const { data: personStoryLinks, error: linkError } = await supabase
        .from('person_story_links')
        .select('story_id')
        .eq('person_id', person.id)
        .eq('family_id', (person as any).family_id)

      if (linkError) throw linkError
      
      if (!personStoryLinks || personStoryLinks.length === 0) {
        setDocuments([])
        return
      }

      const storyIds = personStoryLinks.map(link => link.story_id)

      // Fetch documents that belong to those stories and are document types
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('family_id', (person as any).family_id)
        .in('story_id', storyIds)
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
      setDocuments([])
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
    <>
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
                onChange={handleFileSelect}
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
                  onChange={handleFileSelect}
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
                      {doc.transcript_text && (
                        <p className="text-xs text-muted-foreground truncate">{doc.transcript_text}</p>
                      )}
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

      {/* Upload Modal with Description */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a brief description so family knows what this document is for.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedFile && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                What is this document? <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                placeholder="e.g., Birth certificate for Henry, Military service records, Last will and testament, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {description.length}/200 characters
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowUploadModal(false)
                setSelectedFile(null)
                setDescription('')
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadWithDescription}
              disabled={uploading || !selectedFile}
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}