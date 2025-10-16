import { useState, useEffect } from 'react';
import { Bell, Plus, User, UserCircle, Settings as SettingsIcon, Users, LogOut, CreditCard, FlaskConical, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { routes } from '@/lib/routes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { getSignedMediaUrl } from '@/lib/media';
import { useNavigate } from 'react-router-dom';
interface TopBarProps {
  familyId: string;
  userId: string;
}
export function TopBar({
  familyId,
  userId
}: TopBarProps) {
  const navigate = useNavigate();
  const {
    track
  } = useAnalytics(userId);
  const [profile, setProfile] = useState<any>(null);
  const [families, setFamilies] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    loadProfile();
    loadFamilies();
    loadNotifications();
    loadUserEmail();
    checkSuperAdmin();
    loadPersonAvatar();
  }, [userId, familyId]);
  async function loadProfile() {
    const {
      data
    } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', userId).single();
    if (data) setProfile(data);
  }
  async function loadPersonAvatar() {
    if (!userId || !familyId) {
      console.log('⏳ TopBar: Waiting for userId/familyId', {
        userId,
        familyId
      });
      return;
    }
    try {
      console.log('🔍 TopBar: Loading person avatar for user', userId);

      // Get the person record linked to this user
      const {
        data: personLink,
        error: linkError
      } = await supabase.from('person_user_links').select('person_id').eq('user_id', userId).limit(1).maybeSingle();
      console.log('👤 TopBar: Person link result', {
        personLink,
        linkError
      });
      if (personLink?.person_id && familyId) {
        // Get person's avatar
        const {
          data: personData,
          error: personError
        } = await supabase.from('people').select('avatar_url').eq('id', personLink.person_id).eq('family_id', familyId).single();
        console.log('🖼️ TopBar: Person data result', {
          personData,
          personError
        });
        if (personData?.avatar_url) {
          const avatarUrl = personData.avatar_url;
          console.log('✅ TopBar: Found avatar URL', avatarUrl);

          // If it's already a full URL, use it directly
          if (avatarUrl.startsWith('http')) {
            setResolvedAvatarUrl(avatarUrl);
          } else {
            // If it's a storage path, get signed URL
            const signedUrl = await getSignedMediaUrl(avatarUrl, familyId);
            console.log('🔗 TopBar: Resolved signed URL', signedUrl);
            setResolvedAvatarUrl(signedUrl);
          }
        }
      }
    } catch (error) {
      console.error('❌ TopBar: Error loading person avatar:', error);
    }
  }
  async function loadUserEmail() {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (user?.email) setUserEmail(user.email);
  }
  async function checkSuperAdmin() {
    const {
      data
    } = await supabase.from('profiles').select('settings').eq('id', userId).single();
    if (data?.settings && typeof data.settings === 'object' && 'role' in data.settings) {
      setIsSuperAdmin((data.settings as any).role === 'super_admin');
    }
  }
  async function loadFamilies() {
    const {
      data
    } = await supabase.from('members').select('family_id, families(id, name)').eq('profile_id', userId);
    if (data) {
      setFamilies(data.map(m => m.families).filter(Boolean));
    }
  }
  async function loadNotifications() {
    // Placeholder - would query notifications table
    setUnreadCount(0);
  }
  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate('/login');
  }
  return (
    <header role="banner" className="w-full border-b bg-background" aria-label="LifeScribe navigation bar">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Left side - could add navigation here */}
        <div className="flex items-center gap-2">
          {/* Space for future navigation items */}
        </div>

        {/* Right side - User actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={resolvedAvatarUrl || profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                  <AvatarFallback>
                    <UserCircle className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => navigate('/me')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                {isSuperAdmin && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}