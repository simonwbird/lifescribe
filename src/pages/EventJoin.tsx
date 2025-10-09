import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, UserPlus, Calendar, Users } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function EventJoin() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { track } = useAnalytics()
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [eventInfo, setEventInfo] = useState<{
    eventId: string
    familyId: string
    familyName?: string
  } | null>(null)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestRole, setGuestRole] = useState<'contributor' | 'viewer' | 'guest'>('guest')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (code) {
      validateJoinCode()
    }
  }, [code])

  const validateJoinCode = async () => {
    if (!code) return

    try {
      setLoading(true)
      const { data: result, error: validationError } = await supabase
        .rpc('use_event_join_code', { p_code: code.toUpperCase() })

      if (validationError) throw validationError

      const validationResult = result as any
      if (!validationResult.success) {
        setError(validationResult.error)
        return
      }

      const { data: familyData } = await supabase
        .from('families')
        .select('name')
        .eq('id', validationResult.family_id)
        .single()

      setEventInfo({
        eventId: validationResult.event_id,
        familyId: validationResult.family_id,
        familyName: familyData?.name
      })

      track('event_join_code_validated', { code: code.toUpperCase() })
    } catch (err) {
      console.error('Error validating join code:', err)
      setError('Failed to validate join code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestJoin = async () => {
    if (!eventInfo || !code) return
    if (!guestName.trim()) {
      toast.error('Please enter your name')
      return
    }

    setValidating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const guestSessionId = uuidv4()

      if (!user) {
        await supabase.from('guest_sessions').insert({
          id: guestSessionId,
          event_id: eventInfo.eventId,
          family_id: eventInfo.familyId,
          guest_name: guestName,
          guest_email: guestEmail || null,
          created_via_code: code.toUpperCase()
        })
      }

      await supabase.from('event_acl').insert({
        event_id: eventInfo.eventId,
        user_id: user?.id,
        guest_session_id: user ? null : guestSessionId,
        role: guestRole,
        family_id: eventInfo.familyId,
        granted_by: user?.id || guestSessionId
      })

      if (!user) {
        localStorage.setItem('guest_session', JSON.stringify({
          id: guestSessionId,
          event_id: eventInfo.eventId,
          guest_name: guestName,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }))
      }

      track('event_guest_joined', { role: guestRole, authenticated: !!user })
      toast.success('Successfully joined event!')
      navigate('/events')
    } catch (err) {
      console.error('Error joining event:', err)
      toast.error('Failed to join event.')
    } finally {
      setValidating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !eventInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Invalid Join Code</CardTitle>
            <CardDescription>{error || 'Invalid or expired code.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Join Family Event
          </CardTitle>
          <CardDescription>Contribute to a family event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {eventInfo.familyName && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">{eventInfo.familyName}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guest-name">Your Name *</Label>
              <Input id="guest-name" placeholder="Enter your name" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-email">Email (optional)</Label>
              <Input id="guest-email" type="email" placeholder="your@email.com" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Access Level</Label>
              <Select value={guestRole} onValueChange={(value: any) => setGuestRole(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="guest">Guest - View & contribute</SelectItem>
                  <SelectItem value="contributor">Contributor - Full access</SelectItem>
                  <SelectItem value="viewer">Viewer - View only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGuestJoin} disabled={validating || !guestName.trim()} className="w-full">
            {validating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Joining...</> : <><UserPlus className="h-4 w-4 mr-2" />Join Event</>}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
