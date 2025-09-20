import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { trackRequestSubmitted } from '@/lib/eventTrackingService'
import { toast } from 'sonner'
import { Send, Users, CheckCircle, AlertTriangle, Clock } from 'lucide-react'

interface RequestAccessModalProps {
  isOpen: boolean
  onClose: () => void
  familyName?: string
}

export function RequestAccessModal({ isOpen, onClose, familyName }: RequestAccessModalProps) {
  const [step, setStep] = useState<'form' | 'submitted' | 'error'>('form')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchedFamily, setSearchedFamily] = useState('')
  const [knownMember, setKnownMember] = useState('')
  const [relationship, setRelationship] = useState('')
  const [message, setMessage] = useState('')
  const [submittedFamilyName, setSubmittedFamilyName] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!searchedFamily.trim()) {
      setError('Please enter a family name')
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

      // For now, create a generic request since we don't have family search yet
      // In a full implementation, this would search for and match actual families
      const requestData = {
        familyId: 'pending-match', // Placeholder until we implement family search
        message: message.trim() || undefined,
        relationship: relationship.trim() || undefined,
        knownMember: knownMember.trim() || undefined
      }

      // Create analytics event for now - in full implementation would call the family-requests endpoint
      await supabase.from('analytics_events').insert({
        event_name: 'REQUEST_SUBMITTED',
        user_id: sessionData.session.user.id,
        family_id: null,
        properties: {
          request_id: crypto.randomUUID(),
          family_name: searchedFamily.trim(),
          requested_role: 'member',
          has_message: !!message.trim(),
          has_relationship: !!relationship.trim(),
          has_known_member: !!knownMember.trim(),
          request_type: 'family_search'
        }
      })

      // Track the event
      await trackRequestSubmitted({
        request_id: crypto.randomUUID(),
        family_id: 'unknown',
        requested_role: 'member',
        has_message: !!message.trim()
      })

      setSubmittedFamilyName(searchedFamily)
      setStep('submitted')
      toast.success('Access request submitted successfully!')

    } catch (error: any) {
      console.error('Error submitting access request:', error)
      setError(error.message || 'Failed to submit request. Please try again.')
      setStep('error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep('form')
    setError(null)
    setSearchedFamily('')
    setKnownMember('')
    setRelationship('')
    setMessage('')
    setSubmittedFamilyName('')
    onClose()
  }

  const getStepIcon = () => {
    switch (step) {
      case 'submitted':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'error':
        return <AlertTriangle className="h-6 w-6 text-red-600" />
      default:
        return <Users className="h-6 w-6 text-primary" />
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 'submitted':
        return 'Request Submitted!'
      case 'error':
        return 'Request Failed'
      default:
        return 'Request Family Access'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            {getStepIcon()}
          </div>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>
            {step === 'form' && "Can't find your family's invite code? Let us help you connect with them."}
            {step === 'submitted' && `We've received your request to join "${submittedFamilyName}".`}
            {step === 'error' && "There was a problem submitting your request."}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="family-search">Family Name or Last Name *</Label>
              <Input
                id="family-search"
                placeholder="e.g., The Johnson Family, Smith, etc."
                value={searchedFamily}
                onChange={(e) => setSearchedFamily(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Help us identify which family you're trying to join
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="known-member">Who do you know in this family?</Label>
              <Input
                id="known-member"
                placeholder="e.g., Sarah Johnson, Grandma Mary, etc."
                value={knownMember}
                onChange={(e) => setKnownMember(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This helps us verify your connection
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Your relationship (Optional)</Label>
              <Input
                id="relationship"
                placeholder="e.g., daughter, grandson, cousin, etc."
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Additional Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell us more about your connection to this family..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {step === 'submitted' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-green-900">What happens next?</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• We'll try to match you with the right family</li>
                <li>• If we find them, they'll receive your request</li>
                <li>• You'll be notified once they respond</li>
                <li>• If we can't find them, we'll help you get in touch</li>
              </ul>
            </div>
            
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                This usually takes 1-2 business days. We'll email you with updates.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Close
              </Button>
              <Button onClick={() => navigate('/onboarding')} className="flex-1">
                Create Your Own
              </Button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error || 'An unexpected error occurred. Please try again.'}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('form')} className="flex-1">
                Try Again
              </Button>
              <Button onClick={handleClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}