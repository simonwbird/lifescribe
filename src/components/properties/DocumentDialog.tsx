import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileUp, Upload } from 'lucide-react'
import { DOCUMENT_TYPES } from '@/lib/documentTypes'
import { useToast } from '@/hooks/use-toast'

interface DocumentDialogProps {
  propertyId: string
  familyId: string
  onSubmit: (doc: any) => void
  onUploadFile: (file: File, familyId: string) => Promise<{ filePath: string; publicUrl: string }>
}

export function DocumentDialog({ propertyId, familyId, onSubmit, onUploadFile }: DocumentDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    doc_type: '',
    issued_at: '',
    expires_at: '',
    notes: '',
  })
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title) {
      toast({
        title: 'Missing title',
        description: 'Please provide a document title.',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)
    try {
      let filePath = ''
      
      if (file) {
        const result = await onUploadFile(file, familyId)
        filePath = result.filePath
      }

      await onSubmit({
        ...formData,
        file_path: filePath || null,
        issued_at: formData.issued_at || null,
        expires_at: formData.expires_at || null,
      })

      setFormData({
        title: '',
        doc_type: '',
        issued_at: '',
        expires_at: '',
        notes: '',
      })
      setFile(null)
      setOpen(false)
    } catch (error) {
      console.error('Error submitting document:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileUp className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Property Deed 2023"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doc_type">Document Type</Label>
            <Select
              value={formData.doc_type}
              onValueChange={(value) => setFormData({ ...formData, doc_type: value })}
            >
              <SelectTrigger id="doc_type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issued_at">Issued Date</Label>
              <Input
                id="issued_at"
                type="date"
                value={formData.issued_at}
                onChange={(e) => setFormData({ ...formData, issued_at: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Expiry Date</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this document..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              {file && <Upload className="w-4 h-4 text-success" />}
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, Word, or image files accepted
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Add Document'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
