import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';

interface WelcomeHeaderProps {
  onCreateClick: () => void;
}

export default function WelcomeHeader({ onCreateClick }: WelcomeHeaderProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lastVisit, setLastVisit] = useState<string>('');

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setProfile(profile);
        
        // Get last visit from localStorage
        const lastVisitKey = `last_visit_${user.id}`;
        const storedLastVisit = localStorage.getItem(lastVisitKey);
        
        if (storedLastVisit) {
          const lastVisitDate = new Date(storedLastVisit);
          const daysAgo = Math.floor((Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysAgo === 0) {
            setLastVisit('Earlier today');
          } else if (daysAgo === 1) {
            setLastVisit('Yesterday');
          } else if (daysAgo < 7) {
            setLastVisit(`${daysAgo} days ago`);
          } else {
            setLastVisit(lastVisitDate.toLocaleDateString());
          }
        }
        
        // Update last visit timestamp
        localStorage.setItem(lastVisitKey, new Date().toISOString());
      }
    };

    getProfile();
  }, []);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-h1 font-serif text-charcoal mb-2">
          Welcome back, {firstName}
        </h1>
        {lastVisit && (
          <p className="text-fine text-warm-gray mb-2">
            Last seen {lastVisit}
          </p>
        )}
        <p className="text-body text-sage italic">
          Where your family stories live forever.
        </p>
      </div>
      
      <Button 
        onClick={onCreateClick}
        className="bg-sage hover:bg-sage/90 text-cream"
        size="lg"
      >
        <Plus className="w-5 h-5 mr-2" />
        Create
      </Button>
    </div>
  );
}