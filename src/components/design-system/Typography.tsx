import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

// Display Text - Large headings and hero text
interface DisplayProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export const Display = forwardRef<HTMLHeadingElement, DisplayProps>(
  ({ className, as: Comp = 'h1', ...props }, ref) => (
    <Comp
      ref={ref}
      className={cn(
        'text-display font-serif font-bold text-foreground leading-tight tracking-tight',
        className
      )}
      {...props}
    />
  )
)
Display.displayName = 'Display'

// Headings H1-H6
export const H1 = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h1
      ref={ref}
      className={cn(
        'text-h1 font-serif font-semibold text-foreground leading-tight tracking-tight',
        className
      )}
      {...props}
    />
  )
)
H1.displayName = 'H1'

export const H2 = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn(
        'text-h2 font-serif font-semibold text-foreground leading-tight',
        className
      )}
      {...props}
    />
  )
)
H2.displayName = 'H2'

export const H3 = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-h3 font-serif font-semibold text-foreground leading-tight',
        className
      )}
      {...props}
    />
  )
)
H3.displayName = 'H3'

export const H4 = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h4
      ref={ref}
      className={cn(
        'text-h4 font-serif font-medium text-foreground leading-snug',
        className
      )}
      {...props}
    />
  )
)
H4.displayName = 'H4'

export const H5 = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn(
        'text-h5 font-serif font-medium text-foreground leading-snug',
        className
      )}
      {...props}
    />
  )
)
H5.displayName = 'H5'

export const H6 = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h6
      ref={ref}
      className={cn(
        'text-h6 font-serif font-medium text-foreground leading-snug',
        className
      )}
      {...props}
    />
  )
)
H6.displayName = 'H6'

// Body Text
export const Body = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        'text-body leading-relaxed text-foreground',
        className
      )}
      {...props}
    />
  )
)
Body.displayName = 'Body'

export const BodySmall = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        'text-body-sm leading-relaxed text-muted-foreground',
        className
      )}
      {...props}
    />
  )
)
BodySmall.displayName = 'BodySmall'

// Meta Text - Small labels, captions, etc.
export const Meta = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'text-meta font-medium uppercase tracking-wide text-muted-foreground',
        className
      )}
      {...props}
    />
  )
)
Meta.displayName = 'Meta'

export const Caption = forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'text-caption text-muted-foreground',
        className
      )}
      {...props}
    />
  )
)
Caption.displayName = 'Caption'