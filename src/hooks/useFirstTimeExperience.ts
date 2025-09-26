import { useState, useEffect } from 'react';
import { useAnalytics } from './useAnalytics';

type FirstTimeState = {
  guide_seen: boolean;
  first_story: boolean;
  first_response: boolean;
  onboarding_complete: boolean;
};

const DEFAULT_STATE: FirstTimeState = {
  guide_seen: false,
  first_story: false,
  first_response: false,
  onboarding_complete: false
};

export function useFirstTimeExperience() {
  const [state, setState] = useState<FirstTimeState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const { track } = useAnalytics();

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('firstTimeExperience');
      if (saved) {
        const parsed = JSON.parse(saved);
        setState({ ...DEFAULT_STATE, ...parsed });
      }
    } catch (error) {
      console.error('Error loading first-time experience state:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('firstTimeExperience', JSON.stringify(state));
      } catch (error) {
        console.error('Error saving first-time experience state:', error);
      }
    }
  }, [state, isLoading]);

  const markCompleted = (key: keyof FirstTimeState) => {
    setState(prev => {
      const newState = { ...prev, [key]: true };
      
      // Check if onboarding is complete
      if (key === 'first_story' && !prev.onboarding_complete) {
        newState.onboarding_complete = true;
        track('activity_clicked', {
          action: 'onboarding_completed',
          completion_trigger: 'first_story'
        });
      }

      return newState;
    });

    track('activity_clicked', {
      action: 'first_time_milestone',
      milestone: key,
      timestamp: new Date().toISOString()
    });
  };

  const reset = () => {
    setState(DEFAULT_STATE);
    localStorage.removeItem('firstTimeExperience');
    track('activity_clicked', { action: 'first_time_experience_reset' });
  };

  return {
    // State getters
    isLoading,
    isFirstTime: !state.onboarding_complete,
    hasSeenGuide: state.guide_seen,
    hasCompletedFirstStory: state.first_story,
    hasCompletedFirstResponse: state.first_response,
    isOnboardingComplete: state.onboarding_complete,
    
    // Computed properties
    showGuide: !state.guide_seen && !state.onboarding_complete,
    shouldShowCelebration: state.first_story && !state.onboarding_complete,
    
    // Actions
    markCompleted,
    reset,
    
    // Full state for debugging
    state
  };
}