import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ThumbsUp, ThumbsDown, Users, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useEventTracking } from '@/hooks/useEventTracking'

interface AdminClaim {
  id: string
  family_id: string
  claimant_id: string
  claim_type: string
  status: string
  endorsements_required: number
  endorsements_received: number
  expires_at: string
  created_at: string
  claimant_name?: string
}

interface Endorsement {
  id: string
  endorsement_type: string
  reason?: string
  created_at: string
}

interface FamilyMember {
  profile_id: string
  full_name: string
}

export function EndorsementPanel({ familyId }: { familyId: string }) {
  const [claims, setClaims] = useState<AdminClaim[]>([])
  const [endorsements, setEndorsements] = useState<Record<string, Endorsement>>({})
  const [loading, setLoading] = useState(true)
  const [endorsing, setEndorsing] = useState<string | null>(null)
  const [familyMembers, setFamilyMembers] = useState<Record<string, string>>({})
  const { trackAdminClaimEndorsed } = useEventTracking()

  useEffect(() => {
    loadClaims()
    loadFamilyMembers()
  }, [familyId])

  const loadFamilyMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          profile_id,
          profiles:profile_id (
            full_name
          )
        `)
        .eq('family_id', familyId)

      if (error) throw error

      const memberMap: Record<string, string> = {}
      data?.forEach((member: any) => {
        if (member.profiles) {
          memberMap[member.profile_id] = member.profiles.full_name || 'Unknown'
        }
      })
      setFamilyMembers(memberMap)
    } catch (error) {
      console.error('Error loading family members:', error)
    }
  }

  const loadClaims = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get pending claims for this family
      const { data: claimsData, error: claimsError } = await supabase
        .from('admin_claims')
        .select(`
          id,
          family_id,
          claimant_id,
          claim_type,
          status,
          endorsements_required,
          endorsements_received,
          expires_at,
          created_at
        `)
        .eq('family_id', familyId)
        .eq('status', 'pending')
        .eq('claim_type', 'endorsement') // Only endorsement-based claims
        .neq('claimant_id', user.user.id) // Don't show user's own claims

      if (claimsError) throw claimsError

      setClaims(claimsData || [])

      // Get user's endorsements for these claims
      if (claimsData && claimsData.length > 0) {
        const claimIds = claimsData.map(c => c.id)
        const { data: endorsementsData, error: endorsementsError } = await supabase
          .from('admin_claim_endorsements')
          .select('*')
          .in('claim_id', claimIds)
          .eq('endorser_id', user.user.id)

        if (endorsementsError) throw endorsementsError

        const endorsementMap: Record<string, Endorsement> = {}
        endorsementsData?.forEach(endorsement => {
          endorsementMap[endorsement.claim_id] = endorsement
        })
        setEndorsements(endorsementMap)
      }
    } catch (error) {
      console.error('Error loading claims:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEndorsement = async (claimId: string, endorsementType: 'support' | 'oppose', reason?: string) => {
    setEndorsing(claimId)

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('families-claim-admin/endorse', {
        body: {
          claim_id: claimId,
          endorsement_type: endorsementType,
          reason
        }
      })

      if (error) throw error

      if (data.success) {
        toast({
          title: "Endorsement Recorded",
          description: data.message,
        })

        // Track the event
        await trackAdminClaimEndorsed({
          claim_id: claimId,
          endorsement_type: endorsementType,
          endorser_id: user.user.id,
          reason
        })

        // Reload claims to get updated counts
        await loadClaims()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Error submitting endorsement:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit endorsement",
        variant: "destructive"
      })
    } finally {
      setEndorsing(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (claims.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No admin claims requiring endorsement</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Admin Claims Requiring Endorsement</h3>
        <p className="text-muted-foreground">Family members need your support to claim admin rights</p>
      </div>

      {claims.map(claim => {
        const existingEndorsement = endorsements[claim.id]
        const claimantName = familyMembers[claim.claimant_id] || 'Unknown Member'
        const progress = (claim.endorsements_received / claim.endorsements_required) * 100
        const daysRemaining = Math.ceil((new Date(claim.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

        return (
          <Card key={claim.id} className="border-amber-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Admin Claim by {claimantName}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {daysRemaining} days left
                  </Badge>
                  {existingEndorsement && (
                    <Badge 
                      variant={existingEndorsement.endorsement_type === 'support' ? 'default' : 'destructive'}
                      className="flex items-center gap-1"
                    >
                      {existingEndorsement.endorsement_type === 'support' ? (
                        <><ThumbsUp className="h-3 w-3" /> Supported</>
                      ) : (
                        <><ThumbsDown className="h-3 w-3" /> Opposed</>
                      )}
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription>
                Submitted {new Date(claim.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Claim Details</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Admin claim for family management rights
            </p>
          </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Endorsements Progress</span>
                  <span>{claim.endorsements_received} / {claim.endorsements_required}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
              </div>

              {existingEndorsement ? (
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    {existingEndorsement.endorsement_type === 'support' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium text-sm">
                      You {existingEndorsement.endorsement_type === 'support' ? 'supported' : 'opposed'} this claim
                    </span>
                  </div>
                  {existingEndorsement.reason && (
                    <p className="text-sm text-muted-foreground">"{existingEndorsement.reason}"</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(existingEndorsement.created_at).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <EndorsementForm
                  claimId={claim.id}
                  onSubmit={handleEndorsement}
                  loading={endorsing === claim.id}
                />
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

interface EndorsementFormProps {
  claimId: string
  onSubmit: (claimId: string, type: 'support' | 'oppose', reason?: string) => void
  loading: boolean
}

function EndorsementForm({ claimId, onSubmit, loading }: EndorsementFormProps) {
  const [endorsementType, setEndorsementType] = useState<'support' | 'oppose'>('support')
  const [reason, setReason] = useState('')

  const handleSubmit = () => {
    onSubmit(claimId, endorsementType, reason.trim() || undefined)
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <Label className="text-sm font-medium">Your Endorsement</Label>
      
      <RadioGroup value={endorsementType} onValueChange={(value) => setEndorsementType(value as any)}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="support" id="support" />
          <Label htmlFor="support" className="flex items-center gap-2 cursor-pointer">
            <ThumbsUp className="h-4 w-4 text-green-600" />
            Support this claim
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="oppose" id="oppose" />
          <Label htmlFor="oppose" className="flex items-center gap-2 cursor-pointer">
            <ThumbsDown className="h-4 w-4 text-red-600" />
            Oppose this claim
          </Label>
        </div>
      </RadioGroup>

      <div className="space-y-2">
        <Label htmlFor="endorsement-reason" className="text-sm">
          Reason (optional)
        </Label>
        <Textarea
          id="endorsement-reason"
          placeholder="Explain your decision..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
        />
      </div>

      <Button 
        onClick={handleSubmit}
        disabled={loading}
        className="w-full"
        variant={endorsementType === 'support' ? 'default' : 'destructive'}
      >
        {loading ? 'Submitting...' : `${endorsementType === 'support' ? 'Support' : 'Oppose'} Claim`}
      </Button>
    </div>
  )
}