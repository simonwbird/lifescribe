import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { trackRequestApproved, trackRequestDenied } from '@/lib/eventTrackingService'
import { toast } from 'sonner'
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  MessageSquare,
  UserCheck,
  Calendar
} from 'lucide-react'

interface AccessRequest {
  id: string
  requester_id: string
  family_id: string
  requested_role: string
  message?: string
  status: string
  created_at: string
  reviewed_by?: string
  reviewed_at?: string
  review_reason?: string
  expires_at?: string
  profiles: {
    full_name: string
    email: string
  }
  families: {
    name: string
  }
}

interface AccessRequestsManagerProps {
  familyId?: string
}

export function AccessRequestsManager({ familyId }: AccessRequestsManagerProps) {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('pending')
  const [reviewingRequest, setReviewingRequest] = useState<AccessRequest | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'deny' | null>(null)
  const [denyReason, setDenyReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [familyId])

  const loadRequests = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('access_requests')
        .select(`
          *,
          profiles:requester_id (
            full_name,
            email
          ),
          families:family_id (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (familyId) {
        query = query.eq('family_id', familyId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setRequests((data as any) || [])
    } catch (error: any) {
      console.error('Error loading access requests:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReviewRequest = async () => {
    if (!reviewingRequest || !reviewAction) return

    setIsSubmitting(true)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        toast.error('Please sign in to review requests')
        return
      }

      const endpoint = reviewAction === 'approve' ? 'approve' : 'deny'
      const payload = reviewAction === 'deny' ? { reason: denyReason } : { approvedRole: 'member' }

      const response = await supabase.functions.invoke('family-requests', {
        body: payload,
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      })

      if (response.error) throw response.error

      const result = response.data
      if (result.error) throw new Error(result.error)

      toast.success(`Request ${reviewAction}d successfully`)
      handleCloseReview()
      loadRequests()

    } catch (error: any) {
      console.error(`Error ${reviewAction}ing request:`, error)
      toast.error(error.message || `Failed to ${reviewAction} request`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseReview = () => {
    setReviewingRequest(null)
    setReviewAction(null)
    setDenyReason('')
  }

  const openReviewModal = (request: AccessRequest, action: 'approve' | 'deny') => {
    setReviewingRequest(request)
    setReviewAction(action)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'denied':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="h-3 w-3 mr-1" />Denied</Badge>
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

  const filterRequests = (status: string) => {
    return requests.filter(request => {
      if (status === 'all') return true
      return request.status === status
    })
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const approvedCount = requests.filter(r => r.status === 'approved').length
  const deniedCount = requests.filter(r => r.status === 'denied').length

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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Access Requests
          </CardTitle>
          <CardDescription>
            Manage requests to join your family space
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="pending" className="flex items-center gap-2">
                  Pending {pendingCount > 0 && <Badge variant="secondary">{pendingCount}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved {approvedCount > 0 && <Badge variant="secondary">{approvedCount}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="denied">
                  Denied {deniedCount > 0 && <Badge variant="secondary">{deniedCount}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              {['pending', 'approved', 'denied', 'all'].map(status => (
                <TabsContent key={status} value={status} className="space-y-4">
                  {filterRequests(status).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No {status === 'all' ? '' : status} requests found</p>
                    </div>
                  ) : (
                    filterRequests(status).map((request) => (
                      <Card key={request.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium">{request.profiles.full_name}</h4>
                                {getStatusBadge(request.status)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {request.profiles.email}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(request.created_at)}
                                </span>
                                {!familyId && (
                                  <span>Family: {request.families.name}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {request.message && (
                            <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <MessageSquare className="h-3 w-3" />
                                <span className="text-xs font-medium">Message</span>
                              </div>
                              <p className="text-sm">{request.message}</p>
                            </div>
                          )}

                          {request.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => openReviewModal(request, 'approve')}
                                className="flex-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openReviewModal(request, 'deny')}
                                className="flex-1"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Deny
                              </Button>
                            </div>
                          )}

                          {request.status !== 'pending' && request.reviewed_at && (
                            <div className="text-xs text-muted-foreground">
                              Reviewed {formatDate(request.reviewed_at)}
                              {request.review_reason && (
                                <div className="mt-1 p-2 bg-muted/30 rounded text-xs">
                                  Reason: {request.review_reason}
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!reviewingRequest} onOpenChange={() => handleCloseReview()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Deny'} Access Request
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve' 
                ? `Approve ${reviewingRequest?.profiles.full_name}'s request to join your family?`
                : `Deny ${reviewingRequest?.profiles.full_name}'s request to join your family?`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reviewingRequest?.message && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium">Their message:</Label>
                <p className="text-sm mt-1">{reviewingRequest.message}</p>
              </div>
            )}

            {reviewAction === 'deny' && (
              <div className="space-y-2">
                <Label htmlFor="deny-reason">Reason for denial (optional)</Label>
                <Textarea
                  id="deny-reason"
                  placeholder="Let them know why their request was denied..."
                  value={denyReason}
                  onChange={(e) => setDenyReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCloseReview} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleReviewRequest} 
                disabled={isSubmitting}
                className="flex-1"
                variant={reviewAction === 'approve' ? 'default' : 'destructive'}
              >
                {isSubmitting ? 'Processing...' : (reviewAction === 'approve' ? 'Approve' : 'Deny')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}