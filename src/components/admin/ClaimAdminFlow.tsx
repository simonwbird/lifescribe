import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertTriangle, Users, Mail, Clock, Shield, CheckCircle, Info } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useEventTracking } from '@/hooks/useEventTracking'

interface ClaimAdminFlowProps {
  familyId: string
  familyName: string
  onClaimCreated?: (claimId: string) => void
}

export function ClaimAdminFlow({ familyId, familyName, onClaimCreated }: ClaimAdminFlowProps) {
  const [claimType, setClaimType] = useState<'endorsement' | 'email_challenge'>('endorsement')
  const [originalOwnerEmail, setOriginalOwnerEmail] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOrphaned, setIsOrphaned] = useState<boolean | null>(null)
  const [currentClaim, setCurrentClaim] = useState<any>(null)
  const { trackAdminClaimStarted } = useEventTracking()

  useEffect(() => {
    checkFamilyStatus()
    checkExistingClaim()
  }, [familyId])

  const checkFamilyStatus = async () => {
    try {
      const { data, error } = await supabase
        .rpc('is_family_orphaned', { p_family_id: familyId })

      if (error) throw error
      setIsOrphaned(data)
    } catch (error) {
      console.error('Error checking family status:', error)
    }
  }

  const checkExistingClaim = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data, error } = await supabase
        .from('admin_claims')
        .select('*')
        .eq('family_id', familyId)
        .eq('claimant_id', user.user.id)
        .in('status', ['pending', 'approved'])
        .single()

      if (!error && data) {
        setCurrentClaim(data)
      }
    } catch (error) {
      console.error('Error checking existing claim:', error)
    }
  }

  const handleSubmitClaim = async () => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for claiming admin rights",
        variant: "destructive"
      })
      return
    }

    if (claimType === 'email_challenge' && !originalOwnerEmail.trim()) {
      toast({
        title: "Error", 
        description: "Please provide the original owner's email address",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('families-claim-admin/claim', {
        body: {
          family_id: familyId,
          claim_type: claimType,
          original_owner_email: claimType === 'email_challenge' ? originalOwnerEmail : undefined,
          reason
        }
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: "Claim Submitted",
          description: data.message,
        })

        // Track the event
        await trackAdminClaimStarted({
          family_id: familyId,
          claim_type: claimType,
          claimant_id: user.user.id,
          reason
        })

        setCurrentClaim({
          id: data.claim_id,
          status: 'pending',
          claim_type: claimType,
          expires_at: data.expires_at
        })

        onClaimCreated?.(data.claim_id)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error submitting claim:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit admin claim",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // If family is not orphaned, show info message
  if (isOrphaned === false) {
    return (
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Family Has Active Administrators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This family already has active administrators. Admin claims are only available for orphaned families.
          </p>
        </CardContent>
      </Card>
    )
  }

  // If user already has a claim
  if (currentClaim) {
    return (
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Existing Admin Claim
          </CardTitle>
          <CardDescription>You have an active admin claim for this family</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <Badge variant={currentClaim.status === 'approved' ? 'default' : 'outline'}>
              {currentClaim.status}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-medium">Type:</span>
            <span className="text-sm">{currentClaim.claim_type.replace('_', ' ')}</span>
          </div>

          {currentClaim.status === 'approved' && currentClaim.cooling_off_until && (
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm text-green-700 font-medium">Claim Approved!</p>
              <p className="text-sm text-green-600">
                Admin rights will be granted after the cooling-off period ends on{' '}
                {new Date(currentClaim.cooling_off_until).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Expires: {new Date(currentClaim.expires_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Explanation Card */}
      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Orphaned Family Detected
          </CardTitle>
          <CardDescription>
            This family currently has no active administrators. You can claim admin rights to restore family management.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-md">
            <h4 className="font-semibold text-amber-800 mb-2">How Admin Claims Work</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• <strong>Endorsement Method:</strong> Get support from 2+ family members</li>
              <li>• <strong>Email Challenge:</strong> Verify with original family owner's email</li>
              <li>• <strong>7-Day Cooling-off:</strong> Rights granted after review period</li>
              <li>• <strong>Audit Trail:</strong> All actions are logged for security</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Claim Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Claim Admin Rights
          </CardTitle>
          <CardDescription>
            Submit a request to become an administrator of "{familyName}"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Claim Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Verification Method</Label>
            <RadioGroup 
              value={claimType} 
              onValueChange={(value) => setClaimType(value as 'endorsement' | 'email_challenge')}
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="endorsement" id="endorsement" />
                <div className="flex-1">
                  <Label htmlFor="endorsement" className="font-medium cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Family Member Endorsement
                    </div>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get support from 2+ active family members
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="email_challenge" id="email_challenge" />
                <div className="flex-1">
                  <Label htmlFor="email_challenge" className="font-medium cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Challenge
                    </div>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Verify with original family owner's email
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Email Field for Email Challenge */}
          {claimType === 'email_challenge' && (
            <div className="space-y-2">
              <Label htmlFor="owner-email">Original Owner's Email</Label>
              <Input
                id="owner-email"
                type="email"
                placeholder="owner@example.com"
                value={originalOwnerEmail}
                onChange={(e) => setOriginalOwnerEmail(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                A verification email will be sent to this address
              </p>
            </div>
          )}

          {/* Reason Field */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Claim</Label>
            <Textarea
              id="reason"
              placeholder="Explain why you should be granted admin rights..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-semibold text-blue-800 mb-2">Security & Privacy</h4>
            <p className="text-sm text-blue-700">
              All admin claims are subject to a 7-day cooling-off period and are logged for audit purposes. 
              False claims may result in account restrictions.
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmitClaim}
            disabled={loading || !reason.trim()}
            className="w-full"
          >
            {loading ? 'Submitting...' : 'Submit Admin Claim'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}