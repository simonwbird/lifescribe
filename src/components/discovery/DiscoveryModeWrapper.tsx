import { ReactNode } from 'react';
import { useDiscoveryMode } from '@/hooks/useDiscoveryMode';
import { cn } from '@/lib/utils';

interface DiscoveryModeWrapperProps {
  children: ReactNode;
  className?: string;
}

export function DiscoveryModeWrapper({ children, className }: DiscoveryModeWrapperProps) {
  const { isDiscoveryMode } = useDiscoveryMode();

  return (
    <div
      className={cn('transition-all duration-300', className)}
      data-discovery-mode={isDiscoveryMode}
    >
      {children}
    </div>
  );
}
