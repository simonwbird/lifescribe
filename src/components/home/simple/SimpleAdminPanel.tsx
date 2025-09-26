import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Settings, 
  Download, 
  Users2, 
  Shield,
  BarChart3
} from 'lucide-react'
import { ExportPanel } from '@/components/admin/ExportPanel'
import { useSecureRoles } from '@/hooks/useSecureRoles'

interface SimpleAdminPanelProps {
  familyId: string
}

export function SimpleAdminPanel({ familyId }: SimpleAdminPanelProps) {
  const { data: userRoles, isLoading: rolesLoading } = useSecureRoles()

  // Check if current user is admin for this family
  const isCurrentUserAdmin = userRoles?.familyRoles.some(
    role => role.familyId === familyId && role.role === 'admin'
  ) || userRoles?.systemRole === 'super_admin'

  if (rolesLoading || !isCurrentUserAdmin) {
    return null
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Family Admin Tools
          <Badge variant="secondary" className="ml-2">Admin</Badge>
        </CardTitle>
        <CardDescription>
          Manage your family content and download reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 bg-background/60 rounded-lg border">
            <Users2 className="h-8 w-8 text-blue-600 bg-blue-100 p-1.5 rounded-full" />
            <div>
              <p className="font-medium text-sm">Member Management</p>
              <p className="text-xs text-muted-foreground">Roles & permissions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-background/60 rounded-lg border">
            <BarChart3 className="h-8 w-8 text-green-600 bg-green-100 p-1.5 rounded-full" />
            <div>
              <p className="font-medium text-sm">Activity Reports</p>
              <p className="text-xs text-muted-foreground">Usage & engagement</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-background/60 rounded-lg border">
            <Download className="h-8 w-8 text-purple-600 bg-purple-100 p-1.5 rounded-full" />
            <div>
              <p className="font-medium text-sm">Data Export</p>
              <p className="text-xs text-muted-foreground">Stories & stats</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Export Panel - Compact Version */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <h4 className="font-medium">Quick Export</h4>
          </div>
          <ExportPanel familyId={familyId} compact={true} />
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <Settings className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Admin Features Available:</p>
              <ul className="space-y-0.5">
                <li>• Export family stories and engagement data</li>
                <li>• Moderate content directly in the feed (click ⋯ on any story)</li>
                <li>• Change member roles and permissions</li>
                <li>• View detailed activity reports</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}