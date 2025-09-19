/**
 * Region & Format settings component for Profile page
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Globe, Clock, Calendar, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { formatForUser, REGION_PRESETS } from '@/utils/date'
import { SUPPORTED_LOCALES, COMMON_TIMEZONES, type UserLocale } from '@/lib/localizationTypes'
import { detectBrowserRegion, formatTimezone } from '@/utils/browserDetection'
import { supabase } from '@/lib/supabase'

interface RegionSettingsProps {
  currentSettings?: UserLocale
  onUpdate?: (settings: UserLocale) => void
  onSettingsUpdated?: (settings: UserLocale) => void
  showAsCard?: boolean
}

export default function RegionSettings({ 
  currentSettings, 
  onUpdate, 
  onSettingsUpdated, 
  showAsCard = true 
}: RegionSettingsProps) {
  const [settings, setSettings] = useState<UserLocale>({
    locale: 'en-US',
    timezone: 'UTC',
    country: 'US',
    ...currentSettings
  })
  const [loading, setLoading] = useState(false)
  const [timezoneSearch, setTimezoneSearch] = useState('')
  const { toast } = useToast()

  // Sample dates for preview
  const previewData = {
    birthday: '1985-07-15',
    timestamp: '2024-01-15T14:30:00Z',
    recent: '2024-01-18T16:20:00Z'
  }

  const filteredTimezones = COMMON_TIMEZONES.filter(tz =>
    tz.toLowerCase().includes(timezoneSearch.toLowerCase())
  )

  const handleSave = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('profiles')
        .update({
          locale: settings.locale,
          timezone: settings.timezone,
          country: settings.country,
          date_format_preference: settings.dateFormatPreference || null
        })
        .eq('id', user.id)

      if (error) throw error

      toast({
        title: 'Settings saved',
        description: 'Your region preferences have been updated.'
      })

      onUpdate?.(settings)
      onSettingsUpdated?.(settings)
    } catch (error) {
      console.error('Failed to save region settings:', error)
      toast({
        title: 'Save failed',
        description: 'Could not save your region preferences. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDetectBrowser = () => {
    const detected = detectBrowserRegion()
    setSettings({
      locale: detected.locale,
      timezone: detected.timezone,
      country: detected.country
    })
    toast({
      title: 'Settings detected',
      description: `Updated to ${detected.locale} in ${detected.timezone}`
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Region & Format
        </CardTitle>
        <CardDescription>
          Customize how dates and times appear. Times show in your time zone. Birthdays never shift.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Browser Detection */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">Auto-detect from browser</p>
            <p className="text-xs text-muted-foreground">Use your browser's language and timezone</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleDetectBrowser}>
            Auto-detect
          </Button>
        </div>

        {/* Locale Selection */}
        <div className="space-y-2">
          <Label htmlFor="locale">Language & Region</Label>
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
                    <Badge variant="secondary" className="text-xs">
                      {locale.country}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Affects date formats, number formatting, and language-specific features
          </p>
        </div>

        {/* Timezone Selection */}
        <div className="space-y-2">
          <Label htmlFor="timezone">Time Zone</Label>
          <div className="space-y-2">
            <Input
              placeholder="Search timezones..."
              value={timezoneSearch}
              onChange={(e) => setTimezoneSearch(e.target.value)}
            />
            <Select
              value={settings.timezone}
              onValueChange={(value) => setSettings({ ...settings, timezone: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {filteredTimezones.map(tz => (
                  <SelectItem key={tz} value={tz}>
                    <div className="flex flex-col">
                      <span>{tz.replace('_', ' ')}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimezone(tz)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Timestamps and relative times will display in this timezone
          </p>
        </div>

        {/* Custom Date Format */}
        <div className="space-y-2">
          <Label htmlFor="date-format">Custom Date Format (Optional)</Label>
          <Input
            id="date-format"
            placeholder="e.g., dd/MM/yyyy"
            value={settings.dateFormatPreference || ''}
            onChange={(e) => setSettings({ 
              ...settings, 
              dateFormatPreference: e.target.value || undefined 
            })}
          />
          <p className="text-xs text-muted-foreground">
            Override default date format. Leave empty to use locale default.
          </p>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <Label>Preview</Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Birthday</p>
              <p className="text-sm">
                {formatForUser(previewData.birthday, 'dateOnly', settings)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Timestamp</p>
              <p className="text-sm">
                {formatForUser(previewData.timestamp, 'datetime', settings)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Relative</p>
              <p className="text-sm">
                {formatForUser(previewData.recent, 'relative', settings)}
              </p>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Times show in your time zone.</strong> Timestamps like "created 2 hours ago" will use your selected timezone.
            <br />
            <strong>Birthdays never shift.</strong> July 15, 1985 stays July 15, 1985 for everyone worldwide.
          </AlertDescription>
        </Alert>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}