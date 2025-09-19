import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
import ProfilePhotoUploader from '@/components/ProfilePhotoUploader'
import ModeToggle from '@/components/navigation/ModeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { ShieldAlert } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import ExportDataCard from '@/components/compliance/ExportDataCard'
import RTBFCard from '@/components/compliance/RTBFCard'
import RegionSettings from '@/components/RegionSettings'
import TimezoneMismatchBanner from '@/components/TimezoneMismatchBanner'
import type { UserLocale } from '@/lib/localizationTypes'
import type { Profile as ProfileType } from '@/lib/types'

export default function Profile() {
  const [profile, setProfile] = useState<ProfileType | null>(null)
  const [linkedPerson, setLinkedPerson] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [userRegion, setUserRegion] = useState<UserLocale>({
    locale: 'en-US',
    timezone: 'UTC', 
    country: 'US'
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Get user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileData) {
          setProfile(profileData)
          setFullName(profileData.full_name || '')
          
          // Set user region from profile
          setUserRegion({
            locale: profileData.locale || 'en-US',
            timezone: profileData.timezone || 'UTC',
            country: profileData.country || 'US',
            dateFormatPreference: profileData.date_format_preference || undefined
          })
        }

        // Get linked family tree person
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
              people (*)
            `)
            .eq('user_id', user.id)
            .eq('family_id', familyMembership.family_id)
            .single()

          if (linkedPersonData?.people) {
            setLinkedPerson(linkedPersonData.people)
          }
        }
      }
    }
    getProfile()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) throw error
      setProfile(prev => prev ? { ...prev, full_name: fullName } : null)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUploaded = async (newPhotoUrl: string) => {
    setProfile(prev => prev ? { ...prev, avatar_url: newPhotoUrl } : null)
    
    // Sync photo to linked family tree person
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


  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          
          {/* Timezone Mismatch Banner */}
          <div className="mb-6">
            <TimezoneMismatchBanner 
              userSettings={userRegion}
              onUpdate={setUserRegion}
            />
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Profile Settings</h1>
              <p className="text-muted-foreground mt-2">
                Manage your account information and preferences
              </p>
            </div>

            {/* Basic Profile Info */}
            <Card>
              <CardHeader className="text-center">
                <ProfilePhotoUploader
                  currentPhotoUrl={linkedPerson?.avatar_url || profile?.avatar_url || ''}
                  fallbackText={profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                  onPhotoUploaded={handlePhotoUploaded}
                  isUserProfile={true}
                  size="lg"
                />
                <CardTitle>
                  Your Profile
                  {linkedPerson && (
                    <div className="text-sm font-normal text-muted-foreground mt-1">
                      Linked to: {linkedPerson.full_name}
                    </div>
                  )}
                </CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Profile'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Region & Format Settings */}
            <RegionSettings 
              currentSettings={userRegion}
              onUpdate={setUserRegion}
            />

            {/* Mode Settings */}
            <ModeToggle />

            {/* Privacy & Data Management */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold flex items-center justify-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  Privacy & Data Management
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  GDPR/CCPA compliant data export and deletion tools
                </p>
              </div>
              
              <ExportDataCard />
              <RTBFCard />
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  )
}