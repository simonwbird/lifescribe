import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { usePersonImport } from '@/hooks/usePersonImport'
import { Upload, FileText, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personId: string
}

export function ImportDialog({ open, onOpenChange, personId }: ImportDialogProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const csvInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  const { importData, status, progress, importResult, isImporting, reset } = usePersonImport()

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0])
    }
  }

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files))
    }
  }

  const handleImport = async () => {
    if (!csvFile) return

    await importData({
      personId,
      csvFile,
      imageFiles
    })
  }

  const handleClose = () => {
    if (!isImporting) {
      reset()
      setCsvFile(null)
      setImageFiles([])
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Stories & Photos</DialogTitle>
          <DialogDescription>
            Upload a CSV manifest and photos to bulk import content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* CSV Upload */}
          <div className="space-y-2">
            <Label>CSV Manifest</Label>
            <div 
              className="border-2 border-dashed rounded-lg p-6 hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => csvInputRef.current?.click()}
            >
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvChange}
                className="hidden"
                disabled={isImporting}
              />
              <div className="flex flex-col items-center gap-2 text-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
                {csvFile ? (
                  <div>
                    <p className="font-medium">{csvFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(csvFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">Click to upload CSV</p>
                    <p className="text-sm text-muted-foreground">
                      Format: date,title,body,tags,visibility,images
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Images Upload */}
          <div className="space-y-2">
            <Label>Photos (Optional)</Label>
            <div 
              className="border-2 border-dashed rounded-lg p-6 hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => imageInputRef.current?.click()}
            >
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesChange}
                className="hidden"
                disabled={isImporting}
              />
              <div className="flex flex-col items-center gap-2 text-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                {imageFiles.length > 0 ? (
                  <div>
                    <p className="font-medium">{imageFiles.length} images selected</p>
                    <p className="text-sm text-muted-foreground">
                      {(imageFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} MB total
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">Click to upload photos</p>
                    <p className="text-sm text-muted-foreground">
                      Reference photos by filename in CSV
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {status === 'uploading' ? 'Uploading files...' : 'Processing data...'}
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Results */}
          {importResult && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p>Processed: {importResult.processed} items</p>
                  {importResult.failed > 0 && (
                    <p className="text-destructive">Failed: {importResult.failed} items</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Status Messages */}
          {status === 'completed' && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-sm text-green-800 dark:text-green-200">
              Import completed successfully!
            </div>
          )}

          {status === 'partial' && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-3 text-sm text-yellow-800 dark:text-yellow-200">
              Import completed with some errors. Check the results above.
            </div>
          )}

          {status === 'failed' && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              Import failed. Please check your files and try again.
            </div>
          )}

          {/* CSV Format Help */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>CSV Format:</strong> date,title,body,tags,visibility,images
              <br />
              <strong>Example:</strong> 2024-01-15,"Birthday","Great party",celebration,family,"photo1.jpg,photo2.jpg"
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isImporting}
          >
            {status === 'completed' || status === 'partial' ? 'Close' : 'Cancel'}
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!csvFile || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
