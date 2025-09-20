import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { Clock, Users, AlertTriangle, CheckCircle, XCircle, Calendar } from 'lucide-react'

interface PendingRequest {
  id: string
  family_id: string
  requested_role: string
  message?: string
  status: string
  created_at: string
  reviewed_at?: string
  review_reason?: string
  families: {
    name: string
  }
}

export function PendingAccessRequests() {
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUserRequests()
  }, [])

  const loadUserRequests = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error: fetchError } = await supabase
        .from('access_requests')
        .select(`
          *,
          families:family_id (
            name
          )
        `)
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setRequests((data as any) || [])
    } catch (error: any) {
      console.error('Error loading user requests:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case 'denied':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            Denied
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const recentRequests = requests.slice(0, 5) // Show last 5 requests

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Access Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return null // Don't show card if no requests
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Family Access Requests
          {pendingRequests.length > 0 && (
            <Badge variant="secondary">{pendingRequests.length} pending</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Your requests to join family spaces
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {pendingRequests.length > 0 && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  You have {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}. 
                  Family admins will be notified to review your request.
                </AlertDescription>
              </Alert>
            )}

            {recentRequests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-muted">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{request.families.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(request.status)}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(request.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {request.message && request.status === 'pending' && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                      <strong>Your message:</strong> {request.message}
                    </div>
                  )}

                  {request.status === 'denied' && request.review_reason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      <strong>Reason:</strong> {request.review_reason}
                    </div>
                  )}

                  {request.status === 'approved' && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                      Welcome to the family! You can now access their space.
                    </div>
                  )}

                  {request.reviewed_at && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Reviewed {formatDate(request.reviewed_at)}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {requests.length > 5 && (
              <div className="text-center">
                <Button variant="outline" size="sm" onClick={loadUserRequests}>
                  View All Requests
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}