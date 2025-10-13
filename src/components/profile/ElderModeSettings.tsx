import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Phone, MessageSquare, Loader2, Copy, Check } from 'lucide-react'
import { useElderMode } from '@/hooks/useElderMode'
import { useState } from 'react'

interface ElderModeSettingsProps {
  userId: string
}

export default function ElderModeSettings({ userId }: ElderModeSettingsProps) {
  const { 
    isElderMode, 
    phoneCode, 
    enableElderMode, 
    disableElderMode,
    isEnabling,
    isDisabling 
  } = useElderMode(userId)
  
  const [copied, setCopied] = useState(false)

  const handleToggle = (checked: boolean) => {
    if (checked) {
      enableElderMode()
    } else {
      disableElderMode()
    }
  }

  const copyPhoneCode = () => {
    if (phoneCode) {
      navigator.clipboard.writeText(phoneCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isPending = isEnabling || isDisabling

  return (
    <Card>
      <CardHeader>
        <CardTitle>Elder Mode</CardTitle>
        <CardDescription>
          Large button interface optimized for seniors with voice-first features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="elder-mode">Enable Elder Mode</Label>
            <p className="text-sm text-muted-foreground">
              Switch to simplified, large-button interface
            </p>
          </div>
          <Switch
            id="elder-mode"
            checked={isElderMode}
            onCheckedChange={handleToggle}
            disabled={isPending}
          />
        </div>

        {isElderMode && phoneCode && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Call-In Code
              </h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-3 bg-muted rounded-lg text-2xl font-bold text-center">
                  {phoneCode}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyPhoneCode}
                  className="h-12 w-12 shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Use this code when calling or texting to leave voice messages
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Instructions
              </h4>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Call: <strong>(555) 123-4567</strong></li>
                <li>Enter code: <strong>{phoneCode}</strong></li>
                <li>Leave message after beep</li>
                <li>Your message will be transcribed and saved as a draft within 60 seconds</li>
              </ol>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                WhatsApp Instructions
              </h4>
              <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                <li>Send WhatsApp to: <strong>+1 (555) 123-4567</strong></li>
                <li>Include code <strong>{phoneCode}</strong> in first message</li>
                <li>Send voice messages or text</li>
                <li>Messages auto-transcribed and saved as drafts</li>
              </ol>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This is a demo. To enable real telephony integration, you'll need to:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
                <li>Set up a Twilio account and phone number</li>
                <li>Configure webhooks to point to the edge functions</li>
                <li>Add Twilio credentials to Supabase secrets</li>
                <li>Set up WhatsApp Business API (optional)</li>
              </ul>
            </div>
          </div>
        )}

        {isPending && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}