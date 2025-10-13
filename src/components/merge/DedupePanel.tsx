import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle, 
  Users, 
  ArrowRight, 
  Check, 
  X,
  Undo,
  Image as ImageIcon
} from 'lucide-react'
import { getDuplicateCandidates, MergePreview, previewPersonMerge } from '@/lib/merge/mergeOperations'
import { DuplicateCompareDialog } from './DuplicateCompareDialog'
import { useToast } from '@/hooks/use-toast'

export function DedupePanel() {
  const [entityType, setEntityType] = useState<'person' | 'media'>('person')
  const [candidates, setCandidates] = useState<any[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null)
  const [preview, setPreview] = useState<MergePreview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadCandidates()
  }, [entityType])

  const loadCandidates = async () => {
    setIsLoading(true)
    try {
      const data = await getDuplicateCandidates(entityType, 'pending')
      setCandidates(data)
    } catch (error) {
      console.error('Failed to load candidates:', error)
      toast({
        title: 'Error',
        description: 'Failed to load duplicate candidates',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreview = async (candidate: any) => {
    try {
      const previewData = await previewPersonMerge(
        candidate.person_a_id,
        candidate.person_b_id
      )
      setPreview(previewData)
      setSelectedCandidate(candidate)
    } catch (error) {
      console.error('Failed to preview merge:', error)
      toast({
        title: 'Error',
        description: 'Failed to preview merge',
        variant: 'destructive'
      })
    }
  }

  const handleMergeComplete = () => {
    setSelectedCandidate(null)
    setPreview(null)
    loadCandidates()
    toast({
      title: 'Merge Complete',
      description: 'Duplicate records have been merged successfully'
    })
  }

  return (
    <Card className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold">Duplicate Detection</h3>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={entityType === 'person' ? 'default' : 'outline'}
              onClick={() => setEntityType('person')}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              People
            </Button>
            <Button
              size="sm"
              variant={entityType === 'media' ? 'default' : 'outline'}
              onClick={() => setEntityType('media')}
              className="gap-2"
            >
              <ImageIcon className="h-4 w-4" />
              Media
            </Button>
          </div>
        </div>

        {candidates.length > 0 && (
          <Alert>
            <AlertDescription>
              {candidates.length} potential duplicate{candidates.length > 1 ? 's' : ''} detected
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Candidates List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading candidates...
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-8">
              <Check className="h-12 w-12 mx-auto text-green-600 mb-2" />
              <p className="text-muted-foreground">No duplicates found</p>
            </div>
          ) : (
            candidates.map(candidate => (
              <Card
                key={candidate.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handlePreview(candidate)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="font-medium">
                          {entityType === 'person' 
                            ? `${candidate.person_a?.given_name} ${candidate.person_a?.surname}`
                            : candidate.person_a?.file_name
                          }
                        </p>
                        {candidate.person_a?.birth_date && (
                          <p className="text-xs text-muted-foreground">
                            Born: {new Date(candidate.person_a.birth_date).getFullYear()}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {entityType === 'person'
                            ? `${candidate.person_b?.given_name} ${candidate.person_b?.surname}`
                            : candidate.person_b?.file_name
                          }
                        </p>
                        {candidate.person_b?.birth_date && (
                          <p className="text-xs text-muted-foreground">
                            Born: {new Date(candidate.person_b.birth_date).getFullYear()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="secondary">
                        {Math.round(candidate.confidence_score * 100)}% match
                      </Badge>
                      {candidate.match_reasons?.map((reason: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button size="sm" variant="ghost">
                    Review
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Compare Dialog */}
      {selectedCandidate && preview && (
        <DuplicateCompareDialog
          open={!!selectedCandidate}
          onClose={() => {
            setSelectedCandidate(null)
            setPreview(null)
          }}
          candidate={selectedCandidate}
          preview={preview}
          entityType={entityType}
          onMergeComplete={handleMergeComplete}
        />
      )}
    </Card>
  )
}
