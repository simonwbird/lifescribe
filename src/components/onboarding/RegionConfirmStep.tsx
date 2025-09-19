/**
 * Onboarding step for confirming region settings
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Globe, MapPin, Clock, ArrowRight } from 'lucide-react'
import { SUPPORTED_LOCALES, COMMON_TIMEZONES, type UserLocale } from '@/lib/localizationTypes'
import { detectBrowserRegion, formatTimezone } from '@/utils/browserDetection'
import { formatForUser } from '@/utils/date'

interface RegionConfirmStepProps {
  onComplete: (settings: UserLocale) => void
  onSkip: () => void
}

export default function RegionConfirmStep({ onComplete, onSkip }: RegionConfirmStepProps) {
  const [settings, setSettings] = useState<UserLocale>({
    locale: 'en-US',
    timezone: 'UTC',
    country: 'US'
  })
  const [detected, setDetected] = useState(false)

  useEffect(() => {
    // Auto-detect browser settings on mount
    const browserSettings = detectBrowserRegion()
    setSettings({
      locale: browserSettings.locale,
      timezone: browserSettings.timezone,
      country: browserSettings.country
    })
    setDetected(true)
  }, [])

  const previewDate = '1985-07-15'
  const previewTimestamp = '2024-01-15T14:30:00Z'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Globe className="h-12 w-12 mx-auto text-primary" />
        <h2 className="text-2xl font-bold">Confirm your region settings</h2>
        <p className="text-muted-foreground">
          We've detected your preferences from your browser. You can adjust these anytime in your profile.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Region Preferences</CardTitle>
          <CardDescription>
            These settings control how dates and times appear throughout the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Auto-detection Badge */}
          {detected && (
            <div className="flex items-center justify-center">
              <Badge variant="secondary" className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                Auto-detected from your browser
              </Badge>
            </div>
          )}

          {/* Language Selection */}
          <div className="space-y-2">
            <Label>Language & Region</Label>
            <Select
              value={settings.locale}
              onValueChange={(value) => setSettings({ ...settings, locale: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LOCALES.map(locale => (
                  <SelectItem key={locale.code} value={locale.code}>
                    <div className="flex items-center gap-2">
                      <span>{locale.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {locale.country}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timezone Selection */}
          <div className="space-y-2">
            <Label>Time Zone</Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => setSettings({ ...settings, timezone: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {COMMON_TIMEZONES.map(tz => (
                  <SelectItem key={tz} value={tz}>
                    <div className="flex flex-col">
                      <span>{tz.replace('_', ' ')}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimezone(tz).split('(')[1]?.replace(')', '')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <Label>Preview</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Birthday</p>
                <p className="text-sm font-medium">
                  {formatForUser(previewDate, 'dateOnly', settings)}
                </p>
                <p className="text-xs text-muted-foreground">Never changes for anyone</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Timestamp</p>
                <p className="text-sm font-medium">
                  {formatForUser(previewTimestamp, 'datetime', settings)}
                </p>
                <p className="text-xs text-muted-foreground">Shows in your timezone</p>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">How this works:</p>
                <ul className="text-blue-800 space-y-1">
                  <li>• <strong>Times show in your time zone</strong> - Comments, stories created "2 hours ago"</li>
                  <li>• <strong>Birthdays never shift</strong> - July 15, 1985 stays the same worldwide</li>
                  <li>• You can change these settings anytime in your profile</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
        <Button onClick={() => onComplete(settings)} className="flex items-center gap-2">
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}