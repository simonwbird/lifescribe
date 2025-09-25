import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, User, Users, Settings, Loader2, ArrowRight, ArrowLeft } from 'lucide-react'
import { useOnboarding, OnboardingStep } from '@/hooks/useOnboarding'
import { useAuth } from '@/contexts/AuthProvider'
import { useToast } from '@/hooks/use-toast'

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Name too long'),
  timezone: z.string().optional(),
  locale: z.string().optional()
})

const familySchema = z.object({
  familyName: z.string().min(1, 'Family name is required').max(50, 'Name too long'),
  description: z.string().max(200, 'Description too long').optional()
})

const preferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  weeklyDigest: z.boolean().default(true),
  simpleMode: z.boolean().default(false)
})

type ProfileFormData = z.infer<typeof profileSchema>
type FamilyFormData = z.infer<typeof familySchema>
type PreferencesFormData = z.infer<typeof preferencesSchema>

const steps: { key: OnboardingStep; title: string; description: string; icon: any }[] = [
  {
    key: 'profile_setup',
    title: 'Profile Setup',
    description: 'Tell us about yourself',
    icon: User
  },
  {
    key: 'family_setup', 
    title: 'Family Setup',
    description: 'Create or join a family',
    icon: Users
  },
  {
    key: 'preferences',
    title: 'Preferences',
    description: 'Customize your experience',
    icon: Settings
  }
]

export default function OnboardingWizard() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { state, loading, actions } = useOnboarding()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth/login')
    }
  }, [loading, isAuthenticated, navigate])

  // Redirect if onboarding is complete
  useEffect(() => {
    if (state?.isComplete) {
      navigate('/home')
    }
  }, [state?.isComplete, navigate])

  const currentStepIndex = steps.findIndex(step => step.key === state?.currentStep)
  const progress = state?.currentStep === 'welcome' ? 0 : 
    currentStepIndex >= 0 ? ((currentStepIndex + 1) / (steps.length + 1)) * 100 : 0

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language || 'en'
    }
  })

  const familyForm = useForm<FamilyFormData>({
    resolver: zodResolver(familySchema),
    defaultValues: {
      familyName: '',
      description: ''
    }
  })

  const preferencesForm = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      emailNotifications: true,
      weeklyDigest: true,
      simpleMode: false
    }
  })

  const handleNext = async (nextStep: OnboardingStep, data?: any) => {
    setIsProcessing(true)
    try {
      const success = await actions.updateStep(nextStep, data)
      if (!success) {
        toast({
          title: 'Error',
          description: 'Failed to save progress. Please try again.',
          variant: 'destructive'
        })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBack = async () => {
    if (currentStepIndex > 0) {
      const prevStep = steps[currentStepIndex - 1].key
      await handleNext(prevStep)
    }
  }

  const handleComplete = async () => {
    setIsProcessing(true)
    try {
      const success = await actions.completeOnboarding()
      if (success) {
        navigate('/home')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Unable to load onboarding</CardTitle>
            <CardDescription>Please try refreshing the page</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderStep = () => {
    switch (state.currentStep) {
      case 'welcome':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Welcome to LifeScribe</CardTitle>
              <CardDescription className="text-lg">
                Let's set up your account and get you started with preserving your family stories.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  return (
                    <div key={step.key} className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-medium">{step.title}</h3>
                      <p className="text-sm text-muted-foreground text-center">{step.description}</p>
                    </div>
                  )
                })}
              </div>
              <Button 
                onClick={() => handleNext('profile_setup')} 
                className="w-full md:w-auto"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )

      case 'profile_setup':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Tell us about yourself</CardTitle>
              <CardDescription>
                This information helps us personalize your experience.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form 
                  onSubmit={profileForm.handleSubmit((data) => handleNext('family_setup', data))}
                  className="space-y-4"
                >
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={isProcessing}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button type="submit" disabled={isProcessing} className="flex-1">
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )

      case 'family_setup':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Create your family space</CardTitle>
              <CardDescription>
                {state.hasFamily 
                  ? "You're already part of a family. You can skip this step or create an additional family space."
                  : "Create a space where your family can share stories and memories together."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {state.familyInfo && (
                <div className="mb-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium">Current Family</h4>
                  <p className="text-sm text-muted-foreground">{state.familyInfo.name}</p>
                  <Badge variant="secondary" className="mt-1">{state.familyInfo.role}</Badge>
                </div>
              )}
              
              <Form {...familyForm}>
                <form 
                  onSubmit={familyForm.handleSubmit((data) => handleNext('preferences', data))}
                  className="space-y-4"
                >
                  <FormField
                    control={familyForm.control}
                    name="familyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Family Name</FormLabel>
                        <FormControl>
                          <Input placeholder="The Smith Family" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={familyForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Tell us about your family..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={isProcessing}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    {state.hasFamily && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleNext('preferences')}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        Skip
                      </Button>
                    )}
                    <Button type="submit" disabled={isProcessing} className="flex-1">
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Continue
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )

      case 'preferences':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Customize your experience</CardTitle>
              <CardDescription>
                Choose how you'd like to use LifeScribe. You can change these settings later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...preferencesForm}>
                <form 
                  onSubmit={preferencesForm.handleSubmit((data) => handleComplete())}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <FormField
                      control={preferencesForm.control}
                      name="emailNotifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Email Notifications</FormLabel>
                            <FormControl>
                              <p className="text-sm text-muted-foreground">
                                Get notified about new stories and family updates
                              </p>
                            </FormControl>
                          </div>
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={preferencesForm.control}
                      name="weeklyDigest"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Weekly Digest</FormLabel>
                            <FormControl>
                              <p className="text-sm text-muted-foreground">
                                Receive a weekly summary of family activity
                              </p>
                            </FormControl>
                          </div>
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={isProcessing}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button type="submit" disabled={isProcessing} className="flex-1">
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        <>
                          Complete Setup
                          <CheckCircle className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Setup Progress
          </h2>
          <span className="text-sm text-muted-foreground">
            {state?.currentStep === 'welcome' ? '1' : currentStepIndex + 2} of {steps.length + 1}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {renderStep()}
    </div>
  )
}