import { Badge } from '@/components/ui/badge'
import InlineInviteButton from '@/components/people/InlineInviteButton'

interface NotOnAppBadgeProps {
  personName: string
  familyId: string
  profileId: string
  showInvite?: boolean
}

export default function NotOnAppBadge({ 
  personName, 
  familyId, 
  profileId, 
  showInvite = true 
}: NotOnAppBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-muted-foreground">
        Not on app
      </Badge>
      {showInvite && (
        <InlineInviteButton
          personName={personName}
          familyId={familyId}
          profileId={profileId}
          showProgress={true}
        />
      )}
    </div>
  )
}