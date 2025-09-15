import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Calendar, Mail, Settings } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function WeeklyDigest() {
  const [isEnabled, setIsEnabled] = useState(true)
  const [schedule, setSchedule] = useState('sunday')
  const { track } = useAnalytics()

  const handleToggle = (enabled: boolean) => {
    setIsEnabled(enabled)
    track('weekly_digest_toggled', { enabled })
    
    // In real app, would save to user preferences
    localStorage.setItem('weekly_digest_enabled', enabled.toString())
  }

  const handleScheduleChange = (newSchedule: string) => {
    setSchedule(newSchedule)
    track('weekly_digest_schedule_changed', { schedule: newSchedule })
    
    // In real app, would save to user preferences  
    localStorage.setItem('weekly_digest_schedule', newSchedule)
  }

  const scheduleOptions = [
    { value: 'sunday', label: 'Sunday morning' },
    { value: 'monday', label: 'Monday morning' },
    { value: 'friday', label: 'Friday evening' }
  ]

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Weekly Digest
          </CardTitle>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isEnabled ? (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Delivery schedule</span>
              </div>
              
              <div className="space-y-2">
                {scheduleOptions.map((option) => (
                  <label 
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="schedule"
                      value={option.value}
                      checked={schedule === option.value}
                      onChange={(e) => handleScheduleChange(e.target.value)}
                      className="text-primary"
                    />
                    <span className="text-sm text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Next digest: Sunday, Sept 22
                </p>
                <p className="text-xs text-muted-foreground">
                  Includes: New stories (3), Comments (2), Photos (5)
                </p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full gap-2 text-xs"
              onClick={() => track('weekly_digest_settings_opened')}
            >
              <Settings className="h-3 w-3" />
              Customize content
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Get a weekly summary of your family's stories and activities
            </p>
            <Button 
              size="sm"
              onClick={() => setIsEnabled(true)}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Enable digest
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}