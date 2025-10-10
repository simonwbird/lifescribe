import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Mic, FileText, Image, LogIn } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface ContributionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personId: string
  familyId: string
  onSuccess?: () => void
}

export function ContributionDialog({ 
  open, 
  onOpenChange,
  personId,
  familyId,
  onSuccess
}: ContributionDialogProps) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isChecking, setIsChecking] = useState(false)

  const checkAuthAndNavigate = async (path: string) => {
    setIsChecking(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Show soft sign-in gate
      toast({
        title: "Sign in to contribute",
        description: "Create an account or sign in to share your stories",
        action: (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate('/auth')}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        ),
      })
      setIsChecking(false)
      return
    }

    // Check if user is family member
    const { data: membership } = await supabase
      .from('members')
      .select('id')
      .eq('profile_id', user.id)
      .eq('family_id', familyId)
      .single()

    if (!membership) {
      toast({
        title: "Join family first",
        description: "You need to be a family member to contribute stories",
        variant: "destructive"
      })
      setIsChecking(false)
      return
    }

    setIsChecking(false)
    onOpenChange(false)
    
    // Navigate with person context for auto-linking
    navigate(path, { 
      state: { 
        linkedPerson: personId,
        familyId 
      } 
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">
            Share a Memory
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to contribute your story
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <Card 
            className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
            onClick={() => checkAuthAndNavigate('/stories/new/voice')}
          >
            <CardContent className="p-4 flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Mic className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1">Voice Recording</h3>
                <p className="text-sm text-muted-foreground">
                  Record your memory in your own voice - the most personal way to share
                </p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
            onClick={() => checkAuthAndNavigate('/stories/new/text')}
          >
            <CardContent className="p-4 flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1">Written Story</h3>
                <p className="text-sm text-muted-foreground">
                  Write down your memories with full formatting and details
                </p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
            onClick={() => checkAuthAndNavigate('/stories/new/photo')}
          >
            <CardContent className="p-4 flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Image className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1">Photo Story</h3>
                <p className="text-sm text-muted-foreground">
                  Share photos with captions to tell your story visually
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-xs text-muted-foreground text-center border-t pt-4">
          Your contribution will be reviewed by family stewards before appearing on the page
        </div>
      </DialogContent>
    </Dialog>
  )
}
