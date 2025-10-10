import { useState } from 'react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { usePersonExport, ExportType } from '@/hooks/usePersonExport'
import { Download, FileJson, FileText, Loader2 } from 'lucide-react'

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personId: string
  canExportPrivate: boolean // owner or steward
}

export function ExportDialog({ 
  open, 
  onOpenChange, 
  personId,
  canExportPrivate 
}: ExportDialogProps) {
  const [exportType, setExportType] = useState<ExportType>('json')
  const [includePrivate, setIncludePrivate] = useState(false)
  const { exportPerson, status, progress, isExporting } = usePersonExport()

  const handleExport = async () => {
    await exportPerson({
      personId,
      exportType,
      includePrivate: canExportPrivate ? includePrivate : false
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Person Data</DialogTitle>
          <DialogDescription>
            Choose your export format and options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={exportType} onValueChange={(value) => setExportType(value as ExportType)}>
              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileJson className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">JSON Export</div>
                      <div className="text-sm text-muted-foreground">
                        Complete data export including all blocks and stories
                      </div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">PDF Mini-Book</div>
                      <div className="text-sm text-muted-foreground">
                        Beautiful printable book with hero, timeline & gallery
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Privacy Options */}
          {canExportPrivate && (
            <div className="flex items-center space-x-2 rounded-lg border p-4 bg-accent/20">
              <Checkbox 
                id="includePrivate" 
                checked={includePrivate}
                onCheckedChange={(checked) => setIncludePrivate(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="includePrivate" className="cursor-pointer font-medium">
                  Include private items
                </Label>
                <p className="text-sm text-muted-foreground">
                  Export items marked as private (owner/steward only)
                </p>
              </div>
            </div>
          )}

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Exporting...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Status Messages */}
          {status === 'completed' && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-sm text-green-800 dark:text-green-200">
              Export completed successfully!
            </div>
          )}

          {status === 'failed' && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              Export failed. Please try again.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
