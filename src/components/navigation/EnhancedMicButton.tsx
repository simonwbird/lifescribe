import { useState } from 'react'
import { Mic, MicOff, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/useAnalytics'
import QuickVoiceRecordModal from '../voice/QuickVoiceRecordModal'

interface EnhancedMicButtonProps {
  onStoryCreated?: (storyId: string) => void
}

export default function EnhancedMicButton({ onStoryCreated }: EnhancedMicButtonProps) {
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
        className="gap-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
        aria-label="Quick voice recording"
        data-mic-button
        title="Quick voice recording (C)"
      >
        <div className="relative">
          <Mic className="h-4 w-4" />
          <Zap className="h-2 w-2 absolute -top-1 -right-1 text-yellow-300" />
        </div>
        <span className="hidden sm:inline font-medium">Quick Record</span>
      </Button>
      
      <QuickVoiceRecordModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStoryCreated={onStoryCreated}
      />
    </>
  )
}