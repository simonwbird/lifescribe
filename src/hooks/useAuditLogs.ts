import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AuditService } from '@/lib/auditService'
import type { AuditFilters, AuditEventPayload } from '@/lib/auditTypes'
import { useToast } from '@/hooks/use-toast'

export const useAuditLogs = (filters: AuditFilters = {}, page = 1, limit = 50) => {
  return useQuery({
    queryKey: ['audit-logs', filters, page, limit],
    queryFn: () => AuditService.getAuditLogs(filters, page, limit),
    staleTime: 30000, // 30 seconds
  })
}

export const useAdminAccessLogs = (familyId?: string, includeRevoked = true) => {
  return useQuery({
    queryKey: ['admin-access-logs', familyId, includeRevoked],
    queryFn: () => AuditService.getAdminAccessLogs(familyId, includeRevoked),
    staleTime: 60000, // 1 minute
  })
}

export const useQuarterlyReview = () => {
  return useQuery({
    queryKey: ['quarterly-review'],
    queryFn: () => AuditService.generateQuarterlyReview(),
    staleTime: 300000, // 5 minutes
  })
}

export const useAuditIntegrity = (startSequence?: number, endSequence?: number) => {
  return useQuery({
    queryKey: ['audit-integrity', startSequence, endSequence],
    queryFn: () => AuditService.verifyIntegrity(startSequence, endSequence),
    enabled: false, // Manual trigger only
  })
}

export const useLogAuditEvent = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: AuditEventPayload) => AuditService.logEvent(payload),
    onSuccess: () => {
      // Invalidate audit logs to refresh
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
    onError: (error) => {
      console.error('Failed to log audit event:', error)
      toast({
        title: 'Audit Log Error',
        description: 'Failed to log audit event. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

export const useRevokeAdminAccess = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ 
      adminId, 
      familyId, 
      role, 
      reason 
    }: { 
      adminId: string
      familyId: string
      role: string
      reason?: string 
    }) => AuditService.revokeAdminAccess(adminId, familyId, role, reason),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['admin-access-logs'] })
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
      queryClient.invalidateQueries({ queryKey: ['quarterly-review'] })
      
      toast({
        title: 'Access Revoked',
        description: 'Admin access has been successfully revoked.',
      })
    },
    onError: (error) => {
      console.error('Failed to revoke admin access:', error)
      toast({
        title: 'Revocation Failed',
        description: 'Failed to revoke admin access. Please try again.',
        variant: 'destructive',
      })
    },
  })
}

export const useExportAuditLogs = () => {
  const { toast } = useToast()

  return useMutation({
    mutationFn: (filters: AuditFilters) => AuditService.exportToCSV(filters),
    onSuccess: (csvContent) => {
      const timestamp = new Date().toISOString().split('T')[0]
      AuditService.downloadCSV(csvContent, `audit-logs-${timestamp}.csv`)
      
      toast({
        title: 'Export Complete',
        description: 'Audit logs have been exported successfully.',
      })
    },
    onError: (error) => {
      console.error('Failed to export audit logs:', error)
      toast({
        title: 'Export Failed',
        description: 'Failed to export audit logs. Please try again.',
        variant: 'destructive',
      })
    },
  })
}