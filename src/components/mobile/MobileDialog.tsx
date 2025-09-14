import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface MobileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md', 
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-full mx-2'
}

export default function MobileDialog({ 
  open, 
  onOpenChange, 
  title, 
  description,
  children, 
  className,
  size = 'md'
}: MobileDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    // Use drawer on mobile for better UX
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn('max-h-[95vh]', className)}>
          {title && (
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </DrawerHeader>
          )}
          <div className="px-4 pb-4 overflow-y-auto">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // Use dialog on desktop
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(sizeClasses[size], 'max-h-[90vh] overflow-y-auto', className)}>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  )
}

// Mobile-optimized form dialog
interface MobileFormDialogProps extends MobileDialogProps {
  onSubmit?: (e: React.FormEvent) => void
  submitLabel?: string
  cancelLabel?: string
  onCancel?: () => void
  isSubmitting?: boolean
}

export function MobileFormDialog({
  onSubmit,
  submitLabel = 'Save',
  cancelLabel = 'Cancel', 
  onCancel,
  isSubmitting = false,
  children,
  ...props
}: MobileFormDialogProps) {
  const isMobile = useIsMobile()

  return (
    <MobileDialog {...props}>
      <form onSubmit={onSubmit} className="space-y-4">
        {children}
        <div className={cn(
          'flex gap-2 pt-4 border-t',
          isMobile ? 'flex-col' : 'flex-row justify-end'
        )}>
          <button
            type="button"
            onClick={onCancel || (() => props.onOpenChange(false))}
            className={cn(
              'px-4 py-2 rounded-md border border-input hover:bg-accent hover:text-accent-foreground transition-colors',
              isMobile && 'min-h-[44px]'
            )}
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50',
              isMobile && 'min-h-[44px]'
            )}
          >
            {isSubmitting ? 'Saving...' : submitLabel}
          </button>
        </div>
      </form>
    </MobileDialog>
  )
}