import { UserCheck, UserX, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  useFamilyMembersWithFollowStatus,
  useToggleFollowPreference,
  useClearFollowPreferences,
} from '@/hooks/useDigestFollowPreferences';
import { useAnalytics } from '@/hooks/useAnalytics';

interface DigestFollowPreferencesProps {
  familyId: string;
}

export function DigestFollowPreferences({ familyId }: DigestFollowPreferencesProps) {
  const { data: members = [], isLoading } = useFamilyMembersWithFollowStatus(familyId);
  const toggleFollow = useToggleFollowPreference();
  const clearPreferences = useClearFollowPreferences();
  const { track } = useAnalytics();

  const followedCount = members.filter(m => m.is_followed).length;
  const hasAnyFollowPreferences = followedCount > 0;
  const isFollowingEveryone = !hasAnyFollowPreferences;

  const handleToggleFollow = (memberId: string, isCurrentlyFollowed: boolean) => {
    toggleFollow.mutate({
      familyId,
      memberId,
      isCurrentlyFollowed,
    });

    track('digest_follow_toggled', {
      family_id: familyId,
      member_id: memberId,
      action: isCurrentlyFollowed ? 'unfollow' : 'follow',
    });
  };

  const handleFollowEveryone = () => {
    clearPreferences.mutate(familyId);
    track('digest_follow_everyone', { family_id: familyId });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-muted rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Follow Preferences</Label>
          <p className="text-sm text-muted-foreground mt-1">
            {isFollowingEveryone
              ? 'Currently following all family members'
              : `Following ${followedCount} of ${members.length} family members`}
          </p>
        </div>

        {!isFollowingEveryone && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleFollowEveryone}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Follow Everyone
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        <p>
          Choose which family members' updates you want to see in your weekly digest.
          By default, you'll receive updates from everyone.
        </p>
      </div>

      <div className="space-y-2">
        {members.map(member => {
          const initials = member.full_name
            ?.split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase() || '?';

          const isFollowed = isFollowingEveryone || member.is_followed;

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar_url || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                
                <div>
                  <p className="font-medium">{member.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isFollowed ? 'Receiving updates' : 'Not following'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isFollowed && !isFollowingEveryone && (
                  <UserCheck className="h-4 w-4 text-primary" />
                )}
                {!isFollowed && !isFollowingEveryone && (
                  <UserX className="h-4 w-4 text-muted-foreground" />
                )}
                
                <Switch
                  checked={isFollowed}
                  disabled={isFollowingEveryone}
                  onCheckedChange={() => handleToggleFollow(member.profile_id, member.is_followed)}
                  aria-label={`Follow ${member.full_name || 'this member'}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {members.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No family members found</p>
        </div>
      )}
    </div>
  );
}
