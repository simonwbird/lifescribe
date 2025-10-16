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
  return <>
      <header role="banner" className="w-full border-b bg-background" aria-label="LifeScribe navigation bar">
        
      </header>
    </>;
}