import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Mic, FileText, Lock } from 'lucide-react'
import { ContributionDialog } from './story-collage/ContributionDialog'
import { useSession } from '@/hooks/useSession'
import { useToast } from '@/hooks/use-toast'
import QuickVoiceRecordModal from '@/components/voice/QuickVoiceRecordModal'

interface ContributeCTAProps {
  personId: string
  familyId: string
  preset: 'life' | 'tribute'
  visibility: string
  canContribute?: boolean
}

export function ContributeCTA({
  personId,
  familyId,
  preset,
  visibility,
  canContribute = true
}: ContributeCTAProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false)
  const { isAuthenticated } = useSession()
  const { toast } = useToast()
  const navigate = useNavigate()

  const isPublic = visibility === 'public'
  const isPrivate = visibility === 'private' || visibility === 'unlisted'

  const handleAddStory = () => {
    if (isPrivate && !canContribute) {
      toast({
        title: "Access Required",
        description: "You need to be a family member to contribute to this page.",
        variant: "destructive"
      })
      return
    }
    setIsDialogOpen(true)
  }

  const handleRecordTribute = () => {
    if (isPrivate && !canContribute) {
      toast({
        title: "Access Required",
        description: "You need to be a family member to contribute to this page.",
        variant: "destructive"
      })
      return
    }
    setIsAudioModalOpen(true)
  }

  const copyText = preset === 'tribute' 
    ? 'Share one moment—one laugh, one lesson.'
    : 'Add your memories and photos to their story.'

  return (
    <>
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <Plus className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-medium text-sm mb-1">
                  {preset === 'tribute' ? 'Share a Memory' : 'Add to Their Story'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {copyText}
                </p>
              </div>

              {isPrivate && !canContribute ? (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Family members only
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button 
                    size="sm" 
                    className="w-full gap-2"
                    onClick={handleAddStory}
                  >
                    <FileText className="h-4 w-4" />
                    Add a Story
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleRecordTribute}
                  >
                    <Mic className="h-4 w-4" />
                    Record Tribute (60–120s)
                  </Button>
                </div>
              )}

              {isPublic && !isAuthenticated && (
                <p className="text-xs text-muted-foreground italic">
                  Sign in optional—contributions are reviewed before publishing
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ContributionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        personId={personId}
        familyId={familyId}
      />

      <QuickVoiceRecordModal
        open={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        onStoryCreated={(storyId) => {
          toast({
            title: "Tribute Recorded",
            description: "Your tribute has been submitted for review."
          })
        }}
      />
    </>
  )
}
