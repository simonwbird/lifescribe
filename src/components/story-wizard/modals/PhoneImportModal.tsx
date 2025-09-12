import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { QrCode, Smartphone, Upload, Copy, Check } from 'lucide-react'

interface PhoneImportModalProps {
  open: boolean
  onClose: () => void
}

export default function PhoneImportModal({ 
  open, 
  onClose 
}: PhoneImportModalProps) {
  const [copied, setCopied] = useState(false)
  
  // In production, this would be a real upload URL
  const uploadUrl = `${window.location.origin}/upload?token=demo123`

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(uploadUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Import from Phone
          </DialogTitle>
          <DialogDescription>
            Upload photos and videos directly from your phone to this story.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code */}
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <QrCode className="h-16 w-16 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">QR Code</p>
                  <p className="text-xs text-muted-foreground">
                    (Demo - would show real QR)
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Scan with your phone</h3>
                <p className="text-sm text-muted-foreground">
                  Open your phone's camera and scan this code to access the uploader
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Alternative Methods */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Or try these alternatives:</h4>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Upload className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">Copy upload link</h5>
                    <p className="text-xs text-muted-foreground mb-2">
                      Send this link to your phone via text or email
                    </p>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-muted p-2 rounded text-xs font-mono truncate">
                        {uploadUrl}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleCopyUrl}
                        className="px-2"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h5 className="font-medium text-sm">Use phone browser</h5>
                    <p className="text-xs text-muted-foreground">
                      Visit this story creation page on your phone to upload media directly
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-muted/30 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Tip:</strong> Photos uploaded from your phone will automatically be added to this story. 
              You can reorder them and add captions in the next step.
            </p>
          </div>

          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}