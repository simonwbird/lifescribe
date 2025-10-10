import { ReactNode } from 'react'
import { LayoutType } from '@/hooks/useThemeCustomizer'
import { cn } from '@/lib/utils'

interface LayoutRendererProps {
  layout: LayoutType
  children: ReactNode
  className?: string
}

export function LayoutRenderer({ layout, children, className }: LayoutRendererProps) {
  const layoutClasses = {
    magazine: 'space-y-8',
    linear: 'space-y-4 max-w-3xl mx-auto',
    card_stack: 'grid gap-6 md:grid-cols-2 lg:grid-cols-3'
  }

  return (
    <div 
      className={cn(
        'layout-container',
        layoutClasses[layout],
        className
      )}
      data-layout={layout}
    >
      {children}
    </div>
  )
}
