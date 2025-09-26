import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-meta font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        success: 'bg-success text-success-foreground hover:bg-success/80',
        warning: 'bg-warning text-warning-foreground hover:bg-warning/80',
        error: 'bg-error text-error-foreground hover:bg-error/80',
        outline: 'text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        sm: 'text-caption px-2 py-0.5',
        md: 'text-meta px-2.5 py-0.5',
        lg: 'text-body-sm px-3 py-1',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dismissible?: boolean
  onDismiss?: () => void
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, dismissible, onDismiss, children, ...props }, ref) => {
    return (
      <div 
        className={cn(badgeVariants({ variant, size }), className)} 
        ref={ref} 
        {...props}
      >
        {children}
        {dismissible && (
          <button
            onClick={onDismiss}
            className="ml-1 h-3 w-3 rounded-full hover:bg-black/10 flex items-center justify-center"
            aria-label="Remove badge"
          >
            <span className="text-xs">×</span>
          </button>
        )}
      </div>
    )
  }
)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }