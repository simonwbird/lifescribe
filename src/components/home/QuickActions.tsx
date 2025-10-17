import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Camera, UserPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/integrations/supabase/client'
import { routes } from '@/lib/routes'
import { LSLink } from '@/lib/linking'

interface QuickActionsProps {
  familyId: string
  userId: string
}

export function QuickActions({ familyId, userId }: QuickActionsProps) {
  const [draftCount, setDraftCount] = useState(0)

  useEffect(() => {
    if (!userId || !familyId) return

    async function loadDraftCount() {
      const { count } = await supabase
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('profile_id', userId)
        .eq('status', 'draft')

      setDraftCount(count || 0)
    }

    loadDraftCount()

    // Real-time updates
    const channel = supabase
      .channel('quick-actions-draft-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stories',
        filter: `family_id=eq.${familyId}`,
      }, () => {
        loadDraftCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, familyId])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <LSLink 
          to={routes.drafts()} 
          event="quick_action_click"
          eventProps={{ action: 'resume_drafts' }}
          className="block"
        >
          <Button variant="outline" className="w-full justify-start" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Resume Drafts
            {draftCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {draftCount}
              </Badge>
            )}
          </Button>
        </LSLink>

        <LSLink 
          to={routes.storyNew({ tab: 'photo', source: 'quick_actions' })}
          event="quick_action_click"
          eventProps={{ action: 'add_photo' }}
          className="block"
        >
          <Button variant="outline" className="w-full justify-start" size="sm">
            <Camera className="h-4 w-4 mr-2" />
            Add Photo
          </Button>
        </LSLink>

        <LSLink 
          to={routes.invitesNew()}
          event="quick_action_click"
          eventProps={{ action: 'invite_family' }}
          className="block"
        >
          <Button variant="outline" className="w-full justify-start" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Family
          </Button>
        </LSLink>
      </CardContent>
    </Card>
  )
}
