import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import Header from '@/components/Header';
import WelcomeHeader from '@/components/home/WelcomeHeader';
import WhatsNew from '@/components/home/WhatsNew';
import ContinueSection from '@/components/home/ContinueSection';
import QuickStart from '@/components/home/QuickStart';
import FamilySpaces from '@/components/home/FamilySpaces';
import RightRail from '@/components/home/RightRail';
import CreateModal from '@/components/home/CreateModal';
import FirstLoginHero from '@/components/home/FirstLoginHero';
import { supabase } from '@/lib/supabase';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function Home() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [simpleMode, setSimpleMode] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSeen, setLastSeen] = useState<string>();
  const { track } = useAnalytics();

  useEffect(() => {
    const checkFirstLogin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get last visit timestamp
        const lastVisitKey = `last_visit_${user.id}`;
        const storedLastVisit = localStorage.getItem(lastVisitKey);
        setLastSeen(storedLastVisit || undefined);
        
        // Update last visit timestamp for next time
        localStorage.setItem(lastVisitKey, new Date().toISOString());

        // Check if user has any content (stories, etc.)
        const [storiesResult, answersResult] = await Promise.all([
          supabase.from('stories').select('id').eq('profile_id', user.id).limit(1),
          supabase.from('answers').select('id').eq('profile_id', user.id).limit(1)
        ]);

        const hasContent = (storiesResult.data?.length || 0) > 0 || (answersResult.data?.length || 0) > 0;
        setIsFirstLogin(!hasContent);

        // Get completed setup steps from localStorage
        const stepsKey = `setup_steps_${user.id}`;
        const stored = localStorage.getItem(stepsKey);
        if (stored) {
          setCompletedSteps(JSON.parse(stored));
        }

        // Get simple mode preference
        const simpleModeKey = `simple_mode_${user.id}`;
        const simpleModePref = localStorage.getItem(simpleModeKey) === 'true';
        setSimpleMode(simpleModePref);
      } catch (error) {
        console.error('Error checking first login:', error);
      } finally {
        setLoading(false);
      }
    };

    checkFirstLogin();
  }, []);

  const toggleSimpleMode = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newSimpleMode = !simpleMode;
    setSimpleMode(newSimpleMode);
    
    const simpleModeKey = `simple_mode_${user.id}`;
    localStorage.setItem(simpleModeKey, newSimpleMode.toString());

    track('simple_mode_toggled', { enabled: newSimpleMode });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-0">
        <Header />
        
        {/* Simple Mode Toggle */}
        <div className="container mx-auto px-4 pt-4">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSimpleMode}
              className="text-warm-gray hover:text-sage"
            >
              <Settings className="w-4 h-4 mr-2" />
              {simpleMode ? 'Full Mode' : 'Simple Mode'}
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {isFirstLogin ? (
            <FirstLoginHero 
              completedSteps={completedSteps}
              onStepComplete={() => {}} // Mock for now
            />
          ) : (
            <>
              <WelcomeHeader 
                lastSeen={lastSeen}
                onCreateClick={() => setShowCreateModal(true)} 
              />

              <div className={`grid gap-8 ${simpleMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-4'}`}>
                {/* Main Content */}
                <div className={simpleMode ? 'space-y-8' : 'lg:col-span-3 space-y-8'}>
                  {simpleMode ? (
                    // Simple Mode: Only essential sections
                    <>
                      <WhatsNew />
                      <QuickStart simpleMode={true} />
                    </>
                  ) : (
                    // Full Mode: All sections
                    <>
                      <WhatsNew />
                      <ContinueSection />
                      <QuickStart />
                      <FamilySpaces />
                    </>
                  )}
                </div>

                {/* Right Rail - Only in full mode */}
                {!simpleMode && (
                  <div className="lg:col-span-1">
                    <RightRail />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <CreateModal 
          open={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
         />
       </div>
     );
   }