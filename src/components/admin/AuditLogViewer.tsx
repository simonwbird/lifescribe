import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, Download, Shield, Search, Filter, Calendar, RefreshCw } from 'lucide-react'
import { useAuditLogs, useExportAuditLogs, useAuditIntegrity } from '@/hooks/useAuditLogs'
import type { AuditFilters, AuditActionType } from '@/lib/auditTypes'
import { AUDIT_ACTION_LABELS, getRiskLevel } from '@/lib/auditTypes'
import { format } from 'date-fns'

export default function AuditLogViewer() {
  const [filters, setFilters] = useState<AuditFilters>({})
  const [page, setPage] = useState(1)
  const [showIntegrityPanel, setShowIntegrityPanel] = useState(false)

  const { data: auditData, isLoading, refetch } = useAuditLogs(filters, page, 50)
  const exportMutation = useExportAuditLogs()
  const { data: integrityResult, refetch: checkIntegrity, isLoading: checkingIntegrity } = useAuditIntegrity()

  const auditLogs = auditData?.data || []
  const totalCount = auditData?.count || 0
  const totalPages = Math.ceil(totalCount / 50)

  const handleFilterChange = (key: keyof AuditFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filtering
  }

  const handleExport = () => {
    exportMutation.mutate(filters)
  }

  const handleIntegrityCheck = () => {
    checkIntegrity()
    setShowIntegrityPanel(true)
  }

  const riskStats = useMemo(() => {
    const stats = { low: 0, medium: 0, high: 0, critical: 0, tampered: 0 }
    
    auditLogs.forEach(log => {
      if (log.is_tampered) {
        stats.tampered++
      } else {
        const level = getRiskLevel(log.risk_score)
        switch (level.key) {
          case 'LOW': stats.low++; break
          case 'MEDIUM': stats.medium++; break
          case 'HIGH': stats.high++; break
          case 'CRITICAL': stats.critical++; break
        }
      }
    })
    
    return stats
  }, [auditLogs])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Log Viewer</h1>
          <p className="text-muted-foreground">
            Monitor all platform activities with tamper-evident logging
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleIntegrityCheck}
            disabled={checkingIntegrity}
          >
            <Shield className="h-4 w-4 mr-2" />
            {checkingIntegrity ? 'Checking...' : 'Verify Integrity'}
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exportMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {exportMutation.isPending ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Risk Overview */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{riskStats.low}</div>
            <p className="text-xs text-muted-foreground">Low Risk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{riskStats.medium}</div>
            <p className="text-xs text-muted-foreground">Medium Risk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{riskStats.high}</div>
            <p className="text-xs text-muted-foreground">High Risk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{riskStats.critical}</div>
            <p className="text-xs text-muted-foreground">Critical Risk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-destructive">{riskStats.tampered}</div>
            <p className="text-xs text-muted-foreground">Tampered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">Total Events</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action-filter">Action</Label>
              <Select onValueChange={(value) => handleFilterChange('action', value === 'all' ? undefined : value as AuditActionType)}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {Object.entries(AUDIT_ACTION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="entity-filter">Entity Type</Label>
              <Select onValueChange={(value) => handleFilterChange('entity_type', value === 'all' ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All entities</SelectItem>
                  <SelectItem value="story">Stories</SelectItem>
                  <SelectItem value="comment">Comments</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="family">Families</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="admin_access">Admin Access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="tampered-only"
                onChange={(e) => handleFilterChange('is_tampered', e.target.checked ? true : undefined)}
              />
              <Label htmlFor="tampered-only">Show tampered entries only</Label>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => {
                setFilters({})
                setPage(1)
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integrity Check Panel */}
      {showIntegrityPanel && integrityResult && (
        <Card className={integrityResult.valid ? 'border-green-200' : 'border-red-200'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className={`h-5 w-5 ${integrityResult.valid ? 'text-green-600' : 'text-red-600'}`} />
              Audit Log Integrity Check
            </CardTitle>
            <CardDescription>
              Verified at: {format(new Date(integrityResult.summary.verified_at), 'PPpp')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold">{integrityResult.summary.checked_records}</div>
                <p className="text-sm text-muted-foreground">Records Checked</p>
              </div>
              <div>
                <div className={`text-2xl font-bold ${integrityResult.summary.error_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {integrityResult.summary.error_count}
                </div>
                <p className="text-sm text-muted-foreground">Integrity Errors</p>
              </div>
              <div>
                <Badge variant={integrityResult.valid ? 'default' : 'destructive'}>
                  {integrityResult.valid ? 'VALID' : 'COMPROMISED'}
                </Badge>
              </div>
            </div>

            {integrityResult.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-red-600 mb-2">Integrity Violations:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {integrityResult.errors.map((error, index) => (
                    <div key={index} className="text-sm p-2 bg-red-50 rounded">
                      <strong>Sequence {error.sequence}:</strong> {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
          <CardDescription>
            Showing {auditLogs.length} of {totalCount} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Family</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => {
                      const riskLevel = getRiskLevel(log.risk_score)
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {log.actor_profile?.full_name || 'System'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {log.actor_profile?.email || log.actor_type}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {AUDIT_ACTION_LABELS[log.action] || log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.entity_type}</div>
                              {log.entity_id && (
                                <div className="text-sm text-muted-foreground font-mono">
                                  {log.entity_id.substring(0, 8)}...
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.family?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`border-${riskLevel.color}-300 text-${riskLevel.color}-700`}
                            >
                              {riskLevel.label} ({log.risk_score})
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.is_tampered ? (
                              <Badge variant="destructive">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Tampered
                              </Badge>
                            ) : (
                              <Badge variant="default">Valid</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}