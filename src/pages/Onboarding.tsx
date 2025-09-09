import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useNavigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'

export default function Onboarding() {
  const [user, setUser] = useState<User | null>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Profile data
  const [fullName, setFullName] = useState('')
  
  // Family data
  const [familyName, setFamilyName] = useState('')
  const [familyDescription, setFamilyDescription] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  
  const navigate = useNavigate()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        setFullName(user.user_metadata?.full_name || '')
      }
    }
    getUser()
  }, [])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setLoading(true)
    setError('')

    try {
      // Create or update profile with proper error handling
      const { data, error } = await (supabase as any)
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .select()
      
      if (error) {
        console.error('Profile error:', error)
        throw error
      }
      
      console.log('Profile created/updated:', data)
      setStep(2)
    } catch (error: any) {
      console.error('Profile update failed:', error)
      setError(`Profile update failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFamilyCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setLoading(true)
    setError('')

    try {
      // Verify profile exists first
      const { data: profileCheck } = await (supabase as any)
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (!profileCheck) {
        throw new Error('Profile not found. Please complete step 1 first.')
      }
      
      console.log('Profile verified:', profileCheck)

      // Create family with better error handling
      const { data: family, error: familyError } = await (supabase as any)
        .from('families')
        .insert({
          name: familyName,
          description: familyDescription,
          created_by: user.id,
        })
        .select()
        .single()
      
      if (familyError) {
        console.error('Family creation error:', familyError)
        throw familyError
      }

      console.log('Family created:', family)

      // Add user as admin member
      const { error: memberError } = await (supabase as any)
        .from('members')
        .insert({
          family_id: family.id,
          profile_id: user.id,
          role: 'admin',
        })
      
      if (memberError) {
        console.error('Member creation error:', memberError)
        throw memberError
      }

      console.log('Member added successfully')
      navigate('/feed')
    } catch (error: any) {
      console.error('Family creation failed:', error)
      setError(`Family creation failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFamilyJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setLoading(true)
    setError('')

    try {
      // Find invite by token
      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('*')
        .eq('token', joinCode)
        .eq('email', user.email)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()
      
      if (inviteError || !invite) {
        throw new Error('Invalid or expired invitation code')
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          family_id: invite.family_id,
          profile_id: user.id,
          role: invite.role,
        })
      
      if (memberError) throw memberError

      // Mark invite as accepted
      const { error: updateError } = await supabase
        .from('invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite.id)
      
      if (updateError) throw updateError
      
      navigate('/feed')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to LifeScribe</CardTitle>
            <CardDescription>Let's set up your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Loading...' : 'Continue'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Family Setup</CardTitle>
          <CardDescription>
            Create a new family or join an existing one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button
              variant={!isJoining ? "default" : "outline"}
              onClick={() => setIsJoining(false)}
              className="flex-1"
            >
              Create Family
            </Button>
            <Button
              variant={isJoining ? "default" : "outline"}
              onClick={() => setIsJoining(true)}
              className="flex-1"
            >
              Join Family
            </Button>
          </div>

          {!isJoining ? (
            <form onSubmit={handleFamilyCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="familyName">Family Name</Label>
                <Input
                  id="familyName"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="The Smith Family"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="familyDescription">Description (Optional)</Label>
                <Textarea
                  id="familyDescription"
                  value={familyDescription}
                  onChange={(e) => setFamilyDescription(e.target.value)}
                  placeholder="A place to share our family memories..."
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create Family'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleFamilyJoin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="joinCode">Invitation Code</Label>
                <Input
                  id="joinCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter your invitation code"
                  required
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Joining...' : 'Join Family'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}