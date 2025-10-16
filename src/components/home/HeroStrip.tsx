import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, FileText, Camera, Calendar, UserPlus, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/routes';
import { LSLink, TodaysPromptHeroTile, AddPhotoHeroTile } from '@/lib/linking';
import { useAnalytics } from '@/hooks/useAnalytics';
interface HeroStripProps {
  familyId: string;
  userId: string;
  isElderMode?: boolean;
  onOpenVoiceCapture?: () => void;
}
interface HeroTile {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: number;
  href?: string;
  variant?: 'default' | 'primary';
  event?: string;
  eventProps?: Record<string, unknown>;
  onClick?: () => void;
}
export function HeroStrip({
  familyId,
  userId,
  isElderMode = false,
  onOpenVoiceCapture
}: HeroStripProps) {
  const {
    track
  } = useAnalytics(userId);
  const [draftCount, setDraftCount] = useState(0);
  const [todayPrompt, setTodayPrompt] = useState<any>(null);

  // Real-time draft count
  useEffect(() => {
    loadDraftCount();
    const channel = supabase.channel('draft-updates').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'stories',
      filter: `family_id=eq.${familyId}`
    }, () => {
      loadDraftCount();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, userId]);

  // Load today's prompt
  useEffect(() => {
    loadTodayPrompt();
  }, [familyId]);
  async function loadDraftCount() {
    const {
      count
    } = await supabase.from('stories').select('*', {
      count: 'exact',
      head: true
    }).eq('family_id', familyId).eq('profile_id', userId).eq('status', 'draft');
    setDraftCount(count || 0);
  }
  async function loadTodayPrompt() {
    const {
      data
    } = await supabase.from('prompt_instances').select('id, prompts(title)').eq('family_id', familyId).eq('status', 'open').order('created_at', {
      ascending: false
    }).limit(1).single();
    if (data) setTodayPrompt(data);
  }
  const tiles: HeroTile[] = [{
    id: 'prompt',
    title: "Today's Prompt",
    subtitle: todayPrompt?.prompts?.title || 'What would you like to remember?',
    icon: <Lightbulb className="h-6 w-6" />,
    ...(isElderMode && onOpenVoiceCapture ? {
      onClick: onOpenVoiceCapture
    } : {
      href: routes.todaysPrompt(),
      event: 'hero_tile_click',
      eventProps: {
        tile: 'todays_prompt'
      }
    }),
    variant: 'primary'
  }, {
    id: 'drafts',
    title: 'Resume Drafts',
    subtitle: draftCount > 0 ? `${draftCount} draft${draftCount === 1 ? '' : 's'}` : 'No drafts',
    icon: <FileText className="h-6 w-6" />,
    badge: draftCount,
    href: routes.drafts(),
    event: 'hero_tile_click',
    eventProps: {
      tile: 'resume_drafts'
    }
  }, {
    id: 'photo',
    title: 'Add Photo',
    subtitle: 'Capture or scan',
    icon: <Camera className="h-6 w-6" />,
    href: routes.storyNew({
      tab: 'photo',
      source: 'hero'
    }),
    event: 'hero_tile_click',
    eventProps: {
      tile: 'add_photo'
    }
  }, {
    id: 'event',
    title: 'Create Event',
    subtitle: 'Plan together',
    icon: <Calendar className="h-6 w-6" />,
    href: routes.eventNew(),
    event: 'hero_tile_click',
    eventProps: {
      tile: 'create_event'
    }
  }, {
    id: 'invite',
    title: 'Invite Family',
    subtitle: 'Grow your circle',
    icon: <UserPlus className="h-6 w-6" />,
    href: routes.invitesNew(),
    event: 'hero_tile_click',
    eventProps: {
      tile: 'invite_family'
    }
  }];
  return <div className="w-full border-b bg-background">
      
    </div>;
}
function HeroTileCard({
  tile
}: {
  tile: HeroTile;
}) {
  const content = <Card className={cn('group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-95', tile.variant === 'primary' && 'border-primary/50 bg-primary/5')} onClick={tile.onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn('flex-shrink-0 rounded-lg p-2 transition-colors', tile.variant === 'primary' ? 'bg-primary/10 text-primary group-hover:bg-primary/20' : 'bg-muted text-muted-foreground group-hover:bg-muted/80')}>
              {tile.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-0.5 truncate">
                {tile.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {tile.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {tile.badge !== undefined && tile.badge > 0 && <Badge variant="secondary" className="h-6 min-w-6 px-2">
                {tile.badge}
              </Badge>}
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </div>
      </CardContent>
    </Card>;

  // If tile has onClick, render as-is. Otherwise wrap in LSLink
  if (tile.onClick || !tile.href) {
    return content;
  }
  return <LSLink to={tile.href} event={tile.event} eventProps={tile.eventProps} aria-label={tile.title} className="block">
      {content}
    </LSLink>;
}