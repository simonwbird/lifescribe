import { memo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'secondary' | 'outline'
  }
  className?: string
}

export const EmptyState = memo(function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div 
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      {icon && (
        <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>
      )}

      {/* Content */}
      <div className="space-y-2 max-w-md">
        <h3 className="text-h4 font-serif font-semibold text-foreground">
          {title}
        </h3>
        {description && (
          <p className="text-body text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* Action */}
      {action && (
        <div className="mt-6">
          <Button
            onClick={action.onClick}
            variant={action.variant || 'default'}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
})