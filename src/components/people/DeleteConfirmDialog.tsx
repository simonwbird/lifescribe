import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import type { Person } from '@/lib/familyTreeTypes'

interface DeleteConfirmDialogProps {
  person: Person
  onClose: () => void
  onSuccess: () => void
}

export default function DeleteConfirmDialog({ person, onClose, onSuccess }: DeleteConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const isConfirmValid = confirmText === person.full_name

  const handleDelete = async () => {
    if (!isConfirmValid) return

    setDeleting(true)
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', person.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `${person.full_name} has been deleted`
      })

      onSuccess()
    } catch (error) {
      console.error('Error deleting person:', error)
      toast({
        title: "Error",
        description: "Failed to delete person",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {person.full_name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Type the full name to confirm. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirm-name">
            Type "{person.full_name}" to confirm
          </Label>
          <Input
            id="confirm-name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={person.full_name}
          />
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmValid || deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Person'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}