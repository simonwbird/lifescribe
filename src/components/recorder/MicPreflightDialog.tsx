import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mic, MicOff, Settings, AlertCircle, CheckCircle } from 'lucide-react'
import { runMicPreflight, cleanupMicStream, MicPermissionStatus } from '@/lib/recorder/micPermissionPreflight'

interface MicPreflightDialogProps {
  open: boolean
  onComplete: (granted: boolean, stream?: MediaStream) => void
  onCancel: () => void
}

export function MicPreflightDialog({ open, onComplete, onCancel }: MicPreflightDialogProps) {
  const [status, setStatus] = useState<MicPermissionStatus | 'checking'>('checking')
  const [error, setError] = useState<string>('')
  const [stream, setStream] = useState<MediaStream>()

  const handleCheckPermission = async () => {
    setStatus('checking')
    setError('')

    const result = await runMicPreflight()
    setStatus(result.status)
    
    if (result.error) {
      setError(result.error)
    }

    if (result.stream) {
      setStream(result.stream)
    }

    if (result.status === 'granted' && result.stream) {
      onComplete(true, result.stream)
    }
  }

  const handleCancel = () => {
    if (stream) {
      cleanupMicStream(stream)
    }
    onCancel()
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Microphone Access
          </DialogTitle>
          <DialogDescription>
            We need access to your microphone to record your story
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {status === 'checking' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mic className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground">Checking microphone access...</p>
            </div>
          ) : status === 'granted' ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                Microphone access granted! You're ready to record.
              </AlertDescription>
            </Alert>
          ) : status === 'denied' ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <MicOff className="h-4 w-4" />
                <AlertDescription>
                  {error || 'Microphone access was blocked'}
                </AlertDescription>
              </Alert>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  How to enable microphone access:
                </h4>
                <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
                  <li>Look for the camera/microphone icon in your browser's address bar</li>
                  <li>Click it and select "Allow" for microphone access</li>
                  <li>Refresh the page and try again</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-2">
                  Or go to your browser settings → Site permissions → Microphone
                </p>
              </div>

              <Button 
                onClick={handleCheckPermission} 
                variant="outline"
                className="w-full gap-2"
              >
                <Mic className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          ) : status === 'unsupported' ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Your browser or device does not support microphone recording'}
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mic className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-medium mb-2">Ready to Record?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Click below to allow microphone access
              </p>
              <Button onClick={handleCheckPermission} size="lg" className="gap-2">
                <Mic className="h-4 w-4" />
                Allow Microphone
              </Button>
            </div>
          )}

          {status !== 'granted' && (
            <div className="flex gap-2">
              <Button onClick={handleCancel} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
