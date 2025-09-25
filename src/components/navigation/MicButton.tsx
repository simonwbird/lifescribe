import { useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/useAnalytics'
import VoiceCaptureModal from '../voice/VoiceCaptureModal'

interface MicButtonProps {
  onStoryCreated?: (storyId: string) => void
}

export default function MicButton({ onStoryCreated }: MicButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { track } = useAnalytics()

  const handleMicClick = () => {
    setIsModalOpen(true)
    track('voice_capture_start')
  }

  return (
    <>
      <Button
        variant="default"
        size="sm"
        onClick={handleMicClick}
        className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        aria-label="Quick voice recording"
        data-mic-button
        title="Quick voice recording"
      >
        <Mic className="h-4 w-4" />
        <span className="hidden sm:inline font-medium">Voice</span>
      </Button>
      
      <VoiceCaptureModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStoryCreated={onStoryCreated}
      />
    </>
  )
}