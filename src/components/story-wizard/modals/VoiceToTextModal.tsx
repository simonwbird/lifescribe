import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Mic, MicOff, Square } from 'lucide-react'

interface VoiceToTextModalProps {
  open: boolean
  onClose: () => void
  onTextReceived: (text: string) => void
}

export default function VoiceToTextModal({ 
  open, 
  onClose, 
  onTextReceived 
}: VoiceToTextModalProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')

  const startRecording = () => {
    // TODO: Implement Web Speech API
    setIsRecording(true)
    
    // Mock transcript for demo
    setTimeout(() => {
      setTranscript("This is a demo transcript. In the real implementation, this would use the Web Speech API to convert your voice to text.")
    }, 2000)
  }

  const stopRecording = () => {
    setIsRecording(false)
  }

  const handleUseText = () => {
    if (transcript) {
      onTextReceived(transcript)
      setTranscript('')
      onClose()
    }
  }

  const handleClose = () => {
    setIsRecording(false)
    setTranscript('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice to Text</DialogTitle>
          <DialogDescription>
            Speak your story and we'll convert it to text for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                size="lg"
                className="rounded-full w-16 h-16 bg-brand-green hover:bg-brand-green/90"
              >
                <Mic className="h-6 w-6" />
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="rounded-full w-16 h-16"
              >
                <Square className="h-6 w-6" />
              </Button>
            )}
          </div>

          <div className="text-center">
            {isRecording ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Recording...</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Speak clearly and tap stop when finished
                </p>
              </div>
            ) : transcript ? (
              <div className="space-y-2">
                <MicOff className="h-5 w-5 mx-auto text-muted-foreground" />
                <span className="text-sm font-medium">Recording complete</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Mic className="h-5 w-5 mx-auto text-muted-foreground" />
                <span className="text-sm font-medium">Tap to start recording</span>
              </div>
            )}
          </div>

          {transcript && (
            <div className="space-y-3">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">{transcript}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => startRecording()}>
                  Record Again
                </Button>
                <Button onClick={handleUseText} className="flex-1">
                  Use This Text
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            <p>Voice recording requires microphone access.</p>
            <p>Your audio is processed locally and not stored.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}