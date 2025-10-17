import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TopBar } from '@/components/home/TopBar';
import { HeroStrip } from '@/components/home/HeroStrip';
import { SmartFeed } from '@/components/home/SmartFeed';
import { VoiceCapture } from '@/components/home/VoiceCapture';
import RightRail from '@/components/home/RightRail';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Mic, Menu } from 'lucide-react';
import ElderModeView from '@/components/elder/ElderModeView';
import { useElderMode } from '@/hooks/useElderMode';
import TodaysPromptCard from '@/components/prompts/TodaysPromptCard';
import { useTodaysPrompt } from '@/hooks/useTodaysPrompt';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { markCompleted } from '@/services/promptStatusService';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
export default function HomeV2() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [familyId, setFamilyId] = useState<string>('');
  const [showVoiceCapture, setShowVoiceCapture] = useState(false);
  const [toolsDrawerOpen, setToolsDrawerOpen] = useState(false);
  const {
    isElderMode,
    phoneCode,
    isLoading: elderModeLoading
  } = useElderMode(userId);
  const {
    data: todaysPrompt,
    isLoading: todaysLoading,
    refetch
  } = useTodaysPrompt(familyId);
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();

  // Handle ?panel=tools URL parameter
  useEffect(() => {
    const panel = searchParams.get('panel');
    if (panel === 'tools') {
      setToolsDrawerOpen(true);
    }
  }, [searchParams]);

  // Update URL when drawer opens/closes
  const handleToolsDrawerChange = (open: boolean) => {
    setToolsDrawerOpen(open);
    if (open) {
      setSearchParams({
        panel: 'tools'
      });
    } else {
      searchParams.delete('panel');
      setSearchParams(searchParams);
    }
  };

  // Prompt handlers
  const handleRespondToPrompt = (instanceId: string) => {
    if (todaysPrompt?.prompt) {
      const searchParams = new URLSearchParams({
        type: 'text',
        promptTitle: todaysPrompt.prompt.title,
        prompt_id: todaysPrompt.id,
        family_id: familyId
      });
      navigate(`/capture/story-wizard?${searchParams.toString()}`);
    }
  };
  const handleBrowseAll = () => {
    navigate('/prompts/hub');
  };
  const handleShuffle = async () => {
    try {
      // Get all open prompts for shuffling (excluding current one)
      const {
        data: openPrompts,
        error
      } = await supabase.from('prompt_instances').select(`
          id,
          status,
          person_ids,
          due_at,
          created_at,
          updated_at,
          prompt:prompts(
            id,
            title,
            body,
            category
          )
        `).eq('family_id', familyId).eq('status', 'open').neq('id', todaysPrompt?.id || '').order('created_at', {
        ascending: true
      });
      if (error) throw error;
      if (!openPrompts || openPrompts.length === 0) {
        toast({
          title: "No more prompts",
          description: "This is the only available prompt right now."
        });
        return;
      }

      // Pick the first open (oldest) as the new prompt
      const next = openPrompts[0];
      queryClient.setQueryData(['todays-prompt', familyId], next);
      toast({
        title: "Shuffled",
        description: "Showing a different prompt."
      });
    } catch (error) {
      console.error('Error shuffling prompt:', error);
      toast({
        title: "Couldn't shuffle",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };
  useEffect(() => {
    loadUserAndFamily();
  }, []);
  async function loadUserAndFamily() {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUserId(user.id);

      // Get family from URL param or first membership
      const paramFamily = searchParams.get('family');
      if (paramFamily) {
        setFamilyId(paramFamily);
      } else {
        const {
          data: membership
        } = await supabase.from('members').select('family_id').eq('profile_id', user.id).limit(1).single();
        if (membership) {
          setFamilyId(membership.family_id);
        }
      }
    } catch (error) {
      console.error('Error loading home:', error);
    } finally {
      setLoading(false);
    }
  }
  if (loading || elderModeLoading) {
    return <div className="min-h-screen bg-background">
        <div className="h-14 border-b bg-background/95">
          <div className="container flex h-14 items-center px-4 gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 flex-1 max-w-lg" />
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div className="container px-4 py-6">
          <div className="grid gap-3">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        </div>
      </div>;
  }

  // Show Elder Mode if enabled
  if (isElderMode && phoneCode) {
    return <ElderModeView userId={userId} familyId={familyId} phoneCode={phoneCode} />;
  }
  if (!familyId || !userId) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Family Found</h1>
          <p className="text-muted-foreground mb-4">
            You need to be part of a family to use this app.
          </p>
          <button onClick={() => navigate('/onboarding')} className="text-primary hover:underline">
            Get Started
          </button>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      {/* Sticky Header below global header */}
      <div className="sticky top-14 md:top-16 z-40 bg-background border-b">
        <TopBar familyId={familyId} userId={userId} />
      </div>
      
      {/* 3-Column Grid Layout: Sidebar + Main + Right Rail */}
      <div className="py-6">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-x-8 justify-items-start bg-neutral-50/70 dark:bg-neutral-900/30 rounded-2xl shadow-inner p-6">
            {/* Main Content Column */}
            <div className="space-y-6 w-full">
              {/* Today's Prompt */}
              <div className="max-w-3xl">
                <TodaysPromptCard promptInstance={todaysPrompt} onRespond={handleRespondToPrompt} onBrowseAll={handleBrowseAll} onShuffle={handleShuffle} loading={todaysLoading} persona="general" />
              </div>

              {/* Feed Section */}
              <main role="main" aria-label="Story feed" className="space-y-4 min-w-0">
                {/* Voice Capture Toggle */}
                {!showVoiceCapture}

                {/* Inline Voice Capture */}
                {showVoiceCapture && <VoiceCapture familyId={familyId} userId={userId} onPublished={() => setShowVoiceCapture(false)} onCancel={() => setShowVoiceCapture(false)} />}

                <SmartFeed familyId={familyId} userId={userId} />
              </main>
            </div>

            {/* Right Rail (xl and up only) - starts at top */}
            <aside 
              className="hidden xl:block border-l border-neutral-200/60 dark:border-neutral-800 pl-6 w-full"
              aria-label="Context"
            >
              <div className="sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-auto">
                <RightRail familyId={familyId} userId={userId} />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Mobile Tools Drawer (hidden on xl) */}
      <Sheet open={toolsDrawerOpen} onOpenChange={handleToolsDrawerChange}>
        <SheetTrigger asChild>
          <Button size="lg" className="fixed bottom-6 right-6 z-50 xl:hidden shadow-lg rounded-full w-14 h-14 p-0" aria-label="Open tools drawer">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Tools & Widgets</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <RightRail />
          </div>
        </SheetContent>
      </Sheet>
    </div>;
}