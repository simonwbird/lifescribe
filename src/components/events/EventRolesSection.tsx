import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Users, Eye, Clock, Settings } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { EventAcl, getEventAcl } from '@/lib/eventAclService'
import { EventRoleSettings } from './EventRoleSettings'

interface EventRolesSectionProps {
  eventId: string
  familyId: string
}

export const EventRolesSection: React.FC<EventRolesSectionProps> = ({ eventId, familyId }) => {
  const [aclEntries, setAclEntries] = useState<EventAcl[]>([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadAcl()
  }, [eventId])

  const loadAcl = async () => {
    setLoading(true)
    try {
      const entries = await getEventAcl(eventId)
      setAclEntries(entries)
    } catch (error) {
      console.error('Error loading ACL:', error)
      toast({
        title: 'Error',
        description: 'Failed to load event permissions',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleStats = () => {
    const contributors = aclEntries.filter(e => e.role === 'contributor').length
    const viewers = aclEntries.filter(e => e.role === 'viewer').length
    const guests = aclEntries.filter(e => e.role === 'guest').length
    return { contributors, viewers, guests }
  }

  const { contributors, viewers, guests } = getRoleStats()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles & Permissions
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage who can view and contribute to this event
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Access
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Contributors Card */}
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                Contributors
              </CardTitle>
              <CardDescription className="text-xs">
                Can add notes, photos, and videos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{contributors}</span>
                <span className="text-sm text-muted-foreground">people</span>
              </div>
              <Badge variant="outline" className="mt-2 text-xs border-green-600 text-green-600">
                Full Access
              </Badge>
            </CardContent>
          </Card>

          {/* Viewers Card */}
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                Viewers
              </CardTitle>
              <CardDescription className="text-xs">
                Can view and comment only
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{viewers}</span>
                <span className="text-sm text-muted-foreground">people</span>
              </div>
              <Badge variant="outline" className="mt-2 text-xs border-blue-600 text-blue-600">
                Read Only
              </Badge>
            </CardContent>
          </Card>

          {/* Guests Card */}
          <Card className="border-orange-200 dark:border-orange-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                Guests
              </CardTitle>
              <CardDescription className="text-xs">
                Temporary view-only access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{guests}</span>
                <span className="text-sm text-muted-foreground">people</span>
              </div>
              <Badge variant="outline" className="mt-2 text-xs border-orange-600 text-orange-600">
                Needs Approval
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Role Settings Modal */}
      <EventRoleSettings
        eventId={eventId}
        familyId={familyId}
        isOpen={showSettings}
        onClose={() => {
          setShowSettings(false)
          loadAcl() // Refresh ACL after changes
        }}
      />
    </div>
  )
}
