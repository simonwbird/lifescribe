/**
 * Banner that appears when browser timezone differs from saved timezone
 */

import { useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Clock, X } from 'lucide-react'
import { detectTimezoneMismatch, formatTimezone } from '@/utils/browserDetection'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import type { UserLocale } from '@/lib/localizationTypes'

interface TimezoneMismatchBannerProps {
  userSettings: UserLocale
  onUpdate: (settings: UserLocale) => void
}

export default function TimezoneMismatchBanner({ 
  userSettings, 
  onUpdate 
}: TimezoneMismatchBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  // Check if there's a mismatch
  const hasMismatch = detectTimezoneMismatch(userSettings.timezone)
  
  if (!hasMismatch || dismissed) {
    return null
  }

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  
  const handleSwitchTimezone = async () => {
    setUpdating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const updatedSettings = {
        ...userSettings,
        timezone: browserTimezone
      }

      const { error } = await supabase
        .from('profiles')
        .update({ timezone: browserTimezone })
        .eq('id', user.id)

      if (error) throw error

      onUpdate(updatedSettings)
      setDismissed(true)
      
      toast({
        title: 'Timezone updated',
        description: `Switched to ${formatTimezone(browserTimezone)}`
      })
    } catch (error) {
      console.error('Failed to update timezone:', error)
      toast({
        title: 'Update failed',
        description: 'Could not update your timezone. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  return (
    <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
      <Clock className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1 pr-4">
          <strong>We noticed your device time zone differs from your profile.</strong>
          <br />
          <span className="text-sm">
            Profile: {formatTimezone(userSettings.timezone)}
            <br />
            Device: {formatTimezone(browserTimezone)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSwitchTimezone}
            disabled={updating}
          >
            {updating ? 'Switching...' : 'Use Device Time Zone'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}