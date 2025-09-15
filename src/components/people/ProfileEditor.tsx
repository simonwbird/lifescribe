import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import ProfilePhotoUploader from '@/components/ProfilePhotoUploader'
import { useToast } from '@/hooks/use-toast'
import { Camera, User, Mail, Link as LinkIcon } from 'lucide-react'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  settings: any
  feature_flags: any
  default_space_id: string | null
}

interface LinkedPerson {
  id: string
  full_name: string
  avatar_url: string | null
}

interface ProfileEditorProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ProfileEditor({ onSuccess, onCancel }: ProfileEditorProps) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [linkedPerson, setLinkedPerson] = useState<LinkedPerson | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to edit your profile",
          variant: "destructive"
        })
        return
      }

      // Load user profile
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        toast({
          title: "Error",
          description: "Failed to load your profile",
          variant: "destructive"
        })
        return
      }

      setProfile(profileData)
      setFormData({
        full_name: profileData.full_name || '',
        avatar_url: profileData.avatar_url || ''
      })

      // Try to load linked family tree person
      const { data: familyMembership } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single()

      if (familyMembership) {
        const { data: linkedPersonData } = await supabase
          .from('person_user_links')
          .select(`
            person_id,
            people (id, full_name, avatar_url)
          `)
          .eq('user_id', user.id)
          .eq('family_id', familyMembership.family_id)
          .single()

        if (linkedPersonData?.people) {
          setLinkedPerson(linkedPersonData.people as LinkedPerson)
        }
      }

    } catch (error) {
      console.error('Error loading profile:', error)
      toast({
        title: "Error",
        description: "Failed to load your profile",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    try {
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim() || null,
          avatar_url: formData.avatar_url.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      // Sync to linked family tree person if exists
      if (linkedPerson) {
        try {
          await supabase
            .from('people')
            .update({ 
              avatar_url: formData.avatar_url.trim() || null,
              full_name: formData.full_name.trim() || linkedPerson.full_name
            })
            .eq('id', linkedPerson.id)
        } catch (syncError) {
          console.error('Error syncing to family tree:', syncError)
          // Don't fail the whole operation if sync fails
        }
      }

      toast({
        title: "Success",
        description: "Your profile has been updated successfully"
      })

      // Reload profile to get updated data
      await loadProfile()
      onSuccess?.()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update your profile",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUploaded = async (newPhotoUrl: string) => {
    setFormData(prev => ({ ...prev, avatar_url: newPhotoUrl }))
    setProfile(prev => prev ? { ...prev, avatar_url: newPhotoUrl } : null)
    
    // Auto-sync photo to linked family tree person
    if (linkedPerson) {
      try {
        await supabase
          .from('people')
          .update({ avatar_url: newPhotoUrl })
          .eq('id', linkedPerson.id)
        
        setLinkedPerson(prev => prev ? { ...prev, avatar_url: newPhotoUrl } : null)
      } catch (error) {
        console.error('Error syncing photo to family tree:', error)
      }
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Failed to load profile data
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile Photo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Photo
          </CardTitle>
          <CardDescription>
            Update your profile photo and display name
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <ProfilePhotoUploader
                currentPhotoUrl={linkedPerson?.avatar_url || formData.avatar_url || profile.avatar_url || ''}
                fallbackText={formData.full_name 
                  ? getInitials(formData.full_name)
                  : profile.full_name 
                  ? getInitials(profile.full_name)
                  : getInitials(profile.email)
                }
                onPhotoUploaded={handlePhotoUploaded}
                isUserProfile={true}
                size="lg"
              />
              {linkedPerson && (
                <div className="text-xs text-center text-muted-foreground">
                  <LinkIcon className="h-3 w-3 inline mr-1" />
                  Linked to: {linkedPerson.full_name}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="avatar_url">Profile Photo URL (Optional)</Label>
              <Input
                id="avatar_url"
                value={formData.avatar_url}
                onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                placeholder="https://example.com/your-photo.jpg"
              />
              <p className="text-xs text-muted-foreground">
                You can upload a photo using the uploader on the left, or paste a URL here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Your name and basic details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email address cannot be changed from here
            </p>
          </div>

          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Enter your full name"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This is how your name will appear throughout the family space
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}