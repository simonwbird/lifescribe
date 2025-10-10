import { useState } from 'react'
import { MoreHorizontal, Eye, EyeOff, Trash2, Flag, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'
import { supabase } from '@/integrations/supabase/client'

interface AdminFeedActionsProps {
  storyId: string
  isHidden?: boolean
  onAction?: (action: string, storyId: string) => void
}

export default function AdminFeedActions({ 
  storyId, 
  isHidden = false,
  onAction 
}: AdminFeedActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showModerateDialog, setShowModerateDialog] = useState(false)
  const { toast } = useToast()
  const { track } = useAnalytics()

  const handleHideToggle = () => {
    const action = isHidden ? 'unhide' : 'hide'
    track('activity_clicked', { action, storyId })
    
    toast({
      title: isHidden ? 'Story unhidden' : 'Story hidden',
      description: isHidden 
        ? 'Story is now visible to family members'
        : 'Story is now hidden from family members',
    })
    
    onAction?.(action, storyId)
  }

  const handleDelete = async () => {
    track('activity_clicked', { action: 'delete', storyId })

    try {
      const { error } = await supabase
        .from('stories')
        .update({
          title: '[Deleted by admin]',
          content: '[Content removed by family admin]',
          updated_at: new Date().toISOString(),
        })
        .eq('id', storyId)

      if (error) throw error

      toast({
        title: 'Story deleted',
        description: 'The story has been removed',
        variant: 'destructive',
      })

      onAction?.('delete', storyId)
      setShowDeleteDialog(false)

      // Ensure feed updates immediately
      window.location.reload()
    } catch (err) {
      console.error('Failed to delete story', err)
      toast({
        title: 'Error',
        description: 'Failed to delete story',
        variant: 'destructive',
      })
    }
  }

  const handleModerate = () => {
    track('activity_clicked', { action: 'moderate', storyId })
    
    toast({
      title: 'Story flagged for review',
      description: 'The story has been sent to the moderation queue',
    })
    
    onAction?.('moderate', storyId)
    setShowModerateDialog(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-50 hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Admin actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleHideToggle} className="flex items-center gap-2">
            {isHidden ? (
              <>
                <Eye className="h-4 w-4" />
                Unhide Story
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Story
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setShowModerateDialog(true)}
            className="flex items-center gap-2 text-orange-600"
          >
            <Flag className="h-4 w-4" />
            Flag for Review
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="flex items-center gap-2 text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete Story
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Story
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The story and all its comments will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Moderate Confirmation Dialog */}
      <AlertDialog open={showModerateDialog} onOpenChange={setShowModerateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-orange-600" />
              Flag for Moderation
            </AlertDialogTitle>
            <AlertDialogDescription>
              This story will be sent to the moderation queue for review. It may be hidden from family members until reviewed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleModerate}>
              Flag Story
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}