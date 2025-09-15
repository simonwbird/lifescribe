import { useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function MicButton() {
  const [isRecording, setIsRecording] = useState(false)
  const { track } = useAnalytics()

  const handleMicToggle = () => {
    if (isRecording) {
      setIsRecording(false)
      track('voice_capture_stop')
      // TODO: Stop voice recording
    } else {
      setIsRecording(true)
      track('voice_capture_start')
      // TODO: Start voice recording
    }
  }

  return (
    <Button
      variant={isRecording ? "destructive" : "default"}
      size="sm"
      onClick={handleMicToggle}
      className={`gap-1 ${isRecording ? 'animate-pulse' : ''}`}
      aria-label={isRecording ? "Stop recording" : "Start voice capture"}
      data-mic-button
    >
      {isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">
        {isRecording ? 'Stop' : 'Mic'}
      </span>
    </Button>
  )
}