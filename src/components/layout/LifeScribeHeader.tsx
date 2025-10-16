import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Plus, HelpCircle, ChevronDown, Settings, LogOut, User, Users, UserCircle, FlaskConical, Shield, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getSignedMediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import { EnhancedGlobalSearch } from '@/components/search/EnhancedGlobalSearch';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { QuickAddButton } from '@/components/quick-add/QuickAddButton';
interface UserData {
  profile: {
    full_name: string;
    avatar_url: string;
  } | null;
  families: any[] | null;
  email: string | null;
  isSuperAdmin: boolean;
  personAvatarUrl: string | null;
}
export default function LifeScribeHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [resolvedAvatarUrl, setResolvedAvatarUrl] = useState<string | null>(null);

  // Fetch user and family data
  const {
    data: userData
  } = useQuery<UserData | null>({
    queryKey: ['header-user-data'],
    queryFn: async (): Promise<UserData | null> => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return null;
      const [profileData, memberData, profileSettings, familyData, personLink] = await Promise.all([supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(), supabase.from('members').select('family_id, families(name)').eq('profile_id', user.id), supabase.from('profiles').select('settings').eq('id', user.id).single(),
      // Get first family ID
      supabase.from('members').select('family_id').eq('profile_id', user.id).limit(1).single(),
      // Get the person record linked to this user
      supabase.from('person_user_links').select('person_id').eq('user_id', user.id).limit(1).maybeSingle()]);
      let personAvatarUrl = null;
      if (personLink.data?.person_id && familyData.data?.family_id) {
        // Get person's avatar
        const {
          data: personData
        } = await supabase.from('people').select('avatar_url').eq('id', personLink.data.person_id).eq('family_id', familyData.data.family_id).single();
        personAvatarUrl = personData?.avatar_url || null;
      }
      const isSuperAdmin = profileSettings.data?.settings && typeof profileSettings.data.settings === 'object' && 'role' in profileSettings.data.settings && (profileSettings.data.settings as any).role === 'super_admin';
      return {
        profile: profileData.data,
        families: memberData.data,
        email: user.email || null,
        isSuperAdmin: isSuperAdmin || false,
        personAvatarUrl: personAvatarUrl
      };
    }
  });

  // Resolve avatar URL with signed URLs like PersonPage does
  useEffect(() => {
    const resolveAvatar = async () => {
      if (!userData?.personAvatarUrl) {
        setResolvedAvatarUrl(null);
        return;
      }
      const avatarUrl = userData.personAvatarUrl;

      // If it's already a full URL, use it directly
      if (avatarUrl.startsWith('http')) {
        setResolvedAvatarUrl(avatarUrl);
        return;
      }

      // If it's a storage path, get signed URL
      if (userData.families && userData.families.length > 0) {
        const familyId = userData.families[0].family_id;
        const signedUrl = await getSignedMediaUrl(avatarUrl, familyId);
        setResolvedAvatarUrl(signedUrl);
      }
    };
    resolveAvatar();
  }, [userData?.personAvatarUrl, userData?.families]);

  // Handle scroll for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth/login');
  };
  return <header className={cn('sticky top-0 z-50 w-full border-b bg-background transition-all duration-300', isScrolled ? 'shadow-sm h-14 md:h-16' : 'h-14 md:h-16')} role="banner">
      <div className="container flex h-full items-center justify-between gap-3 px-3 md:px-6">
        {/* Left Section: Logo & Family Switcher */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Logo */}
          <button onClick={() => navigate('/home-v2')} className="flex items-center gap-2 hover-scale focus:outline-none focus:ring-2 focus:ring-primary rounded-lg p-1" aria-label="LifeScribe Home">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary" aria-hidden="true">
              <path d="M8 4L16 12L24 4M8 28L16 20L24 28M4 16H28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="16" cy="16" r="3" fill="currentColor" />
            </svg>
            <span className="hidden md:inline-block font-semibold text-lg">
              LifeScribe
            </span>
          </button>

          {/* Family Switcher */}
          {userData?.families && userData.families.length > 0 && <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 max-w-[180px]" aria-label="Switch family">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  <span className="truncate">
                    {(userData.families[0]?.families as any)?.name || 'Family'}
                  </span>
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-background">
                <DropdownMenuLabel>Your Families</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {userData.families.map((member: any) => <DropdownMenuItem key={member.family_id} onClick={() => navigate(`/family/${member.family_id}`)}>
                    {member.families?.name || 'Unnamed Family'}
                  </DropdownMenuItem>)}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/families/switch')}>
                  <Users className="mr-2 h-4 w-4" aria-hidden="true" />
                  Manage Families
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>}
        </div>

        {/* Center Section: Enhanced Global Search */}
        <div className="flex-1 max-w-md mx-auto hidden md:block">
          
        </div>

        {/* Right Section: Actions & User Menu */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Notifications */}
          <NotificationsDropdown />

          {/* Quick Add */}
          <QuickAddButton />

          {/* Help */}
          <Button variant="ghost" size="icon" className="hidden md:inline-flex h-9 w-9" onClick={() => navigate('/help')} aria-label="Help and support">
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="User menu">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={resolvedAvatarUrl || userData?.profile?.avatar_url || ''} alt="" />
                  <AvatarFallback>
                    {userData?.profile?.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-popover z-50">
              {/* User Info Header */}
              <div className="px-2 py-3">
                <p className="text-sm font-medium">
                  {userData?.profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userData?.email || ''}
                </p>
              </div>
              
              <DropdownMenuSeparator />
              
              {/* My Profile */}
              <DropdownMenuItem onClick={() => navigate('/me')} className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                My profile
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Your Family Section */}
              {userData?.families && userData.families.length > 0 && <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    YOUR FAMILY
                  </DropdownMenuLabel>
                  
                  {userData.families.map((member: any) => <DropdownMenuItem key={member.family_id} onClick={() => navigate(`/home-v2?family=${member.family_id}`)} className="cursor-pointer">
                      <Users className="mr-2 h-4 w-4" aria-hidden="true" />
                      {member.families?.name || 'Unnamed Family'}
                      {/* Green dot indicator for active family could go here */}
                      <span className="ml-auto h-2 w-2 rounded-full bg-green-500" />
                    </DropdownMenuItem>)}
                </>}
              
              {/* Labs */}
              <DropdownMenuItem onClick={() => navigate('/labs')} className="cursor-pointer">
                <FlaskConical className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Labs</span>
                <span className="ml-auto text-xs text-muted-foreground">(experimental)</span>
              </DropdownMenuItem>
              
              {/* Super Admin - Only show if user is super admin */}
              {userData?.isSuperAdmin && <DropdownMenuItem onClick={() => navigate('/admin')} className="cursor-pointer">
                  <Shield className="mr-2 h-4 w-4 text-destructive" aria-hidden="true" />
                  <span className="text-destructive">Super Admin</span>
                </DropdownMenuItem>}
              
              <DropdownMenuSeparator />
              
              {/* Settings */}
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                Settings
              </DropdownMenuItem>
              
              {/* Billing */}
              <DropdownMenuItem onClick={() => navigate('/settings?tab=billing')} className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" />
                Billing
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Sign Out */}
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar (shows below header on mobile) */}
      <div className="md:hidden border-t px-3 py-2 bg-background">
        <EnhancedGlobalSearch />
      </div>
    </header>;
}