import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Shield, AlertTriangle, CheckCircle, Eye, Clock, User, Mail } from 'lucide-react'
import { getSecurityAuditLogs } from '@/lib/security'
import { useActiveSpace } from '@/hooks/useActiveSpace'
import { supabase } from '@/lib/supabase'

interface SecurityAuditLog {
  id: string
  user_id: string | null
  family_id: string
  action: string
  details: any // Using any instead of Record<string, any> to match Supabase Json type
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

interface InviteSecurity {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
}

export default function SecurityDashboard() {
  const { activeSpace } = useActiveSpace()
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([])
  const [invites, setInvites] = useState<InviteSecurity[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!activeSpace?.id) return

    const checkAdminAndLoadData = async () => {
      try {
        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: member } = await supabase
          .from('members')
          .select('role')
          .eq('family_id', activeSpace.id)
          .eq('profile_id', user.id)
          .single()

        const adminStatus = member?.role === 'admin'
        setIsAdmin(adminStatus)

        if (adminStatus) {
          // Load audit logs
          const logs = await getSecurityAuditLogs(activeSpace.id)
          setAuditLogs(logs as SecurityAuditLog[])

          // Load invite data
          const { data: inviteData } = await supabase
            .from('invites')
            .select('id, email, role, status, created_at, expires_at')
            .eq('family_id', activeSpace.id)
            .order('created_at', { ascending: false })
            .limit(20)

          setInvites(inviteData || [])
        }
      } catch (error) {
        console.error('Error loading security data:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAdminAndLoadData()
  }, [activeSpace?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Shield className="h-5 w-5" />
            <p>Security dashboard is only available to family administrators.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'invite_sent':
      case 'invite_link_created':
        return <Mail className="h-4 w-4" />
      case 'login':
      case 'logout':
        return <User className="h-4 w-4" />
      default:
        return <Eye className="h-4 w-4" />
    }
  }

  const getActionVariant = (action: string) => {
    switch (action) {
      case 'invite_sent':
      case 'invite_link_created':
        return 'default'
      case 'login':
        return 'secondary'
      case 'failed_login':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const activeInvites = invites.filter(invite => 
    invite.status === 'pending' && new Date(invite.expires_at) > new Date()
  )
  
  const expiredInvites = invites.filter(invite => 
    invite.status === 'pending' && new Date(invite.expires_at) <= new Date()
  )

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Security Status</p>
                <p className="text-xs text-muted-foreground">Protected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Active Invites</p>
                <p className="text-xs text-muted-foreground">{activeInvites.length} pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Recent Activity</p>
                <p className="text-xs text-muted-foreground">{auditLogs.length} events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expired Invites Warning */}
      {expiredInvites.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-sm">Expired Invites</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {expiredInvites.length} invitations have expired and should be cleaned up.
            </p>
            <Button variant="outline" size="sm">
              Clean Up Expired Invites
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Security Audit Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Audit Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getActionIcon(log.action)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getActionVariant(log.action) as any} className="text-xs">
                            {log.action}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                        {log.details && typeof log.details === 'object' && Object.keys(log.details).length > 0 && (
                          <pre className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No security events recorded yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Active Invitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Recent Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {invites.length > 0 ? (
                  invites.slice(0, 10).map((invite) => (
                    <div key={invite.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{invite.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={invite.status === 'accepted' ? 'default' : 
                                   new Date(invite.expires_at) <= new Date() ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {invite.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {invite.role}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {new Date(invite.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No invitations sent yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}