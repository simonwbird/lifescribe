import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NewMemoryModal } from './NewMemoryModal'
import { useAnalytics } from '@/hooks/useAnalytics'

export function NewMemoryFAB() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { track } = useAnalytics()

  const handleOpenModal = () => {
    setIsModalOpen(true)
    track('new_memory_opened')
  }

  return (
    <>
      <Button
        data-testid="new-memory-fab"
        onClick={handleOpenModal}
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 md:h-16 md:w-16"
        aria-label="Create new memory"
      >
        <Plus className="h-6 w-6 md:h-7 md:w-7" />
      </Button>

      <NewMemoryModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  )
}
