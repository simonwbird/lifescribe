import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CheckCircle, AlertTriangle, Users, UserPlus, UserX } from 'lucide-react'
import type { ImportPreview, PersonMatch } from '@/lib/familyTreeV2Types'
import { GedcomImportService } from '@/lib/gedcomImportService'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

interface ImportPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preview: ImportPreview | null
  familyId: string
  onSuccess: () => void
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  open,
  onOpenChange,
  preview,
  familyId,
  onSuccess
}) => {
  const [mergeDecisions, setMergeDecisions] = useState<Record<string, 'merge' | 'skip' | 'new'>>({})
  const [loading, setLoading] = useState(false)

  const handleDecisionChange = (personId: string, decision: 'merge' | 'skip' | 'new') => {
    setMergeDecisions(prev => ({
      ...prev,
      [personId]: decision
    }))
  }

  const handleCommitImport = async () => {
    if (!preview) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      await GedcomImportService.commitImport(preview, familyId, user.id, mergeDecisions)
      toast.success('Import completed successfully')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Import failed:', error)
      toast.error('Import failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!preview) return null

  const duplicatesCount = preview.duplicates.length
  const newPeopleCount = preview.peopleCount - duplicatesCount
  const decisionsCount = Object.keys(mergeDecisions).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Preview</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  People
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{preview.peopleCount}</div>
                <p className="text-xs text-muted-foreground">
                  {newPeopleCount} new, {duplicatesCount} potential duplicates
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Families
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{preview.familiesCount}</div>
                <p className="text-xs text-muted-foreground">Family unions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Decisions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{decisionsCount}</div>
                <p className="text-xs text-muted-foreground">
                  of {duplicatesCount} duplicates
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Potential Duplicates */}
          {duplicatesCount > 0 && (
            <Card className="flex-1 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Potential Duplicates ({duplicatesCount})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review and decide how to handle each potential match
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="p-4 space-y-4">
                    {preview.duplicates.map((match: PersonMatch, index) => {
                      const incomingName = `${match.incoming.given_name || ''} ${match.incoming.surname || ''}`.trim()
                      const existingName = `${match.existing.given_name || ''} ${match.existing.surname || ''}`.trim()
                      const decision = mergeDecisions[match.incoming.person_id] || 'new'

                      return (
                        <div key={`${match.incoming.person_id}-${index}`} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {incomingName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{incomingName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {match.incoming.birth_date} • Incoming
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 ml-11">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {existingName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{existingName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {match.existing.birth_date || 'Unknown'} • Existing
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={match.confidence > 70 ? 'destructive' : 'secondary'}>
                                {match.confidence}% match
                              </Badge>
                              <Select
                                value={decision}
                                onValueChange={(value: 'merge' | 'skip' | 'new') => 
                                  handleDecisionChange(match.incoming.person_id, value)
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="merge">Merge</SelectItem>
                                  <SelectItem value="new">Create New</SelectItem>
                                  <SelectItem value="skip">Skip</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            <strong>Match reasons:</strong> {match.matchReasons.join(', ')}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* No Duplicates Message */}
          {duplicatesCount === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium mb-2">No Duplicates Found</h3>
                <p className="text-muted-foreground">
                  All {preview.peopleCount} people will be imported as new entries
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {duplicatesCount > 0 && decisionsCount < duplicatesCount && (
              <>Please review all {duplicatesCount} potential duplicates</>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCommitImport}
              disabled={loading || (duplicatesCount > 0 && decisionsCount < duplicatesCount)}
            >
              {loading ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}