import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Calendar, Mail, Settings } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useToast } from '@/hooks/use-toast'

export default function WeeklyDigest() {
  const [isEnabled, setIsEnabled] = useState(true)
  const [schedule, setSchedule] = useState('sunday')
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false)
  const [contentSettings, setContentSettings] = useState({
    includeStories: true,
    includePhotos: true,
    includeComments: true,
    includeReactions: true,
    includeBirthdays: true,
    includeMemories: false,
    maxStories: 5,
    includeWeeklyHighlights: true
  })
  const { track } = useAnalytics()
  const { toast } = useToast()

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

  const handleCustomizeClick = () => {
    track('weekly_digest_settings_opened')
    setShowCustomizeDialog(true)
  }

  const handleSaveSettings = () => {
    // In real app, would save to database/user preferences
    localStorage.setItem('weekly_digest_content', JSON.stringify(contentSettings))
    
    toast({
      title: "Settings saved",
      description: "Your weekly digest preferences have been updated."
    })
    
    setShowCustomizeDialog(false)
    track('weekly_digest_settings_saved' as any, { settings: contentSettings })
  }

  const handleContentSettingChange = (setting: keyof typeof contentSettings, value: boolean | number) => {
    setContentSettings(prev => ({
      ...prev,
      [setting]: value
    }))
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
              onClick={handleCustomizeClick}
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

      {/* Customize Content Dialog */}
      <Dialog open={showCustomizeDialog} onOpenChange={setShowCustomizeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customize Weekly Digest</DialogTitle>
            <DialogDescription>
              Choose what content to include in your weekly family digest
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Content Types */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Content Types</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-stories" className="text-sm">New stories</Label>
                  <Switch
                    id="include-stories"
                    checked={contentSettings.includeStories}
                    onCheckedChange={(checked) => handleContentSettingChange('includeStories', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-photos" className="text-sm">New photos</Label>
                  <Switch
                    id="include-photos"
                    checked={contentSettings.includePhotos}
                    onCheckedChange={(checked) => handleContentSettingChange('includePhotos', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-comments" className="text-sm">Comments</Label>
                  <Switch
                    id="include-comments"
                    checked={contentSettings.includeComments}
                    onCheckedChange={(checked) => handleContentSettingChange('includeComments', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-reactions" className="text-sm">Reactions</Label>
                  <Switch
                    id="include-reactions"
                    checked={contentSettings.includeReactions}
                    onCheckedChange={(checked) => handleContentSettingChange('includeReactions', checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Special Content */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Special Content</Label>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-birthdays" className="text-sm">Upcoming birthdays</Label>
                  <Switch
                    id="include-birthdays"
                    checked={contentSettings.includeBirthdays}
                    onCheckedChange={(checked) => handleContentSettingChange('includeBirthdays', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-memories" className="text-sm">Memory prompts</Label>
                  <Switch
                    id="include-memories"
                    checked={contentSettings.includeMemories}
                    onCheckedChange={(checked) => handleContentSettingChange('includeMemories', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-highlights" className="text-sm">Weekly highlights</Label>
                  <Switch
                    id="include-highlights"
                    checked={contentSettings.includeWeeklyHighlights}
                    onCheckedChange={(checked) => handleContentSettingChange('includeWeeklyHighlights', checked)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomizeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              Save preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}