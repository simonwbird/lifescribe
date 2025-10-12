import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { MergeCompletionScreen } from './MergeCompletionScreen'

interface MergeProposal {
  id: string
  source_family_id: string
  target_family_id: string
  status: string
  collision_score: number
  message: string
  pre_merge_analysis: any
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
  proposal_type: string
  proposed_by: string
  merge_data: any
  expires_at: string
  updated_at: string
}

export function MergeProposalsInbox() {
  const [proposals, setProposals] = useState<MergeProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [completedMerge, setCompletedMerge] = useState<any>(null)

  useEffect(() => {
    loadProposals()
  }, [])

  const loadProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('merge_proposals')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProposals(data || [])
    } catch (error) {
      console.error('Error loading merge proposals:', error)
      toast({
        title: "Error",
        description: "Failed to load merge proposals",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProposalAction = async (proposalId: string, action: 'accept' | 'reject' | 'execute') => {
    setProcessingId(proposalId)
    
    try {
      const { data: currentUser } = await supabase.auth.getUser()
      if (!currentUser.user) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('families-merge', {
        body: {
          proposal_id: proposalId,
          action,
          confirmed_by: currentUser.user.id
        }
      })

      if (error) throw error

      if (action === 'execute' && data.success) {
        setCompletedMerge(data.merge_result)
      }

      toast({
        title: "Success",
        description: `Merge proposal ${action}${action.endsWith('e') ? 'd' : 'ed'} successfully`,
      })

      await loadProposals()
    } catch (error) {
      console.error(`Error ${action}ing proposal:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} merge proposal`,
        variant: "destructive"
      })
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />
      case 'rejected':
        return <XCircle className="h-4 w-4" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'outline'
      case 'accepted':
        return 'default'
      case 'rejected':
        return 'destructive'
      case 'completed':
        return 'default'
      default:
        return 'secondary'
    }
  }

  if (completedMerge) {
    return (
      <MergeCompletionScreen 
        mergeResult={completedMerge}
        onClose={() => setCompletedMerge(null)}
      />
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const pendingProposals = proposals.filter(p => p.status === 'pending')
  const acceptedProposals = proposals.filter(p => p.status === 'accepted')
  const completedProposals = proposals.filter(p => ['completed', 'rejected', 'failed'].includes(p.status))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Merge Proposals</h2>
        <p className="text-muted-foreground">Review and manage family merge suggestions</p>
      </div>

      {/* Pending Proposals */}
      {pendingProposals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Review ({pendingProposals.length})
          </h3>
          {pendingProposals.map(proposal => (
            <Card key={proposal.id} className="border-amber-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Family Merge Suggestion</CardTitle>
                  <Badge variant={getStatusVariant(proposal.status)} className="flex items-center gap-1">
                    {getStatusIcon(proposal.status)}
                    {proposal.status}
                  </Badge>
                </div>
                <CardDescription>
                  Score: {proposal.collision_score}/10 • {new Date(proposal.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Source Family</p>
                    <p className="text-muted-foreground">{proposal.source_family_id}</p>
                  </div>
                  <div>
                    <p className="font-medium">Target Family</p>
                    <p className="text-muted-foreground">{proposal.target_family_id}</p>
                  </div>
                </div>
                
                <div>
                  <p className="font-medium text-sm mb-1">Message</p>
                  <p className="text-sm text-muted-foreground">{proposal.message}</p>
                </div>

                {proposal.pre_merge_analysis && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="font-medium text-sm mb-2">Merge Analysis</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Source: {proposal.pre_merge_analysis.source_family?.members || 0} members</div>
                      <div>Target: {proposal.pre_merge_analysis.target_family?.members || 0} members</div>
                      <div>Stories: {(proposal.pre_merge_analysis.source_family?.stories || 0) + (proposal.pre_merge_analysis.target_family?.stories || 0)}</div>
                      <div>Media: {(proposal.pre_merge_analysis.source_family?.media || 0) + (proposal.pre_merge_analysis.target_family?.media || 0)}</div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleProposalAction(proposal.id, 'accept')}
                    disabled={processingId === proposal.id}
                    size="sm"
                  >
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleProposalAction(proposal.id, 'reject')}
                    disabled={processingId === proposal.id}
                    variant="outline"
                    size="sm"
                  >
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Accepted Proposals */}
      {acceptedProposals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Ready for Execution ({acceptedProposals.length})
          </h3>
          {acceptedProposals.map(proposal => (
            <Card key={proposal.id} className="border-green-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Approved Merge</CardTitle>
                  <Badge variant={getStatusVariant(proposal.status)} className="flex items-center gap-1">
                    {getStatusIcon(proposal.status)}
                    {proposal.status}
                  </Badge>
                </div>
                <CardDescription>
                  Reviewed {proposal.reviewed_at ? new Date(proposal.reviewed_at).toLocaleDateString() : 'Recently'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleProposalAction(proposal.id, 'execute')}
                    disabled={processingId === proposal.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Execute Merge
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed Proposals */}
      {completedProposals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">History ({completedProposals.length})</h3>
          {completedProposals.slice(0, 5).map(proposal => (
            <Card key={proposal.id} className="opacity-75">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Family Merge</CardTitle>
                  <Badge variant={getStatusVariant(proposal.status)} className="flex items-center gap-1">
                    {getStatusIcon(proposal.status)}
                    {proposal.status}
                  </Badge>
                </div>
                <CardDescription>
                  {proposal.reviewed_at ? new Date(proposal.reviewed_at).toLocaleDateString() : new Date(proposal.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {proposals.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No merge proposals at this time</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}