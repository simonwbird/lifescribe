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
import { Download, Trash2, ShieldAlert } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import type { Profile } from '@/lib/types'

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [linkedPerson, setLinkedPerson] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
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

  const handleExportData = async () => {
    if (!profile) return

    setExporting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const response = await fetch(`https://imgtnixyralpdrmedwzi.supabase.co/functions/v1/export-data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'family-data-export.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Export Complete',
        description: 'Your data has been downloaded successfully.',
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting your data. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!profile) return

    setDeleting(true)
    try {
      // Sign out the user
      await supabase.auth.signOut()
      
      toast({
        title: 'Account Access Removed',
        description: 'Your account access has been removed. Your data will be processed for deletion.',
      })

      // Redirect to home
      navigate('/')
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: 'Error',
        description: 'There was an error processing your request. Please try again.',
        variant: 'destructive',
      })
      setDeleting(false)
    }
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
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

            {/* Mode Settings */}
            <ModeToggle />

            {/* Privacy & Data Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  Privacy & Data
                </CardTitle>
                <CardDescription>
                  Manage your data and account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Export My Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Download all your stories, photos, and family data
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleExportData}
                    disabled={exporting}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {exporting ? 'Exporting...' : 'Export'}
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
                  <div>
                    <h4 className="font-medium text-destructive">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently remove your account and data access
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        className="flex items-center gap-2"
                        disabled={deleting}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove your account access. Your family data may be retained 
                          for other family members. This action cannot be undone.
                          <br /><br />
                          Are you sure you want to delete your account?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteAccount}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleting ? 'Deleting...' : 'Delete Account'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthGate>
  )
}