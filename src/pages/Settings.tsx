import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import Header from '@/components/Header'
import { useMode } from '@/hooks/useMode'
import { useLabs } from '@/hooks/useLabs'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Users,
  User,
  Mail,
  Clock,
  Eye,
  Download,
  Trash2,
  Key,
  Smartphone,
  Globe
} from 'lucide-react'

interface NotificationSettings {
  comments: boolean
  reactions: boolean
  invites: boolean
  weeklyDigest: boolean
  digestDay: number
  digestHour: number
}

interface PrivacySettings {
  defaultStoryVisibility: 'family' | 'private'
  profileVisibility: boolean
  addressVisibility: 'exact' | 'approximate' | 'hidden'
}

export default function Settings() {
  const { mode, flags } = useMode()
  const { labsEnabled, updateLabsEnabled } = useLabs()
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState<NotificationSettings>({
    comments: true,
    reactions: true,
    invites: true,
    weeklyDigest: false,
    digestDay: 0, // Sunday
    digestHour: 9
  })
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    defaultStoryVisibility: 'family',
    profileVisibility: true,
    addressVisibility: 'exact'
  })
  const [profile, setProfile] = useState<{simple_mode?: boolean} | null>(null)

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const hourNames = Array.from({ length: 24 }, (_, i) => {
    const hour = i === 0 ? 12 : i > 12 ? i - 12 : i
    const ampm = i < 12 ? 'AM' : 'PM'
    return `${hour}:00 ${ampm}`
  })

  useEffect(() => {
    loadUserSettings()
  }, [])

  const loadUserSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('settings, simple_mode')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile({ simple_mode: profileData.simple_mode })
        
        const settings = profileData.settings as any
        
        // Load notification settings
        if (settings?.notifications) {
          setNotifications({ ...notifications, ...settings.notifications })
        }
        
        // Load privacy settings
        if (settings?.privacy) {
          setPrivacy({ ...privacy, ...settings.privacy })
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const updateSettings = async (section: string, newSettings: any) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('settings')
        .eq('id', user.id)
        .single()

      const currentSettings = (profile?.settings as any) || {}
      const updatedSettings = {
        ...currentSettings,
        [section]: newSettings
      }

      await supabase
        .from('profiles')
        .update({ settings: updatedSettings })
        .eq('id', user.id)

      toast.success('Settings updated successfully')
    } catch (error) {
      console.error('Error updating settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationChange = (key: keyof NotificationSettings, value: any) => {
    const newNotifications = { ...notifications, [key]: value }
    setNotifications(newNotifications)
    updateSettings('notifications', newNotifications)
  }

  const handlePrivacyChange = (key: keyof PrivacySettings, value: any) => {
    const newPrivacy = { ...privacy, [key]: value }
    setPrivacy(newPrivacy)
    updateSettings('privacy', newPrivacy)
  }

  const handleLabsToggle = async (enabled: boolean) => {
    await updateLabsEnabled(enabled)
    toast.success(enabled ? 'Labs enabled' : 'Labs disabled')
  }

  const handleExportData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.functions.invoke('export-data', {
        body: { userId: user.id }
      })

      if (error) throw error

      // Create and download the file
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `lifescribe-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Data exported successfully')
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <SettingsIcon className="h-8 w-8" />
              Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your account, privacy, and app preferences
            </p>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">

              {/* Simple Mode for Accessibility */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Accessibility
                  </CardTitle>
                  <CardDescription>
                    Adjust the interface to make it more comfortable and easier to use
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="simple-mode-toggle" className="text-base font-medium">
                        Simple Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Larger buttons, clearer prompts, and guided recording to make sharing stories easier
                      </p>
                    </div>
                    <Switch
                      id="simple-mode-toggle"
                      checked={profile?.simple_mode || false}
                      onCheckedChange={async (enabled) => {
                        try {
                          const { data: { user } } = await supabase.auth.getUser()
                          if (!user) return

                          const { error } = await supabase
                            .from('profiles')
                            .update({ simple_mode: enabled })
                            .eq('id', user.id)

                          if (error) throw error

                          setProfile(prev => prev ? { ...prev, simple_mode: enabled } : null)
                          toast.success(enabled ? 'Simple Mode enabled' : 'Simple Mode disabled')
                        } catch (error) {
                          console.error('Error updating simple mode:', error)
                          toast.error('Failed to update Simple Mode setting')
                        }
                      }}
                      disabled={loading}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Labs Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Experimental Features
                    <Badge variant="secondary">Labs</Badge>
                  </CardTitle>
                  <CardDescription>
                    Enable experimental features and early access to new capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="labs-toggle" className="text-base font-medium">
                        Enable Labs Features
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Access advanced tools like GEDCOM import, alternate tree views, and analytics
                      </p>
                    </div>
                    <Switch
                      id="labs-toggle"
                      checked={labsEnabled}
                      onCheckedChange={handleLabsToggle}
                      disabled={loading}
                    />
                  </div>
                  {labsEnabled && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Visit the <span className="font-medium">Labs</span> section to configure individual features
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Default Privacy Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Default Story Visibility
                  </CardTitle>
                  <CardDescription>
                    Choose the default privacy setting for new stories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={privacy.defaultStoryVisibility}
                    onValueChange={(value: 'family' | 'private') => 
                      handlePrivacyChange('defaultStoryVisibility', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">Family - Visible to all family members</SelectItem>
                      <SelectItem value="private">Private - Only visible to you</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              {/* Activity Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Activity Notifications
                  </CardTitle>
                  <CardDescription>
                    Choose what activities you want to be notified about
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="comments-notif">Comments</Label>
                      <p className="text-sm text-muted-foreground">
                        When someone comments on your stories
                      </p>
                    </div>
                    <Switch
                      id="comments-notif"
                      checked={notifications.comments}
                      onCheckedChange={(checked) => 
                        handleNotificationChange('comments', checked)
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="reactions-notif">Reactions</Label>
                      <p className="text-sm text-muted-foreground">
                        When someone reacts to your stories
                      </p>
                    </div>
                    <Switch
                      id="reactions-notif"
                      checked={notifications.reactions}
                      onCheckedChange={(checked) => 
                        handleNotificationChange('reactions', checked)
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="invites-notif">Family Invitations</Label>
                      <p className="text-sm text-muted-foreground">
                        When you receive family invitations
                      </p>
                    </div>
                    <Switch
                      id="invites-notif"
                      checked={notifications.invites}
                      onCheckedChange={(checked) => 
                        handleNotificationChange('invites', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Digest */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Weekly Digest
                  </CardTitle>
                  <CardDescription>
                    Get a weekly summary of family activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="digest-toggle">Enable Weekly Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly email with family updates
                      </p>
                    </div>
                    <Switch
                      id="digest-toggle"
                      checked={notifications.weeklyDigest}
                      onCheckedChange={(checked) => 
                        handleNotificationChange('weeklyDigest', checked)
                      }
                    />
                  </div>
                  {notifications.weeklyDigest && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="digest-day">Delivery Day</Label>
                          <Select
                            value={notifications.digestDay.toString()}
                            onValueChange={(value) => 
                              handleNotificationChange('digestDay', parseInt(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {dayNames.map((day, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="digest-hour">Delivery Time</Label>
                          <Select
                            value={notifications.digestHour.toString()}
                            onValueChange={(value) => 
                              handleNotificationChange('digestHour', parseInt(value))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {hourNames.map((time, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-6">
              {/* Profile Privacy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Privacy
                  </CardTitle>
                  <CardDescription>
                    Control who can see your profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="profile-visibility">Profile Visibility</Label>
                      <p className="text-sm text-muted-foreground">
                        Make your profile visible to other family members
                      </p>
                    </div>
                    <Switch
                      id="profile-visibility"
                      checked={privacy.profileVisibility}
                      onCheckedChange={(checked) => 
                        handlePrivacyChange('profileVisibility', checked)
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address Privacy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Address Privacy
                  </CardTitle>
                  <CardDescription>
                    Choose how property addresses are displayed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="address-visibility">Default Address Visibility</Label>
                    <Select
                      value={privacy.addressVisibility}
                      onValueChange={(value: 'exact' | 'approximate' | 'hidden') => 
                        handlePrivacyChange('addressVisibility', value)
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exact">Show exact address</SelectItem>
                        <SelectItem value="approximate">Show approximate location</SelectItem>
                        <SelectItem value="hidden">Hide address completely</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              {/* Data Export */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Your Data
                  </CardTitle>
                  <CardDescription>
                    Download a copy of all your family data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Export Family Data</p>
                      <p className="text-sm text-muted-foreground">
                        Download stories, photos, and family tree data as JSON
                      </p>
                    </div>
                    <Button 
                      onClick={handleExportData}
                      disabled={loading}
                      size="sm"
                    >
                      {loading ? 'Exporting...' : 'Export'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Security
                  </CardTitle>
                  <CardDescription>
                    Manage your account security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Change Password</p>
                      <p className="text-sm text-muted-foreground">
                        Update your account password
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Coming Soon
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-destructive/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions that affect your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                    <div>
                      <p className="font-medium text-destructive">Delete Account</p>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <Button variant="destructive" size="sm" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}