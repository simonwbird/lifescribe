import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { trackCodeCreated } from '@/lib/eventTrackingService'
import { toast } from 'sonner'
import { Copy, Hash, Clock, Users, CheckCircle } from 'lucide-react'

interface CreateFamilyCodeModalProps {
  open: boolean
  onClose: () => void
  familyId: string
  familyName: string
}

interface FamilyCode {
  code: string
  invite_id: string
  expires_at: string
  max_uses: number
  used_count: number
}

export function CreateFamilyCodeModal({ open, onClose, familyId, familyName }: CreateFamilyCodeModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedCode, setGeneratedCode] = useState<FamilyCode | null>(null)
  const [expiresInHours, setExpiresInHours] = useState('72')
  const [maxUses, setMaxUses] = useState('10')
  const [copied, setCopied] = useState(false)

  const handleCreateCode = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        setError('Please sign in to create a family code')
        return
      }

      const response = await supabase.functions.invoke('family-codes', {
        body: {
          familyId,
          expiresInHours: parseInt(expiresInHours),
          maxUses: parseInt(maxUses)
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      })

      if (response.error) {
        throw response.error
      }

      const result = response.data

      if (result.error) {
        setError(result.error)
        return
      }

      setGeneratedCode(result)
      toast.success('Family code created successfully!')

    } catch (error: any) {
      console.error('Error creating family code:', error)
      setError(error.message || 'Failed to create family code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyCode = async () => {
    if (!generatedCode) return

    try {
      await navigator.clipboard.writeText(generatedCode.code)
      setCopied(true)
      toast.success('Code copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy code')
    }
  }

  const handleClose = () => {
    setGeneratedCode(null)
    setError(null)
    setCopied(false)
    onClose()
  }

  const formatExpiryDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Create Family Code
          </DialogTitle>
          <DialogDescription>
            Generate a shareable code for "{familyName}" that allows new members to join easily.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!generatedCode ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expires">Expires In</Label>
                  <Select value={expiresInHours} onValueChange={setExpiresInHours}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="72">3 days (recommended)</SelectItem>
                      <SelectItem value="168">1 week</SelectItem>
                      <SelectItem value="336">2 weeks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-uses">Max Uses</Label>
                  <Select value={maxUses} onValueChange={setMaxUses}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 use</SelectItem>
                      <SelectItem value="5">5 uses</SelectItem>
                      <SelectItem value="10">10 uses (recommended)</SelectItem>
                      <SelectItem value="25">25 uses</SelectItem>
                      <SelectItem value="100">100 uses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateCode} disabled={isLoading} className="flex-1">
                  {isLoading ? 'Creating...' : 'Create Code'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                      <Hash className="h-5 w-5 text-primary" />
                      <span className="font-mono text-2xl font-bold tracking-wider">
                        {generatedCode.code}
                      </span>
                    </div>

                    <Button 
                      onClick={handleCopyCode}
                      variant="outline"
                      className="w-full"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Expires: {formatExpiryDate(generatedCode.expires_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Can be used {generatedCode.max_uses} times ({generatedCode.used_count} used)</span>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  Share this code with people you want to invite to your family. They can enter it on the LifeScribe homepage to join.
                </AlertDescription>
              </Alert>

              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}