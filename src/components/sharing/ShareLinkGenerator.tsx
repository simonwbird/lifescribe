import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Link, Check, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'

interface ShareLinkGeneratorProps {
  familyId: string
  familyName: string
}

export default function ShareLinkGenerator({ familyId, familyName }: ShareLinkGeneratorProps) {
  const [shareLink, setShareLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const { toast } = useToast()
  const { track } = useAnalytics()

  const generateShareLink = async () => {
    setGenerating(true)
    try {
      // Generate a shareable link - in a real app this might create a temporary invite token
      const baseUrl = window.location.origin
      const shareToken = `share-${familyId}-${Date.now().toString(36)}`
      const link = `${baseUrl}/join/${shareToken}`
      
      setShareLink(link)
      
      track('share_link_generated', {
        familyId,
        method: 'direct_link'
      })
      
      toast({
        title: "Share link generated",
        description: "Anyone with this link can request to join your family",
      })
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate share link",
        variant: "destructive"
      })
    } finally {
      setGenerating(false)
    }
  }

  const copyShareLink = async () => {
    if (!shareLink) return
    
    try {
      await navigator.clipboard.writeText(shareLink)
      setLinkCopied(true)
      
      track('share_link_copied', {
        familyId,
        method: 'clipboard'
      })
      
      toast({
        title: "Link copied successfully!",
        description: "Share link has been copied to your clipboard",
      })
      
      // Reset the copied state after 3 seconds
      setTimeout(() => setLinkCopied(false), 3000)
      
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy link to clipboard",
        variant: "destructive"
      })
    }
  }

  const regenerateLink = () => {
    setShareLink('')
    setLinkCopied(false)
    generateShareLink()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Share Link
        </CardTitle>
        <CardDescription>
          Generate a shareable link for {familyName} that allows others to request access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!shareLink ? (
          <Button 
            onClick={generateShareLink} 
            disabled={generating}
            className="w-full"
          >
            {generating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating Link...
              </>
            ) : (
              <>
                <Link className="h-4 w-4 mr-2" />
                Generate Share Link
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={shareLink}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={copyShareLink}
                className={linkCopied ? 'text-green-600 border-green-600' : ''}
              >
                {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={regenerateLink}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                New Link
              </Button>
              <Button
                size="sm"
                onClick={copyShareLink}
                disabled={linkCopied}
              >
                {linkCopied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> People using this link will need to request access, 
                which you can approve or deny. The link can be regenerated at any time to invalidate the old one.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}