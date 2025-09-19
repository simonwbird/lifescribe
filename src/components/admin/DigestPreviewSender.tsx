/**
 * Component to send a digest preview email to test what it looks like
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

export default function DigestPreviewSender() {
  const [email, setEmail] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [lastSent, setLastSent] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSendPreview = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address to send the preview to.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-digest-preview', {
        body: {
          email,
          family_name: familyName || 'Your Family'
        }
      })

      if (error) throw error

      setLastSent(email)
      toast({
        title: '📧 Preview Sent!',
        description: `Weekly digest preview has been sent to ${email}. Check your inbox!`,
      })
    } catch (error) {
      console.error('Failed to send digest preview:', error)
      toast({
        title: 'Send Failed',
        description: 'Failed to send digest preview. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Preview Test
        </CardTitle>
        <CardDescription>
          Send yourself a sample weekly digest email to see what it looks like
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="preview-email">Your Email Address</Label>
          <Input
            id="preview-email"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="family-name">Family Name (Optional)</Label>
          <Input
            id="family-name"
            type="text"
            placeholder="Smith Family"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <Button 
          onClick={handleSendPreview}
          disabled={!email || isLoading}
          className="w-full gap-2"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
              Sending Preview...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Preview Email
            </>
          )}
        </Button>

        {lastSent && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              Preview sent to <strong>{lastSent}</strong>
            </span>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Preview includes:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Weekly activity stats (stories, photos, comments)</li>
              <li>Sample family stories and highlights</li>
              <li>Upcoming birthdays and anniversaries</li>
              <li>Memory prompts and photo galleries</li>
              <li>Beautiful responsive design</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}