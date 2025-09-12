import AuthGate from '@/components/AuthGate'
import PetForm from '@/components/pets/PetForm'

export default function PetNew() {
  return (
    <AuthGate>
      <PetForm />
    </AuthGate>
  )
}