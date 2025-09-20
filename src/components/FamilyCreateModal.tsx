import { Dialog, DialogContent } from '@/components/ui/dialog'
import CreateFamilyForm from './onboarding/CreateFamilyForm'

interface FamilyCreateModalProps {
  open: boolean
  onClose: () => void
}

export default function FamilyCreateModal({ open, onClose }: FamilyCreateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none">
        <CreateFamilyForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}