import React from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface MobileLayoutProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  safeArea?: boolean
}

export default function MobileLayout({ 
  children, 
  className,
  padding = 'md',
  safeArea = true 
}: MobileLayoutProps) {
  const isMobile = useIsMobile()

  const paddingClasses = {
    none: '',
    sm: 'px-2 py-2',
    md: 'px-4 py-3', 
    lg: 'px-6 py-4'
  }

  return (
    <div 
      className={cn(
        // Base mobile-friendly classes
        'w-full min-h-screen',
        
        // Mobile-specific spacing and safe areas
        isMobile && [
          paddingClasses[padding],
          safeArea && 'pb-20', // Account for bottom navigation
          'touch-manipulation', // Improve touch responsiveness
          'overflow-x-hidden' // Prevent horizontal scroll
        ],
        
        // Desktop spacing (if not mobile)
        !isMobile && padding !== 'none' && 'container mx-auto px-4 py-6',
        
        className
      )}
      style={{
        // Ensure proper mobile viewport handling
        minHeight: isMobile ? '100dvh' : '100vh', // Use dynamic viewport height on mobile
        WebkitOverflowScrolling: 'touch' // Smooth scrolling on iOS
      }}
    >
      {children}
    </div>
  )
}

// Mobile-optimized card wrapper
interface MobileCardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export function MobileCard({ children, className, padding = true }: MobileCardProps) {
  const isMobile = useIsMobile()
  
  return (
    <div
      className={cn(
        'bg-card rounded-lg border',
        // Mobile-optimized touch targets and spacing
        isMobile ? [
          'min-h-[44px]', // Minimum touch target size
          padding && 'p-4',
          'shadow-sm'
        ] : [
          padding && 'p-6',
          'shadow-md'
        ],
        className
      )}
    >
      {children}
    </div>
  )
}

// Mobile-optimized button wrapper
interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export function MobileButton({ 
  children, 
  className, 
  variant = 'default',
  size = 'md',
  fullWidth = false,
  ...props 
}: MobileButtonProps) {
  const isMobile = useIsMobile()
  
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground'
  }
  
  const sizes = {
    sm: isMobile ? 'h-10 px-3 text-sm' : 'h-9 px-3 text-sm',
    md: isMobile ? 'h-12 px-4' : 'h-10 px-4',
    lg: isMobile ? 'h-14 px-6 text-lg' : 'h-11 px-8'
  }
  
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        // Mobile-specific improvements
        isMobile && [
          'touch-manipulation', // Better touch response
          'active:scale-95', // Provide visual feedback on touch
          'min-w-[44px]' // Minimum touch target
        ],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}