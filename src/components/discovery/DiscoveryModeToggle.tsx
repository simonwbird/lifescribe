import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useDiscoveryMode } from '@/hooks/useDiscoveryMode';
import { cn } from '@/lib/utils';

export function DiscoveryModeToggle() {
  const { isDiscoveryMode, toggleDiscoveryMode } = useDiscoveryMode();

  return (
    <Button
      variant={isDiscoveryMode ? 'default' : 'outline'}
      size="sm"
      onClick={toggleDiscoveryMode}
      className={cn(
        'transition-all',
        isDiscoveryMode && 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90'
      )}
    >
      <Sparkles className="mr-2 h-4 w-4" />
      {isDiscoveryMode ? 'Exit Discovery' : 'Discovery Mode'}
    </Button>
  );
}
