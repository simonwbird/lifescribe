import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import PersonForm from '../PersonForm'
import type { Person } from '@/lib/familyTreeTypes'

interface PersonEditModalProps {
  person: Person
  familyId: string
  onClose: () => void
  onSuccess: () => void
}

export default function PersonEditModal({ person, familyId, onClose, onSuccess }: PersonEditModalProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit {person.full_name}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">
          <PersonForm
            person={person}
            familyId={familyId}
            onSuccess={onSuccess}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}