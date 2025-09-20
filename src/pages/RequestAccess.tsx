import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { trackRequestSubmitted } from '@/lib/eventTrackingService'
import { toast } from 'sonner'
import { ArrowLeft, Send, Users, CheckCircle } from 'lucide-react'

export default function RequestAccess() {
  const [familyName, setFamilyName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!familyName.trim() || !contactEmail.trim()) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        navigate('/login?redirect=request-access')
        return
      }

      // For now, we'll create a simple request record
      // In a full implementation, this would match against actual families
      const { data: request, error: requestError } = await supabase
        .from('analytics_events')
        .insert({
          event_name: 'ACCESS_REQUEST_SUBMITTED',
          user_id: sessionData.session.user.id,
          family_id: null,
          properties: {
            family_name: familyName.trim(),
            contact_email: contactEmail.trim(),
            message: message.trim(),
            request_type: 'family_access'
          }
        })

      if (requestError) {
        throw requestError
      }

      // Track the event
      await trackRequestSubmitted({
        request_id: crypto.randomUUID(),
        family_id: 'unknown', // We don't have a specific family ID yet
        requested_role: 'member',
        has_message: !!message.trim()
      })

      setIsSubmitted(true)
      toast.success('Access request submitted successfully!')

    } catch (error: any) {
      console.error('Error submitting access request:', error)
      setError(error.message || 'Failed to submit request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-paper flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Request Submitted!</CardTitle>
            <CardDescription>
              We've received your request to join "{familyName}"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium">What happens next?</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• We'll try to match you with the right family</li>
                <li>• If we find them, they'll receive your request</li>
                <li>• You'll be notified once they respond</li>
                <li>• If we can't find them, we'll help you get in touch</li>
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
                Back to Home
              </Button>
              <Button onClick={() => navigate('/onboarding')} className="flex-1">
                Create Your Own
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-paper flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Request Family Access</CardTitle>
            <CardDescription>
              Can't find your family's invite code? Let us help you connect with them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="family-name">Family Name or Last Name *</Label>
                <Input
                  id="family-name"
                  placeholder="e.g., The Johnson Family"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Help us identify which family you're trying to join
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-email">Your Contact Email *</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  We'll use this to update you on your request
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Additional Information (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us more about your connection to this family (e.g., 'I'm Sarah's daughter' or 'John is my grandfather')"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Still having trouble?{' '}
                <Link to="/onboarding" className="text-primary hover:underline">
                  Create your own family space
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}