import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { supabase } from '@/integrations/supabase/client'
import { Heart, Users, Bell, BellOff, Sparkles } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface GuestOnboardingProps {
  familyId: string
  onComplete: () => void
}

type OnboardingStep = 'welcome' | 'follow' | 'digest' | 'reaction'

export function GuestOnboarding({ familyId, onComplete }: GuestOnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set())
  const [digestEnabled, setDigestEnabled] = useState(true)
  const [completedReaction, setCompletedReaction] = useState(false)

  useEffect(() => {
    if (step === 'follow') {
      loadFamilyMembers()
    }
    if (step === 'reaction') {
      // Set guest mode defaults
      setGuestDefaults()
    }
  }, [step])

  const loadFamilyMembers = async () => {
    const { data } = await supabase
      .from('members')
      .select(`
        profile_id,
        profiles(id, full_name, avatar_url)
      `)
      .eq('family_id', familyId)
      .limit(10)

    setFamilyMembers(data || [])
  }

  const setGuestDefaults = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      // Set low-notification defaults
      await supabase
        .from('profiles')
        .update({
          settings: {
            notifications: {
              email: false,
              push: false,
              digest: true // Digest on by default
            },
            guest_mode: true
          }
        })
        .eq('id', user.id)

      // Enable digest for this family
      // @ts-ignore - Type issue with digest settings table
      await supabase
        .from('weekly_digest_settings')
        .upsert({
          family_id: familyId,
          created_by: user.id,
          enabled: true
        } as any)
    } catch (error) {
      console.error('Error setting guest defaults:', error)
    }
  }

  const togglePerson = (personId: string) => {
    const newSelected = new Set(selectedPeople)
    if (newSelected.has(personId)) {
      newSelected.delete(personId)
    } else {
      newSelected.add(personId)
    }
    setSelectedPeople(newSelected)
  }

  const handleNextStep = async () => {
    if (step === 'welcome') {
      setStep('follow')
    } else if (step === 'follow') {
      // Save follow preferences
      if (selectedPeople.size > 0) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const followPrefs = Array.from(selectedPeople).map(personId => ({
            user_id: user.id,
            family_id: familyId,
            followed_member_id: personId
          }))
          
          await supabase
            .from('digest_follow_preferences')
            .insert(followPrefs)
        }
      }
      setStep('digest')
    } else if (step === 'digest') {
      setStep('reaction')
    } else if (step === 'reaction' && completedReaction) {
      onComplete()
    }
  }

  const simulateReaction = () => {
    setCompletedReaction(true)
    toast({
      title: "Great! ❤️",
      description: "You'll see reactions like this throughout the app",
    })
  }

  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to the Family! 🎉</CardTitle>
            <CardDescription className="text-base">
              Let's get you set up in just 3 quick steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-medium">
                  1
                </div>
                <div>
                  <div className="font-medium">Follow family members</div>
                  <div className="text-muted-foreground text-xs">
                    Choose who you'd like to see updates from
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-medium">
                  2
                </div>
                <div>
                  <div className="font-medium">Weekly digest</div>
                  <div className="text-muted-foreground text-xs">
                    Get a gentle weekly summary
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-xs font-medium">
                  3
                </div>
                <div>
                  <div className="font-medium">Your first reaction</div>
                  <div className="text-muted-foreground text-xs">
                    Learn how to engage with content
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={handleNextStep} className="w-full mt-4">
              Let's Get Started
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Don't worry, we've set quiet defaults for you 🔕
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'follow') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
              <div className="text-sm text-muted-foreground">Step 1 of 3</div>
            </div>
            <CardTitle>Follow Family Members</CardTitle>
            <CardDescription>
              Select people you'd like to see in your weekly digest
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {familyMembers.map((member) => {
                const profile = member.profiles
                const isSelected = selectedPeople.has(member.profile_id)
                
                return (
                  <div
                    key={member.profile_id}
                    onClick={() => togglePerson(member.profile_id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>
                        {profile?.full_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{profile?.full_name || 'Unknown'}</div>
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('welcome')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleNextStep}
                className="flex-1"
              >
                {selectedPeople.size > 0 
                  ? `Continue with ${selectedPeople.size} selected`
                  : 'Skip for now'
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'digest') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              {digestEnabled ? (
                <Bell className="h-5 w-5 text-primary" />
              ) : (
                <BellOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="text-sm text-muted-foreground">Step 2 of 3</div>
            </div>
            <CardTitle>Weekly Digest</CardTitle>
            <CardDescription>
              Get a gentle summary of family activity once a week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="digest-toggle" className="cursor-pointer">
                  <div className="font-medium">Enable weekly digest</div>
                  <div className="text-xs text-muted-foreground">
                    Mondays at 9:00 AM
                  </div>
                </Label>
                <Switch
                  id="digest-toggle"
                  checked={digestEnabled}
                  onCheckedChange={setDigestEnabled}
                />
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="h-5 w-1.5 bg-primary rounded-full shrink-0 mt-0.5" />
                <div>Stories, photos, and updates from people you follow</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-1.5 bg-primary rounded-full shrink-0 mt-0.5" />
                <div>Upcoming birthdays and family events</div>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-5 w-1.5 bg-primary rounded-full shrink-0 mt-0.5" />
                <div>No other notifications - just this weekly email</div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('follow')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleNextStep}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'reaction') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-5 w-5 text-primary" />
              <div className="text-sm text-muted-foreground">Step 3 of 3</div>
            </div>
            <CardTitle>Your First Reaction</CardTitle>
            <CardDescription>
              Show your family some love! Try reacting to this sample post.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sample post */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>👤</AvatarFallback>
                </Avatar>
                <div className="text-sm font-medium">Family Member</div>
              </div>
              <p className="text-sm">
                Welcome to our family! We're so glad you're here. 🎉
              </p>
              
              <Button
                variant={completedReaction ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={simulateReaction}
              >
                <Heart className={`h-4 w-4 ${completedReaction ? 'fill-current' : ''}`} />
                {completedReaction ? 'Loved!' : 'React with ❤️'}
              </Button>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              💡 <span className="font-medium">Pro tip:</span> Reactions are a quick way to let family know you've seen and appreciated their posts without writing a comment.
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('digest')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleNextStep}
                disabled={!completedReaction}
                className="flex-1"
              >
                {completedReaction ? 'All Done! 🎉' : 'Try reacting first'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
