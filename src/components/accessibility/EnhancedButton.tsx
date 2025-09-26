import { forwardRef } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EnhancedButtonProps extends ButtonProps {
  'aria-label'?: string
  'aria-describedby'?: string
  loading?: boolean
  loadingText?: string
}

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ className, loading, loadingText, children, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          // Enhanced focus styles for accessibility
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "focus-visible:outline-none",
          className
        )}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span aria-hidden="true" className="animate-spin mr-2">⟳</span>
            <span>{loadingText || 'Loading...'}</span>
            <span className="sr-only">Processing request, please wait</span>
          </>
        ) : (
          children
        )}
      </Button>
    )
  }
)

EnhancedButton.displayName = 'EnhancedButton'