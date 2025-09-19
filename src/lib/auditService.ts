import { supabase } from '@/integrations/supabase/client'
import type { 
  AuditLogEntry, 
  AdminAccessLog, 
  AuditFilters, 
  AuditEventPayload, 
  AuditIntegrityResult,
  QuarterlyAccessReview 
} from './auditTypes'

export class AuditService {
  /**
   * Log an audit event
   */
  static async logEvent(payload: AuditEventPayload): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('log_audit_event', {
        p_actor_id: payload.actor_id || null,
        p_actor_type: payload.actor_type || 'user',
        p_action: payload.action,
        p_entity_type: payload.entity_type,
        p_entity_id: payload.entity_id || null,
        p_family_id: payload.family_id || null,
        p_ip_address: payload.ip_address || null,
        p_user_agent: payload.user_agent || navigator.userAgent || null,
        p_session_id: payload.session_id || null,
        p_details: payload.details || {},
        p_before_values: payload.before_values || {},
        p_after_values: payload.after_values || {},
        p_risk_score: payload.risk_score || 0
      })

      if (error) {
        console.error('Failed to log audit event:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error logging audit event:', error)
      return null
    }
  }

  /**
   * Get audit logs with filtering and pagination
   */
  static async getAuditLogs(
    filters: AuditFilters = {}, 
    page = 1, 
    limit = 50
  ): Promise<{ data: AuditLogEntry[]; count: number | null }> {
    try {
      let query = supabase
        .from('audit_log')
        .select(`
          *,
          actor_profile:profiles!actor_id(full_name, email),
          family:families(name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.actor_id) {
        query = query.eq('actor_id', filters.actor_id)
      }
      
      if (filters.action) {
        query = query.eq('action', filters.action)
      }
      
      if (filters.entity_type) {
        query = query.eq('entity_type', filters.entity_type)
      }
      
      if (filters.family_id) {
        query = query.eq('family_id', filters.family_id)
      }
      
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }
      
      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }
      
      if (filters.risk_score_min !== undefined) {
        query = query.gte('risk_score', filters.risk_score_min)
      }
      
      if (filters.risk_score_max !== undefined) {
        query = query.lte('risk_score', filters.risk_score_max)
      }
      
      if (filters.is_tampered !== undefined) {
        query = query.eq('is_tampered', filters.is_tampered)
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Failed to fetch audit logs:', error)
        return { data: [], count: null }
      }

      return { 
        data: (data || []) as unknown as AuditLogEntry[], 
        count 
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      return { data: [], count: null }
    }
  }

  /**
   * Get admin access logs
   */
  static async getAdminAccessLogs(
    familyId?: string,
    includeRevoked = true
  ): Promise<AdminAccessLog[]> {
    try {
      let query = supabase
        .from('admin_access_log')
        .select(`
          *,
          admin_profile:profiles!admin_id(full_name, email),
          granted_by_profile:profiles!granted_by(full_name, email),
          revoked_by_profile:profiles!revoked_by(full_name, email),
          family:families(name)
        `)
        .order('last_activity_at', { ascending: false })

      if (familyId) {
        query = query.eq('family_id', familyId)
      }

      if (!includeRevoked) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) {
        console.error('Failed to fetch admin access logs:', error)
        return []
      }

      return (data || []) as unknown as AdminAccessLog[]
    } catch (error) {
      console.error('Error fetching admin access logs:', error)
      return []
    }
  }

  /**
   * Revoke admin access
   */
  static async revokeAdminAccess(
    adminId: string,
    familyId: string,
    role: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.rpc('revoke_admin_access', {
        p_admin_id: adminId,
        p_family_id: familyId,
        p_role: role,
        p_revoked_by: user.id,
        p_reason: reason || null
      })

      if (error) {
        console.error('Failed to revoke admin access:', error)
        return false
      }

      return data === true
    } catch (error) {
      console.error('Error revoking admin access:', error)
      return false
    }
  }

  /**
   * Generate quarterly access review
   */
  static async generateQuarterlyReview(): Promise<QuarterlyAccessReview | null> {
    try {
      const quarterEnd = new Date()
      const quarterStart = new Date(quarterEnd)
      quarterStart.setMonth(quarterStart.getMonth() - 3)

      // Get all admin access logs
      const adminLogs = await this.getAdminAccessLogs()
      
      // Group by admin
      const adminMap = new Map<string, {
        admin_id: string
        email: string
        full_name: string | null
        access_entries: any[]
        last_activity_at: string | null
      }>()

      for (const log of adminLogs) {
        if (!adminMap.has(log.admin_id)) {
          adminMap.set(log.admin_id, {
            admin_id: log.admin_id,
            email: log.admin_profile?.email || 'Unknown',
            full_name: log.admin_profile?.full_name || null,
            access_entries: [],
            last_activity_at: null
          })
        }

        const admin = adminMap.get(log.admin_id)!
        admin.access_entries.push({
          family_id: log.family_id,
          family_name: log.family?.name || 'Unknown Family',
          role: log.role,
          granted_at: log.granted_at,
          last_activity_at: log.last_activity_at,
          is_active: log.is_active
        })

        // Track most recent activity
        if (!admin.last_activity_at || log.last_activity_at > admin.last_activity_at) {
          admin.last_activity_at = log.last_activity_at
        }
      }

      // Calculate metrics and recommendations
      const adminSummary = Array.from(adminMap.values()).map(admin => {
        const daysSinceActivity = admin.last_activity_at 
          ? Math.floor((Date.now() - new Date(admin.last_activity_at).getTime()) / (1000 * 60 * 60 * 24))
          : null

        let riskScore = 0
        const recommendations: string[] = []

        // Risk scoring
        if (daysSinceActivity === null) {
          riskScore += 50
          recommendations.push('No recorded activity - verify account status')
        } else if (daysSinceActivity > 90) {
          riskScore += 30
          recommendations.push('Inactive for over 90 days - consider access review')
        } else if (daysSinceActivity > 30) {
          riskScore += 15
          recommendations.push('Inactive for over 30 days - monitor usage')
        }

        if (admin.access_entries.length > 5) {
          riskScore += 10
          recommendations.push('Access to many families - review necessity')
        }

        const activeAccess = admin.access_entries.filter(a => a.is_active).length
        if (activeAccess === 0) {
          riskScore += 20
          recommendations.push('No active access - consider account cleanup')
        }

        if (recommendations.length === 0) {
          recommendations.push('Account appears normal')
        }

        return {
          admin_id: admin.admin_id,
          email: admin.email,
          full_name: admin.full_name,
          total_families: admin.access_entries.length,
          last_activity_at: admin.last_activity_at,
          days_since_activity: daysSinceActivity,
          risk_score: Math.min(riskScore, 100),
          access_entries: admin.access_entries,
          recommendations
        }
      })

      const activeAdmins = adminSummary.filter(a => a.days_since_activity !== null && a.days_since_activity <= 30).length
      const inactiveAdmins = adminSummary.filter(a => a.days_since_activity === null || a.days_since_activity > 30).length
      const highRiskAccounts = adminSummary.filter(a => a.risk_score >= 50).length

      return {
        review_id: crypto.randomUUID(),
        generated_at: new Date().toISOString(),
        period_start: quarterStart.toISOString(),
        period_end: quarterEnd.toISOString(),
        total_admins: adminSummary.length,
        active_admins: activeAdmins,
        inactive_admins: inactiveAdmins,
        high_risk_accounts: highRiskAccounts,
        admin_summary: adminSummary.sort((a, b) => b.risk_score - a.risk_score)
      }
    } catch (error) {
      console.error('Error generating quarterly review:', error)
      return null
    }
  }

  /**
   * Verify audit log integrity
   */
  static async verifyIntegrity(
    startSequence?: number,
    endSequence?: number
  ): Promise<AuditIntegrityResult | null> {
    try {
      const { data, error } = await supabase.rpc('verify_audit_integrity', {
        p_start_sequence: startSequence || null,
        p_end_sequence: endSequence || null
      })

      if (error) {
        console.error('Failed to verify audit integrity:', error)
        return null
      }

      return data as unknown as AuditIntegrityResult
    } catch (error) {
      console.error('Error verifying audit integrity:', error)
      return null
    }
  }

  /**
   * Export audit logs to CSV
   */
  static async exportToCSV(filters: AuditFilters = {}): Promise<string> {
    try {
      // Get all matching records (no pagination for export)
      const { data } = await this.getAuditLogs(filters, 1, 10000)

      // CSV headers
      const headers = [
        'Timestamp',
        'Sequence',
        'Actor Email',
        'Actor Name',
        'Action',
        'Entity Type',
        'Entity ID',
        'Family',
        'Risk Score',
        'IP Address',
        'Details',
        'Is Tampered'
      ]

      // Convert data to CSV rows
      const rows = data.map(entry => [
        entry.created_at,
        entry.sequence_number.toString(),
        entry.actor_profile?.email || 'System',
        entry.actor_profile?.full_name || 'N/A',
        entry.action,
        entry.entity_type,
        entry.entity_id || 'N/A',
        entry.family?.name || 'N/A',
        entry.risk_score.toString(),
        entry.ip_address || 'N/A',
        JSON.stringify(entry.details),
        entry.is_tampered ? 'Yes' : 'No'
      ])

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      return csvContent
    } catch (error) {
      console.error('Error exporting audit logs:', error)
      throw error
    }
  }

  /**
   * Download CSV file
   */
  static downloadCSV(csvContent: string, filename = 'audit-logs.csv') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }
}