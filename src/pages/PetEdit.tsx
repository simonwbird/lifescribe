import AuthGate from '@/components/AuthGate'
import PetForm from '@/components/pets/PetForm'

export default function PetEdit() {
  return (
    <AuthGate>
      <PetForm isEditing />
    </AuthGate>
  )
}