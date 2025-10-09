import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { weeklyDigestService } from '@/lib/weeklyDigestService'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function DigestPause() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { track } = useAnalytics()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const pauseDigest = async () => {
      const familyId = searchParams.get('family')
      const userId = searchParams.get('user')

      if (!familyId || !userId) {
        setStatus('error')
        setMessage('Invalid pause link')
        return
      }

      try {
        await weeklyDigestService.pauseDigestFor30Days(userId, familyId)
        track({ event_name: 'digest_paused', properties: { family_id: familyId, duration_days: 30 } })
        setStatus('success')
        setMessage('Your weekly digest has been paused for 30 days')
      } catch (error) {
        console.error('Error pausing digest:', error)
        track({ event_name: 'digest_pause_failed', properties: { family_id: familyId, error: String(error) } })
        setStatus('error')
        setMessage('Failed to pause digest. Please try again.')
      }
    }

    pauseDigest()
  }, [searchParams, track])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle className="h-12 w-12 text-green-600" />}
            {status === 'error' && <XCircle className="h-12 w-12 text-destructive" />}
          </div>
          <CardTitle>
            {status === 'loading' && 'Pausing Weekly Digest...'}
            {status === 'success' && 'Digest Paused'}
            {status === 'error' && 'Pause Failed'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'success' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You won't receive weekly digest emails for the next 30 days. 
                You can resume anytime from your settings.
              </p>
              <Button onClick={() => navigate('/settings')} className="w-full">
                Go to Settings
              </Button>
            </div>
          )}
          {status === 'error' && (
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              Return Home
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}