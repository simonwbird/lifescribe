/**
 * One-time banner to confirm inferred region settings for existing users
 */

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Settings, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { formatForUser, REGION_PRESETS } from '@/utils/date'
import RegionSettings from './RegionSettings'

interface UserProfile {
  locale: string
  timezone: string  
  country: string
  region_inferred_source: string | null
  region_confirmed_at: string | null
}

export default function RegionConfirmationBanner() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    checkIfConfirmationNeeded()
  }, [])

  const checkIfConfirmationNeeded = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('locale, timezone, country, region_inferred_source, region_confirmed_at')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      // Show banner if region was inferred but not confirmed
      if (profileData?.region_inferred_source && !profileData?.region_confirmed_at) {
        setProfile(profileData)
        setShowBanner(true)
      }
    } catch (error) {
      console.error('Error checking confirmation status:', error)
    }
  }

  const confirmCurrentSettings = async () => {
    if (!profile) return
    
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({ region_confirmed_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error

      // Track telemetry
      await trackRegionEvent('REGION_PREFS_CONFIRMED', profile)

      setShowBanner(false)
      toast({
        title: "Settings confirmed",
        description: "Your region preferences have been saved."
      })
    } catch (error) {
      console.error('Error confirming settings:', error)
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const openChangeSettings = () => {
    setShowSettings(true)
  }

  const handleSettingsUpdated = async (newSettings: any) => {
    // Track telemetry for settings change
    await trackRegionEvent('REGION_PREFS_UPDATED', profile)
    
    setShowBanner(false)
    setShowSettings(false)
    toast({
      title: "Settings updated", 
      description: "Your region preferences have been updated."
    })
  }

  const dismissBanner = async () => {
    // Still mark as confirmed even if dismissed
    await confirmCurrentSettings()
  }

  const trackRegionEvent = async (eventName: string, profileData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('analytics_events')
        .insert({
          user_id: user.id,
          event_name: eventName,
          properties: {
            locale: profileData.locale,
            timezone: profileData.timezone,
            country: profileData.country,
            inference_source: profileData.region_inferred_source
          }
        })
    } catch (error) {
      console.error('Error tracking region event:', error)
    }
  }

  if (!showBanner || !profile) {
    return null
  }

  const getInferenceSourceLabel = (source: string) => {
    switch (source) {
      case 'browser': return 'Browser settings'
      case 'ip': return 'Location'  
      case 'default': return 'Default settings'
      default: return 'Auto-detected'
    }
  }

  const sampleDate = new Date().toISOString()

  return (
    <>
      <Card className="border-primary bg-primary/5 mb-6">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">We set your region to:</span>
                  <Badge variant="secondary">{profile.locale}</Badge>
                  <Badge variant="secondary">{profile.timezone}</Badge>
                  <Badge variant="outline" className="text-xs">
                    {getInferenceSourceLabel(profile.region_inferred_source!)}
                  </Badge>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Dates will display as: <span className="font-medium">
                    {formatForUser(sampleDate, 'datetime', {
                      locale: profile.locale,
                      timezone: profile.timezone
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Button 
                    onClick={confirmCurrentSettings}
                    disabled={loading}
                    size="sm"
                  >
                    Keep These Settings
                  </Button>
                  
                  <Dialog open={showSettings} onOpenChange={setShowSettings}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={openChangeSettings}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Change
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Update Region Settings</DialogTitle>
                      </DialogHeader>
                      <RegionSettings 
                        onSettingsUpdated={handleSettingsUpdated}
                        showAsCard={false}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={dismissBanner}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}