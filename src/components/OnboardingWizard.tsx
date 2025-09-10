import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Camera, Upload, Users, TreePine, BookOpen, ChefHat, Package, ArrowLeft, ArrowRight, Mail, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import ProfilePhotoUploader from './ProfilePhotoUploader'

interface OnboardingWizardProps {
  user: User
}

export default function OnboardingWizard({ user }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [familyId, setFamilyId] = useState<string>('')
  
  // Step data
  const [familyName, setFamilyName] = useState('')
  const [familyPhoto, setFamilyPhoto] = useState('')
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [profilePhoto, setProfilePhoto] = useState('')
  const [inviteEmails, setInviteEmails] = useState<string[]>([''])
  const [startingFocus, setStartingFocus] = useState<'tree' | 'stories' | 'recipes' | 'things'>('stories')
  
  const navigate = useNavigate()
  
  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const focusOptions = [
    {
      id: 'tree' as const,
      title: 'Family Tree',
      description: 'Map your family connections and relationships',
      icon: TreePine,
      color: 'bg-green-500'
    },
    {
      id: 'stories' as const,
      title: 'Family Stories',
      description: 'Share memories and experiences',
      icon: BookOpen,
      color: 'bg-blue-500'
    },
    {
      id: 'recipes' as const,
      title: 'Family Recipes',
      description: 'Preserve culinary traditions',
      icon: ChefHat,
      color: 'bg-orange-500'
    },
    {
      id: 'things' as const,
      title: 'Family Treasures',
      description: 'Catalog heirlooms and special items',
      icon: Package,
      color: 'bg-purple-500'
    }
  ]

  const handleNext = async () => {
    if (currentStep === 1) {
      await handleFamilySetup()
    } else if (currentStep === 2) {
      await handleFamilyPhotoUpload()
    } else if (currentStep === 3) {
      await handleProfileSetup()
    } else if (currentStep === 4) {
      await handleInvites()
    } else if (currentStep === 5) {
      await handleStartingFocus()
    }
  }

  const handleFamilySetup = async () => {
    if (!familyName.trim()) {
      setError('Family name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create profile first if it doesn't exist
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email!,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })

      // Create family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: familyName,
          created_by: user.id,
        })
        .select()
        .single()

      if (familyError) throw familyError

      // Add user as admin member
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          family_id: family.id,
          profile_id: user.id,
          role: 'admin',
        })

      if (memberError) throw memberError

      setFamilyId(family.id)
      setCurrentStep(2)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFamilyPhotoUpload = async () => {
    setCurrentStep(3)
  }

  const handleProfileSetup = async () => {
    setLoading(true)
    setError('')

    try {
      const updateData: any = {
        full_name: fullName,
        updated_at: new Date().toISOString(),
      }

      if (profilePhoto) {
        updateData.avatar_url = profilePhoto
      }

      await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      // If we have date of birth, create a person record
      if (dateOfBirth && familyId) {
        const { error: personError } = await supabase
          .from('people')
          .insert({
            family_id: familyId,
            full_name: fullName,
            given_name: fullName.split(' ')[0],
            surname: fullName.split(' ').slice(1).join(' '),
            birth_date: dateOfBirth,
            avatar_url: profilePhoto,
            created_by: user.id,
          })

        if (personError) console.error('Person creation error:', personError)
      }

      setCurrentStep(4)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInvites = async () => {
    const validEmails = inviteEmails.filter(email => email.trim() && email.includes('@'))
    
    if (validEmails.length > 0) {
      setLoading(true)
      
      try {
        const invitePromises = validEmails.map(email => {
          const token = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15)
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 7)

          return supabase
            .from('invites')
            .insert({
              family_id: familyId,
              email: email.trim(),
              role: 'member',
              token,
              invited_by: user.id,
              expires_at: expiresAt.toISOString(),
            })
        })

        await Promise.all(invitePromises)
      } catch (error: any) {
        console.error('Invite error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    setCurrentStep(5)
  }

  const handleStartingFocus = async () => {
    // Navigate to the appropriate first action based on focus
    const focusRoutes = {
      tree: `/family-tree?first-action=add-person`,
      stories: `/new-story?first-action=memory-prompt`,
      recipes: `/archive?tab=recipes&first-action=add-recipe`,
      things: `/archive?tab=things&first-action=add-item`
    }
    
    navigate(focusRoutes[startingFocus])
  }

  const addInviteEmail = () => {
    setInviteEmails([...inviteEmails, ''])
  }

  const updateInviteEmail = (index: number, value: string) => {
    const updated = [...inviteEmails]
    updated[index] = value
    setInviteEmails(updated)
  }

  const removeInviteEmail = (index: number) => {
    setInviteEmails(inviteEmails.filter((_, i) => i !== index))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">LifeScribe</h1>
          </div>
          <CardTitle>Welcome to Your Family's Journey</CardTitle>
          <CardDescription>
            Let's get you set up in just a few quick steps
          </CardDescription>
          <div className="mt-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Family Name */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">What's your family name?</h3>
                <p className="text-muted-foreground">This will be the name of your family space</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="familyName">Family Name</Label>
                <Input
                  id="familyName"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="The Johnson Family"
                  className="text-center text-lg"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fullName">Your Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Family Photo */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Add a family photo</h3>
                <p className="text-muted-foreground">This helps make your family space feel like home</p>
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25">
                  {familyPhoto ? (
                    <img src={familyPhoto} alt="Family" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <Button variant="outline" className="w-fit">
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Family Photo
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(3)}>
                  Skip for now
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Personal Profile */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Tell us about yourself</h3>
                <p className="text-muted-foreground">Add your photo and basic info</p>
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                <ProfilePhotoUploader
                  onPhotoUploaded={(url) => setProfilePhoto(url)}
                  currentPhotoUrl={profilePhoto}
                  fallbackText={fullName.charAt(0) || '?'}
                />
                
                <div className="w-full max-w-sm space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth (Optional)</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Invite Family */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Invite your family</h3>
                <p className="text-muted-foreground">Add family members to start building together</p>
              </div>
              
              <div className="space-y-3">
                {inviteEmails.map((email, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => updateInviteEmail(index, e.target.value)}
                      placeholder="family@example.com"
                    />
                    {inviteEmails.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeInviteEmail(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addInviteEmail}
                  className="w-full"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Add Another Email
                </Button>
                
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(5)}>
                  Skip invites for now
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Starting Focus */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">What would you like to start with?</h3>
                <p className="text-muted-foreground">Choose your first focus to get that "aha!" moment</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {focusOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <Card
                      key={option.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        startingFocus === option.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setStartingFocus(option.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`w-12 h-12 ${option.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{option.title}</h4>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button onClick={handleNext} disabled={loading}>
              {loading ? 'Loading...' : currentStep === totalSteps ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Get Started
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}