import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowRight, Users, Clock, Shield, Globe } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/use-toast'
import { useEventTracking } from '@/hooks/useEventTracking'

interface PreflightResponse {
  risk: 'none' | 'possible' | 'high'
  timestamp: string
}

interface CreateFamilyFormProps {
  onClose: () => void
}

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago', 
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney'
]

const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' }
]

export default function CreateFamilyForm({ onClose }: CreateFamilyFormProps) {
  const [step, setStep] = useState<'form' | 'preflight' | 'speedbump'>('form')
  const [loading, setLoading] = useState(false)
  const [startTime] = useState(Date.now())
  
  // Form data
  const [displayName, setDisplayName] = useState('')
  const [locale, setLocale] = useState('en')
  const [timezone, setTimezone] = useState('America/New_York')
  const [city, setCity] = useState('')
  const [region, setRegion] = useState('')
  const [inviteeEmails, setInviteeEmails] = useState('')
  
  // Preflight state
  const [preflightResult, setPreflightResult] = useState<PreflightResponse | null>(null)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const navigate = useNavigate()
  const { toast } = useToast()
  const { 
    trackPreflightNone, 
    trackPreflightPossibleShown, 
    trackCreateAbandoned, 
    trackCreateCompleted 
  } = useEventTracking()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
    })

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handlePreflight = async () => {
    if (!displayName.trim()) return
    
    setLoading(true)
    setError('')

    try {
      const emailList = inviteeEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email && email.includes('@'))

      const response = await supabase.functions.invoke('families-preflight', {
        body: {
          displayName: displayName.trim(),
          city: city.trim() || undefined,
          region: region.trim() || undefined,
          inviteeEmails: emailList.length > 0 ? emailList : undefined
        }
      })

      if (response.error) {
        throw new Error(response.error.message)
      }

      const result = response.data as PreflightResponse
      setPreflightResult(result)

      if (result.risk === 'none') {
        await trackPreflightNone({
          family_name: displayName,
          check_signals: [
            'name',
            ...(city ? ['city'] : []),
            ...(region ? ['region'] : []),
            ...(emailList.length > 0 ? ['emails'] : [])
          ],
          response_time_ms: Date.now() - startTime
        })
        
        // Proceed directly to creation
        await handleCreateFamily()
      } else {
        await trackPreflightPossibleShown({
          family_name: displayName,
          risk_level: result.risk,
          match_signals: ['name'], // We don't expose which signals matched for privacy
          user_action: 'continue' // Will be updated based on actual user action
        })
        
        setStep('speedbump')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to check for existing families')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFamily = async () => {
    if (!isAuthenticated) {
      setError('Please sign in to create a family')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      // Create or update profile first
      await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name || '',
          updated_at: new Date().toISOString(),
        })

      // Create family with provisional status
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: displayName.trim(),
          created_by: session.user.id,
          status: 'provisional',
          locale,
          timezone
        })
        .select()
        .single()

      if (familyError) throw familyError

      // Add user as admin member
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          family_id: family.id,
          profile_id: session.user.id,
          role: 'admin',
        })

      if (memberError) throw memberError

      // Track successful creation
      await trackCreateCompleted({
        family_id: family.id,
        family_name: displayName,
        status: 'provisional',
        locale,
        timezone,
        preflight_risk: preflightResult?.risk,
        time_to_complete_minutes: Math.round((Date.now() - startTime) / 60000)
      })

      toast({
        title: "Family created!",
        description: `${displayName} is ready for memories. Share your invite to add more members!`,
      })

      onClose()
      navigate('/home')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAbandon = async (stage: 'preflight' | 'form' | 'submission') => {
    await trackCreateAbandoned({
      family_name: displayName || 'unnamed',
      abandon_stage: stage,
      time_spent_seconds: Math.round((Date.now() - startTime) / 1000),
      reason: stage === 'preflight' ? 'duplicate_risk' : undefined
    })
    onClose()
  }

  if (step === 'speedbump' && preflightResult) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <CardTitle className="text-center">Similar Family Found</CardTitle>
          <CardDescription className="text-center">
            We found a family that might be similar to "{displayName}". To avoid duplicates:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                handleAbandon('preflight')
                // Should navigate to join flow
                navigate('/?action=join')
              }}
              className="justify-start"
            >
              <Users className="w-4 h-4 mr-2" />
              Join with invite code or link
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                handleAbandon('preflight') 
                // Should navigate to request access
                navigate('/request-access')
              }}
              className="justify-start"
            >
              <Shield className="w-4 h-4 mr-2" />
              Request access to existing family
            </Button>
          </div>
          
          <div className="border-t pt-4">
            <Button 
              onClick={handleCreateFamily}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating...' : 'Continue creating anyway'}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              This will create a separate family space
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-6 h-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-center">Create Your Family Space</CardTitle>
        <CardDescription className="text-center">
          Start preserving your family's memories and stories
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); handlePreflight() }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Family Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="The Johnson Family"
              className="text-center"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALES.map(loc => (
                    <SelectItem key={loc.value} value={loc.value}>
                      {loc.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TIMEZONES.map(tz => (
                    <SelectItem key={tz} value={tz}>
                      {tz.split('/')[1]?.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City (Optional)</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="New York"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">State/Region (Optional)</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="NY"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inviteeEmails">
              <Globe className="w-4 h-4 inline mr-1" />
              People to invite (Optional)
            </Label>
            <Input
              id="inviteeEmails"
              value={inviteeEmails}
              onChange={(e) => setInviteeEmails(e.target.value)}
              placeholder="john@example.com, mary@example.com"
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple emails with commas
            </p>
          </div>

          {!isAuthenticated && (
            <Alert>
              <AlertDescription>
                Please sign in to create a family.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={loading || !displayName.trim() || !isAuthenticated} 
              className="flex-1"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => handleAbandon('form')}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}