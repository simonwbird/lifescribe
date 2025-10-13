import { useState } from 'react'
import { Mic, MicOff, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useOfflineQueue } from '@/hooks/useOfflineQueue'
import QuickVoiceRecordModal from '../voice/QuickVoiceRecordModal'
import { MicPreflightDialog } from '../recorder/MicPreflightDialog'

interface EnhancedMicButtonProps {
  onStoryCreated?: (storyId: string) => void
}

export default function EnhancedMicButton({ onStoryCreated }: EnhancedMicButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showPreflight, setShowPreflight] = useState(false)
  const [micStream, setMicStream] = useState<MediaStream>()
  const { track } = useAnalytics()
  const { unsyncedCount } = useOfflineQueue()

  const handleMicClick = () => {
    // Check if this is first time recording
    const hasRecordedBefore = localStorage.getItem('has_recorded_voice')
    
    if (!hasRecordedBefore) {
      setShowPreflight(true)
    } else {
      setIsModalOpen(true)
    }
    
    track('voice_capture_start')
  }

  const handlePreflightComplete = (granted: boolean, stream?: MediaStream) => {
    setShowPreflight(false)
    
    if (granted) {
      localStorage.setItem('has_recorded_voice', 'true')
      setMicStream(stream)
      setIsModalOpen(true)
    }
  }

  return (
    <>
      <div className="relative">
        <Button
          variant="default"
          size="sm"
          onClick={handleMicClick}
          className="gap-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg"
          aria-label="Quick voice recording"
          data-mic-button
          title="Quick voice recording - Press C to start (C)"
        >
          <div className="relative">
            <Mic className="h-4 w-4" />
            <Zap className="h-2 w-2 absolute -top-1 -right-1 text-yellow-300" />
          </div>
          <span className="hidden sm:inline font-medium">Quick Voice</span>
        </Button>
        
        {unsyncedCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
          >
            {unsyncedCount}
          </Badge>
        )}
      </div>

      <MicPreflightDialog
        open={showPreflight}
        onComplete={handlePreflightComplete}
        onCancel={() => setShowPreflight(false)}
      />
      
      <QuickVoiceRecordModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          if (micStream) {
            micStream.getTracks().forEach(track => track.stop())
            setMicStream(undefined)
          }
        }}
        onStoryCreated={onStoryCreated}
        preGrantedStream={micStream}
      />
    </>
  )
}