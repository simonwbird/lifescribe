import { useEffect } from 'react';

interface ShortcutHandlers {
  s?: () => void; // Share a Story
  u?: () => void; // Upload Photos  
  q?: () => void; // Ask the Family
  r?: () => void; // Record Audio
  i?: () => void; // Invite a Family Member
}

export const useKeyboardShortcuts = (handlers: ShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if not in an input field
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      // Check if meta key (cmd/ctrl) or alt is pressed to avoid conflicts
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const key = event.key.toLowerCase();
      
      switch (key) {
        case 's':
          if (handlers.s) {
            event.preventDefault();
            handlers.s();
          }
          break;
        case 'u':
          if (handlers.u) {
            event.preventDefault();
            handlers.u();
          }
          break;
        case 'q':
          if (handlers.q) {
            event.preventDefault();
            handlers.q();
          }
          break;
        case 'r':
          if (handlers.r) {
            event.preventDefault();
            handlers.r();
          }
          break;
        case 'i':
          if (handlers.i) {
            event.preventDefault();
            handlers.i();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
};