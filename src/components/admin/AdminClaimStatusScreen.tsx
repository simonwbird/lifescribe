import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, CheckCircle, AlertTriangle, Mail, Users, Shield, Calendar, X } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface AdminClaim {
  id: string
  family_id: string
  claim_type: string
  status: string
  endorsements_required: number
  endorsements_received: number
  cooling_off_until?: string
  claimed_at?: string
  expires_at: string
  created_at: string
  metadata?: any
}

interface AdminClaimStatusScreenProps {
  familyId: string
  familyName: string
}

export function AdminClaimStatusScreen({ familyId, familyName }: AdminClaimStatusScreenProps) {
  const [claim, setClaim] = useState<AdminClaim | null>(null)
  const [loading, setLoading] = useState(true)
  const [grantingRights, setGrantingRights] = useState(false)

  useEffect(() => {
    loadUserClaim()
    
    // Set up real-time subscription for claim updates
    const subscription = supabase
      .channel(`claim-${familyId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'admin_claims', filter: `family_id=eq.${familyId}` },
        () => {
          loadUserClaim()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [familyId])

  const loadUserClaim = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data, error } = await supabase
        .from('admin_claims')
        .select(`
          id,
          family_id,
          claimant_id,
          claim_type,
          status,
          endorsements_required,
          endorsements_received,
          cooling_off_until,
          claimed_at,
          expires_at,
          created_at,
          metadata
        `)
        .eq('family_id', familyId)
        .eq('claimant_id', user.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // Not "no rows returned"
        throw error
      }

      setClaim(data || null)
    } catch (error) {
      console.error('Error loading claim:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGrantRights = async () => {
    if (!claim) return

    setGrantingRights(true)

    try {
      const { data, error } = await supabase.functions.invoke('families-claim-admin/process', {
        body: {
          claim_id: claim.id,
          action: 'grant_admin'
        }
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: "Admin Rights Granted!",
          description: "You are now an administrator of this family.",
        })
        
        // Reload claim to show completed status
        await loadUserClaim()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error granting rights:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to grant admin rights",
        variant: "destructive"
      })
    } finally {
      setGrantingRights(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-600" />
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'denied':
        return <X className="h-5 w-5 text-red-600" />
      case 'completed':
        return <Shield className="h-5 w-5 text-blue-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'outline'
      case 'approved':
        return 'default'
      case 'denied':
        return 'destructive'
      case 'completed':
        return 'default'
      default:
        return 'secondary'
    }
  }

    switch (claim.status) {
      case 'pending':
        if (claim.claim_type === 'endorsement') {
          return `Waiting for endorsements (${claim.endorsements_received}/${claim.endorsements_required} received)`
        } else {
          return 'Waiting for email verification'
        }
      case 'approved':
        if (claim.cooling_off_until && new Date(claim.cooling_off_until) > new Date()) {
          return 'Approved - cooling-off period in progress'
        } else {
          return 'Approved - ready to grant admin rights'
        }
      case 'denied':
        return 'Claim was denied'
      case 'completed':
        return 'Admin rights granted'
      case 'expired':
        return 'Claim expired'
      default:
        return 'Status unknown'
    }

  const getStatusMessage = (claim: AdminClaim) => {
    switch (claim.status) {
      case 'pending':
        if (claim.claim_type === 'endorsement') {
          return `Waiting for endorsements (${claim.endorsements_received}/${claim.endorsements_required} received)`
        } else {
          return 'Waiting for email verification'
        }
      case 'approved':
        if (claim.cooling_off_until && new Date(claim.cooling_off_until) > new Date()) {
          return 'Approved - cooling-off period in progress'
        } else {
          return 'Approved - ready to grant admin rights'
        }
      case 'denied':
        return 'Claim was denied'
      case 'completed':
        return 'Admin rights granted'
      case 'expired':
        return 'Claim expired'
      default:
        return 'Status unknown'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!claim) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No admin claim found for this family</p>
        </CardContent>
      </Card>
    )
  }

  const canGrantRights = claim.status === 'approved' && 
    claim.cooling_off_until && 
    new Date(claim.cooling_off_until) <= new Date()

  const daysRemaining = Math.ceil((new Date(claim.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const coolingOffDays = claim.cooling_off_until ? 
    Math.ceil((new Date(claim.cooling_off_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(claim.status)}
              Admin Claim Status
            </CardTitle>
            <Badge variant={getStatusVariant(claim.status)}>
              {claim.status}
            </Badge>
          </div>
          <CardDescription>
            Claim for "{familyName}" • Submitted {new Date(claim.created_at).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Message */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium">{getStatusMessage(claim)}</p>
          </div>

          {/* Claim Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Verification Method</p>
              <div className="flex items-center gap-2 mt-1">
                {claim.claim_type === 'endorsement' ? (
                  <><Users className="h-4 w-4" /> Family Endorsement</>
                ) : (
                  <><Mail className="h-4 w-4" /> Email Challenge</>
                )}
              </div>
            </div>
            
            <div>
              <p className="font-medium">Expires</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                {new Date(claim.expires_at).toLocaleDateString()}
                {daysRemaining > 0 && (
                  <span className="text-muted-foreground">({daysRemaining} days)</span>
                )}
              </div>
            </div>
          </div>

          {/* Claim Details */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="font-medium">Admin claim submitted for family management rights</p>
          </div>

          {/* Endorsement Progress (for endorsement claims) */}
          {claim.claim_type === 'endorsement' && claim.status === 'pending' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Endorsement Progress</span>
                <span>{claim.endorsements_received} / {claim.endorsements_required}</span>
              </div>
              <Progress 
                value={(claim.endorsements_received / claim.endorsements_required) * 100}
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                Family members can endorse your claim in the family settings
              </p>
            </div>
          )}

          {/* Email Challenge Info */}
          {claim.claim_type === 'email_challenge' && claim.status === 'pending' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Email Verification Required</span>
              </div>
              <p className="text-sm text-blue-700">
                A verification email has been sent to the original owner's email address.
                {claim.metadata?.email_sent_to && (
                  <> Sent to: {claim.metadata.email_sent_to}</>
                )}
              </p>
            </div>
          )}

          {/* Cooling-off Period */}
          {claim.status === 'approved' && claim.cooling_off_until && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Claim Approved!</span>
              </div>
              {coolingOffDays > 0 ? (
                <p className="text-sm text-green-700">
                  Admin rights will be available in {coolingOffDays} days 
                  ({new Date(claim.cooling_off_until).toLocaleDateString()})
                </p>
              ) : (
                <p className="text-sm text-green-700">
                  Cooling-off period has ended. You can now claim your admin rights.
                </p>
              )}
            </div>
          )}

          {/* Grant Rights Button */}
          {canGrantRights && (
            <Button 
              onClick={handleGrantRights}
              disabled={grantingRights}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {grantingRights ? 'Granting Rights...' : 'Claim Admin Rights Now'}
            </Button>
          )}

          {/* Completed Status */}
          {claim.status === 'completed' && claim.claimed_at && (
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-blue-800">Admin Rights Granted</p>
              <p className="text-sm text-blue-700">
                Granted on {new Date(claim.claimed_at).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Denied Status */}
          {claim.status === 'denied' && (
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <X className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="font-medium text-red-800">Claim Denied</p>
              <p className="text-sm text-red-700">
                Your admin claim was not approved. You may submit a new claim if circumstances change.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}