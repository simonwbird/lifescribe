import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bug, Keyboard } from 'lucide-react';
import { BugReportModal } from './BugReportModal';
import { useBugReporting } from '@/hooks/useBugReporting';

export const BugReportWidget = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isEnabled } = useBugReporting();

  // Keyboard shortcut: 'r' key
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only trigger if 'r' is pressed without any modifiers and not in an input field
      if (
        event.key.toLowerCase() === 'r' && 
        !event.ctrlKey && 
        !event.altKey && 
        !event.metaKey &&
        event.target instanceof Element &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) &&
        !event.target.hasAttribute('contenteditable')
      ) {
        if (isEnabled) {
          event.preventDefault();
          setIsModalOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isEnabled]);

  // Don't render if not enabled
  if (!isEnabled) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-destructive hover:bg-destructive/90"
        title="Report a Bug (Press 'R')"
      >
        <Bug className="w-6 h-6" />
      </Button>

      {/* Keyboard Shortcut Indicator */}
      <div className="fixed bottom-20 right-4 z-40 bg-background/80 backdrop-blur-sm border rounded-md px-2 py-1 text-xs text-muted-foreground opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <Keyboard className="w-3 h-3 inline mr-1" />
        Press 'R' to report a bug
      </div>

      {/* Bug Report Modal */}
      <BugReportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};