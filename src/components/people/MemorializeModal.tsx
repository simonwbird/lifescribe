import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Heart, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Person } from '@/lib/familyTreeTypes'

interface MemorializeModalProps {
  person: Person
  onClose: () => void
  onSuccess: () => void
}

export default function MemorializeModal({ person, onClose, onSuccess }: MemorializeModalProps) {
  const [deathDate, setDeathDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { toast } = useToast()

  const handleMemorialize = async () => {
    if (!deathDate.trim()) {
      toast({
        title: "Error",
        description: "Please provide a death date",
        variant: "destructive"
      })
      return
    }
    
    setShowConfirm(true)
  }

  const handleConfirmMemorialize = async () => {
    setLoading(true)
    setShowConfirm(false)
    
    try {
      const updateData: any = {
        is_living: false,
        death_date: deathDate
      }

      if (notes.trim()) {
        updateData.notes = person.notes ? `${person.notes}\n\n${notes}` : notes
      }

      const { error } = await supabase
        .from('people')
        .update(updateData)
        .eq('id', person.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `${person.full_name} has been memorialized`
      })
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error memorializing person:', error)
      toast({
        title: "Error",
        description: "Failed to memorialize person",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRevert = async () => {
    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('people')
        .update({ 
          is_living: true,
          death_date: null
        })
        .eq('id', person.id)

      if (error) throw error

      toast({
        title: "Success",
        description: `${person.full_name}'s memorial status has been reverted`
      })
      
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error reverting memorialization:', error)
      toast({
        title: "Error",
        description: "Failed to revert memorialization",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (person.is_living === false) {
    // Show revert option for deceased people
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Revert Memorialization
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {person.full_name} is currently marked as deceased. You can revert this if it was done in error.
            </p>
            
            {person.death_date && (
              <div>
                <Label>Current Death Date</Label>
                <div className="p-2 bg-muted rounded-md text-sm">
                  {new Date(person.death_date).toLocaleDateString()}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleRevert}
                disabled={loading}
                variant="destructive"
              >
                {loading ? 'Reverting...' : 'Revert Memorialization'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Memorialize {person.full_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will mark {person.full_name} as no longer with us and convert their page to a tribute page.
            This action will change how they appear throughout the family space.
          </p>
          
          <div>
            <Label htmlFor="death_date">Date of Passing *</Label>
            <Input
              id="death_date"
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="memorial_notes">Memorial Notes (optional)</Label>
            <Textarea
              id="memorial_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any memorial information or details about their passing..."
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleMemorialize}
              disabled={loading || !deathDate.trim()}
            >
              <Heart className="h-4 w-4 mr-2" />
              Memorialize
            </Button>
          </div>
        </div>
      </DialogContent>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Memorialization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to memorialize {person.full_name}? This will:
              <br />• Mark them as deceased
              <br />• Convert their Life Page to a Tribute Page
              <br />• Update how they appear in birthday reminders and statistics
              <br />• This action can be reverted if needed
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMemorialize}>
              Confirm Memorialization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}