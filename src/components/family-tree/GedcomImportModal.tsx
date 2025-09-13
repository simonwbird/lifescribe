import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, XCircle, Users, GitMerge } from 'lucide-react'
import { GedcomImportService } from '@/lib/gedcomImportService'
import type { ImportPreview, PersonMatch } from '@/lib/familyTreeV2Types'
import { toast } from 'sonner'

interface GedcomImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  familyId: string
  userId: string
  onImportComplete: () => void
}

export function GedcomImportModal({ open, onOpenChange, familyId, userId, onImportComplete }: GedcomImportModalProps) {
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [mergeDecisions, setMergeDecisions] = useState<Record<string, 'merge' | 'skip' | 'new'>>({})
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const content = await file.text()
      const previewData = await GedcomImportService.previewImport(content, familyId)
      setPreview(previewData)
      
      // Initialize merge decisions for duplicates
      const decisions: Record<string, 'merge' | 'skip' | 'new'> = {}
      previewData.duplicates.forEach(match => {
        decisions[match.incoming.person_id] = match.confidence > 80 ? 'merge' : 'new'
      })
      setMergeDecisions(decisions)

      toast.success(`Preview ready: ${previewData.peopleCount} people, ${previewData.duplicates.length} potential duplicates`)
    } catch (error) {
      console.error('Error parsing GEDCOM:', error)
      toast.error('Failed to parse GEDCOM file')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!preview) return

    setImporting(true)
    try {
      await GedcomImportService.commitImport(preview, familyId, userId, mergeDecisions)
      
      const newCount = Object.values(mergeDecisions).filter(d => d === 'new').length
      const mergedCount = Object.values(mergeDecisions).filter(d => d === 'merge').length
      const skippedCount = Object.values(mergeDecisions).filter(d => d === 'skip').length
      
      toast.success(`Import complete: ${newCount} new people, ${mergedCount} merged, ${skippedCount} skipped`)
      onImportComplete()
      onOpenChange(false)
      setPreview(null)
      setMergeDecisions({})
    } catch (error) {
      console.error('Import failed:', error)
      toast.error('Import failed: ' + error.message)
    } finally {
      setImporting(false)
    }
  }

  const updateDecision = (personId: string, decision: 'merge' | 'skip' | 'new') => {
    setMergeDecisions(prev => ({ ...prev, [personId]: decision }))
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'destructive' // High chance of duplicate
    if (confidence >= 60) return 'secondary' // Medium chance
    return 'outline' // Low chance
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Safe GEDCOM Import</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {!preview ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <AlertTriangle className="h-12 w-12 text-warning" />
              <h3 className="text-lg font-semibold">Import Safety Check</h3>
              <p className="text-center text-muted-foreground max-w-md">
                Upload your GEDCOM file to preview changes and detect potential duplicates before importing.
                This prevents breaking your existing family tree data.
              </p>
              <input
                type="file"
                accept=".ged"
                onChange={handleFileUpload}
                className="hidden"
                id="gedcom-preview-upload"
                disabled={loading}
              />
              <Button 
                onClick={() => document.getElementById('gedcom-preview-upload')?.click()}
                disabled={loading}
              >
                {loading ? 'Analyzing...' : 'Select GEDCOM File'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Import Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">New People</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{preview.peopleCount}</div>
                    <p className="text-xs text-muted-foreground">from GEDCOM</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Potential Duplicates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning">{preview.duplicates.length}</div>
                    <p className="text-xs text-muted-foreground">need review</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Families</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{preview.familiesCount}</div>
                    <p className="text-xs text-muted-foreground">relationships</p>
                  </CardContent>
                </Card>
              </div>

              {/* Duplicate Review */}
              {preview.duplicates.length > 0 && (
                <>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Found {preview.duplicates.length} potential duplicates. Review each match and decide whether to merge, skip, or create new records.
                    </AlertDescription>
                  </Alert>

                  <ScrollArea className="h-96 border rounded-lg p-4">
                    <div className="space-y-4">
                      {preview.duplicates.map((match) => (
                        <Card key={match.incoming.person_id} className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-2">Incoming (GEDCOM)</h4>
                                <div>
                                  <p className="font-medium">{match.incoming.given_name} {match.incoming.surname}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {match.incoming.birth_date && `Born: ${match.incoming.birth_date}`}
                                    {match.incoming.sex && ` • ${match.incoming.sex === 'M' ? 'Male' : match.incoming.sex === 'F' ? 'Female' : 'Other'}`}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-2">Existing Person</h4>
                                <div>
                                  <p className="font-medium">{match.existing.given_name} {match.existing.surname}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {match.existing.birth_date && `Born: ${match.existing.birth_date}`}
                                    {match.existing.sex && ` • ${match.existing.sex === 'M' ? 'Male' : match.existing.sex === 'F' ? 'Female' : 'Other'}`}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={getConfidenceColor(match.confidence)}>
                                {match.confidence}% match
                              </Badge>
                              <div className="text-xs text-muted-foreground text-right">
                                {match.matchReasons.join(', ')}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant={mergeDecisions[match.incoming.person_id] === 'merge' ? 'default' : 'outline'}
                                  onClick={() => updateDecision(match.incoming.person_id, 'merge')}
                                >
                                  <GitMerge className="h-3 w-3 mr-1" />
                                  Merge
                                </Button>
                                <Button
                                  size="sm"
                                  variant={mergeDecisions[match.incoming.person_id] === 'skip' ? 'default' : 'outline'}
                                  onClick={() => updateDecision(match.incoming.person_id, 'skip')}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Skip
                                </Button>
                                <Button
                                  size="sm"
                                  variant={mergeDecisions[match.incoming.person_id] === 'new' ? 'default' : 'outline'}
                                  onClick={() => updateDecision(match.incoming.person_id, 'new')}
                                >
                                  <Users className="h-3 w-3 mr-1" />
                                  New
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={() => { setPreview(null); setMergeDecisions({}) }}>
                  Start Over
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleImport} disabled={importing}>
                    {importing ? 'Importing...' : `Import ${Object.values(mergeDecisions).filter(d => d !== 'skip').length} People`}
                    <CheckCircle className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}