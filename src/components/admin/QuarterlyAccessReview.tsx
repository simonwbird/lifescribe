import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { UserX, AlertTriangle, Calendar, Shield, ChevronDown, ChevronRight, Download } from 'lucide-react'
import { useQuarterlyReview, useRevokeAdminAccess } from '@/hooks/useAuditLogs'
import { useAnalytics } from '@/hooks/useAnalytics'
import { format, formatDistanceToNow } from 'date-fns'
import { getRiskLevel } from '@/lib/auditTypes'

export default function QuarterlyAccessReview() {
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [expandedAdmins, setExpandedAdmins] = useState<Set<string>>(new Set())

  const { data: review, isLoading, refetch } = useQuarterlyReview()
  const revokeAccessMutation = useRevokeAdminAccess()
  const { track } = useAnalytics()

  const handleRevokeAccess = async (adminId: string, familyId: string, role: string) => {
    try {
      await revokeAccessMutation.mutateAsync({
        adminId,
        familyId,
        role,
        reason: revokeReason || 'Quarterly access review'
      })

      // Track analytics event
      track('ADMIN_ACCESS_REVOKED' as any, {
        admin_id: adminId,
        family_id: familyId,
        role: role,
        reason: revokeReason || 'Quarterly access review',
        review_type: 'quarterly'
      })

      setSelectedAdmin(null)
      setRevokeReason('')
      refetch()
    } catch (error) {
      console.error('Failed to revoke access:', error)
    }
  }

  const toggleExpanded = (adminId: string) => {
    const newExpanded = new Set(expandedAdmins)
    if (newExpanded.has(adminId)) {
      newExpanded.delete(adminId)
    } else {
      newExpanded.add(adminId)
    }
    setExpandedAdmins(newExpanded)
  }

  const exportReview = () => {
    if (!review) return

    const reportData = {
      generated_at: review.generated_at,
      period: `${format(new Date(review.period_start), 'MMM dd, yyyy')} - ${format(new Date(review.period_end), 'MMM dd, yyyy')}`,
      summary: {
        total_admins: review.total_admins,
        active_admins: review.active_admins,
        inactive_admins: review.inactive_admins,
        high_risk_accounts: review.high_risk_accounts
      },
      admin_details: review.admin_summary.map(admin => ({
        email: admin.email,
        full_name: admin.full_name,
        last_activity: admin.last_activity_at ? format(new Date(admin.last_activity_at), 'PPpp') : 'Never',
        days_inactive: admin.days_since_activity,
        risk_score: admin.risk_score,
        total_families: admin.total_families,
        active_access_count: admin.access_entries.filter(a => a.is_active).length,
        recommendations: admin.recommendations,
        families: admin.access_entries.map(entry => ({
          family_name: entry.family_name,
          role: entry.role,
          granted_at: format(new Date(entry.granted_at), 'PPpp'),
          last_activity: format(new Date(entry.last_activity_at), 'PPpp'),
          is_active: entry.is_active
        }))
      }))
    }

    const jsonContent = JSON.stringify(reportData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `quarterly-access-review-${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!review) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Failed to generate quarterly access review
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quarterly Access Review</h1>
          <p className="text-muted-foreground">
            Review admin access across all families • Generated {formatDistanceToNow(new Date(review.generated_at), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportReview}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={() => refetch()}>
            Refresh Review
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{review.total_admins}</div>
            <p className="text-xs text-muted-foreground">Total Admins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{review.active_admins}</div>
            <p className="text-xs text-muted-foreground">Active (30 days)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{review.inactive_admins}</div>
            <p className="text-xs text-muted-foreground">Inactive</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{review.high_risk_accounts}</div>
            <p className="text-xs text-muted-foreground">High Risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Period Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Review Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg">
            {format(new Date(review.period_start), 'MMMM dd, yyyy')} - {format(new Date(review.period_end), 'MMMM dd, yyyy')}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Review generated on {format(new Date(review.generated_at), 'PPpp')}
          </p>
        </CardContent>
      </Card>

      {/* Admin Details */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Access Review</CardTitle>
          <CardDescription>
            Click on an admin to view detailed access information and take actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {review.admin_summary.map((admin) => {
              const riskLevel = getRiskLevel(admin.risk_score)
              const isExpanded = expandedAdmins.has(admin.admin_id)
              const activeAccessCount = admin.access_entries.filter(a => a.is_active).length

              return (
                <Collapsible key={admin.admin_id}>
                  <CollapsibleTrigger asChild>
                    <div 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleExpanded(admin.admin_id)}
                    >
                      <div className="flex items-center gap-4">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <div>
                          <div className="font-medium">{admin.full_name || 'Unnamed Admin'}</div>
                          <div className="text-sm text-muted-foreground">{admin.email}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">{activeAccessCount}</div>
                          <div className="text-xs text-muted-foreground">Active Access</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {admin.last_activity_at ? format(new Date(admin.last_activity_at), 'MMM dd') : 'Never'}
                          </div>
                          <div className="text-xs text-muted-foreground">Last Activity</div>
                        </div>
                        
                        <Badge 
                          variant="outline" 
                          className={`border-${riskLevel.color}-300 text-${riskLevel.color}-700`}
                        >
                          {riskLevel.label}
                        </Badge>

                        {admin.days_since_activity === null || admin.days_since_activity > 90 ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : null}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4">
                      <Separator />
                      
                      {/* Recommendations */}
                      <div>
                        <h4 className="font-medium mb-2">Recommendations:</h4>
                        <ul className="text-sm space-y-1">
                          {admin.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-muted-foreground">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Access Details */}
                      <div>
                        <h4 className="font-medium mb-2">Family Access Details:</h4>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Family</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Granted</TableHead>
                                <TableHead>Last Activity</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {admin.access_entries.map((access, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">
                                    {access.family_name}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">{access.role}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {format(new Date(access.granted_at), 'MMM dd, yyyy')}
                                  </TableCell>
                                  <TableCell>
                                    {format(new Date(access.last_activity_at), 'MMM dd, yyyy')}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={access.is_active ? 'default' : 'secondary'}>
                                      {access.is_active ? 'Active' : 'Revoked'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {access.is_active && (
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button 
                                            variant="destructive" 
                                            size="sm"
                                            onClick={() => setSelectedAdmin(`${admin.admin_id}:${access.family_id}:${access.role}`)}
                                          >
                                            <UserX className="h-3 w-3 mr-1" />
                                            Revoke
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Revoke Admin Access</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              You are about to revoke {access.role} access for {admin.email} from {access.family_name}.
                                              This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <div className="py-4">
                                            <label htmlFor="revoke-reason" className="text-sm font-medium">
                                              Reason for revocation (optional):
                                            </label>
                                            <Textarea
                                              id="revoke-reason"
                                              value={revokeReason}
                                              onChange={(e) => setRevokeReason(e.target.value)}
                                              placeholder="e.g., Quarterly access review - inactive user"
                                              className="mt-2"
                                            />
                                          </div>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel onClick={() => {
                                              setSelectedAdmin(null)
                                              setRevokeReason('')
                                            }}>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleRevokeAccess(admin.admin_id, access.family_id, access.role)}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                              disabled={revokeAccessMutation.isPending}
                                            >
                                              {revokeAccessMutation.isPending ? 'Revoking...' : 'Revoke Access'}
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            })}
          </div>
          
          {review.admin_summary.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No admin accounts found for review
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}