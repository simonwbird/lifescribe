import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  AlertTriangle, 
  ArrowRight, 
  Check,
  Loader2
} from 'lucide-react'
import { MergePreview, executePersonMerge } from '@/lib/merge/mergeOperations'
import { useToast } from '@/hooks/use-toast'

interface DuplicateCompareDialogProps {
  open: boolean
  onClose: () => void
  candidate: any
  preview: MergePreview
  entityType: 'person' | 'media'
  onMergeComplete: () => void
}

export function DuplicateCompareDialog({
  open,
  onClose,
  candidate,
  preview,
  entityType,
  onMergeComplete
}: DuplicateCompareDialogProps) {
  const [canonical, setCanonical] = useState<'a' | 'b'>('a')
  const [reason, setReason] = useState('')
  const [isMerging, setIsMerging] = useState(false)
  const { toast } = useToast()

  const canonicalData = canonical === 'a' ? preview.canonical : preview.duplicate
  const duplicateData = canonical === 'a' ? preview.duplicate : preview.canonical

  const handleMerge = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for this merge',
        variant: 'destructive'
      })
      return
    }

    setIsMerging(true)
    try {
      await executePersonMerge(
        canonicalData.id,
        duplicateData.id,
        preview.mergedData,
        reason
      )
      
      onMergeComplete()
    } catch (error) {
      console.error('Merge failed:', error)
      toast({
        title: 'Merge Failed',
        description: (error as Error).message,
        variant: 'destructive'
      })
    } finally {
      setIsMerging(false)
    }
  }

  const getFieldValue = (obj: any, field: string) => {
    const value = obj?.[field]
    if (value === null || value === undefined) return '—'
    if (field.includes('date')) {
      return new Date(value).toLocaleDateString()
    }
    return value
  }

  const fields = [
    { key: 'given_name', label: 'Given Name' },
    { key: 'surname', label: 'Surname' },
    { key: 'birth_date', label: 'Birth Date' },
    { key: 'birth_place', label: 'Birth Place' },
    { key: 'death_date', label: 'Death Date' },
    { key: 'death_place', label: 'Death Place' }
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            Merge Duplicate {entityType === 'person' ? 'People' : 'Media'}
          </DialogTitle>
          <DialogDescription>
            Compare both records and select which one to keep as the canonical record
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Choose Canonical */}
          <div className="space-y-3">
            <Label>Select Canonical Record</Label>
            <RadioGroup value={canonical} onValueChange={(v) => setCanonical(v as 'a' | 'b')}>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 border rounded-lg ${canonical === 'a' ? 'border-primary bg-primary/5' : ''}`}>
                  <RadioGroupItem value="a" id="record-a" className="mr-2" />
                  <Label htmlFor="record-a" className="cursor-pointer">
                    <div className="font-medium">
                      {preview.canonical.given_name} {preview.canonical.surname}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(preview.canonical.created_at).toLocaleDateString()}
                    </div>
                  </Label>
                </div>

                <div className={`p-4 border rounded-lg ${canonical === 'b' ? 'border-primary bg-primary/5' : ''}`}>
                  <RadioGroupItem value="b" id="record-b" className="mr-2" />
                  <Label htmlFor="record-b" className="cursor-pointer">
                    <div className="font-medium">
                      {preview.duplicate.given_name} {preview.duplicate.surname}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Created: {new Date(preview.duplicate.created_at).toLocaleDateString()}
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Side-by-Side Comparison */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted p-3 grid grid-cols-[1fr,auto,1fr] gap-4 items-center font-medium text-sm">
              <div>Keep (Canonical)</div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div>Discard (Duplicate)</div>
            </div>
            
            {fields.map(field => {
              const canonicalValue = getFieldValue(canonicalData, field.key)
              const duplicateValue = getFieldValue(duplicateData, field.key)
              const hasConflict = preview.conflicts.includes(field.key)

              return (
                <div
                  key={field.key}
                  className={`p-3 grid grid-cols-[1fr,auto,1fr] gap-4 items-center border-t ${
                    hasConflict ? 'bg-yellow-50' : ''
                  }`}
                >
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{field.label}</div>
                    <div className="font-medium">{canonicalValue}</div>
                  </div>
                  {hasConflict ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{field.label}</div>
                    <div className={`font-medium ${hasConflict ? 'text-red-600' : ''}`}>
                      {duplicateValue}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Impact Summary */}
          <Alert>
            <AlertDescription className="space-y-2">
              <p className="font-medium">This merge will affect:</p>
              <ul className="text-sm space-y-1">
                <li>• {preview.affectedRecords.stories} stories</li>
                <li>• {preview.affectedRecords.media} media items</li>
                <li>• {preview.affectedRecords.relationships} relationships</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Merge *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why these records are duplicates..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isMerging}>
            Cancel
          </Button>
          <Button onClick={handleMerge} disabled={isMerging || !reason.trim()}>
            {isMerging ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Merging...
              </>
            ) : (
              'Merge Records'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
