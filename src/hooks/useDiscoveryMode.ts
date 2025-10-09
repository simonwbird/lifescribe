import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';
import { useAnalytics } from './useAnalytics';

export function useDiscoveryMode() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { track } = useAnalytics();
  
  const isDiscoveryMode = searchParams.get('mode') === 'discovery';

  const enableDiscoveryMode = useCallback(() => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('mode', 'discovery');
      return newParams;
    });
    
    track('discovery_mode_enabled', {});
  }, [setSearchParams, track]);

  const disableDiscoveryMode = useCallback(() => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete('mode');
      return newParams;
    });
    
    track('discovery_mode_disabled', {});
  }, [setSearchParams, track]);

  const toggleDiscoveryMode = useCallback(() => {
    if (isDiscoveryMode) {
      disableDiscoveryMode();
    } else {
      enableDiscoveryMode();
    }
  }, [isDiscoveryMode, enableDiscoveryMode, disableDiscoveryMode]);

  return {
    isDiscoveryMode,
    enableDiscoveryMode,
    disableDiscoveryMode,
    toggleDiscoveryMode,
  };
}
