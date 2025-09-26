import { forwardRef, memo } from 'react'
import { cn } from '@/lib/utils'

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 5 | 6 | 12
    md?: 1 | 2 | 3 | 4 | 5 | 6 | 12
    lg?: 1 | 2 | 3 | 4 | 5 | 6 | 12
    xl?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  }
}

const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ className, cols = 1, gap = 'md', responsive, children, ...props }, ref) => {
    const colsMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-2', 
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6',
      12: 'grid-cols-12'
    }

    const gapMap = {
      none: 'gap-0',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8'
    }

    const responsiveClasses = responsive ? Object.entries(responsive).map(
      ([breakpoint, cols]) => `${breakpoint}:${colsMap[cols]}`
    ).join(' ') : ''

    return (
      <div
        ref={ref}
        className={cn(
          'grid',
          colsMap[cols],
          gapMap[gap],
          responsiveClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Grid.displayName = 'Grid'

interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  spanSm?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  spanMd?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  spanLg?: 1 | 2 | 3 | 4 | 5 | 6 | 12
  spanXl?: 1 | 2 | 3 | 4 | 5 | 6 | 12
}

const GridItem = forwardRef<HTMLDivElement, GridItemProps>(
  ({ className, span, spanSm, spanMd, spanLg, spanXl, children, ...props }, ref) => {
    const spanMap = {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3', 
      4: 'col-span-4',
      5: 'col-span-5',
      6: 'col-span-6',
      12: 'col-span-12'
    }

    return (
      <div
        ref={ref}
        className={cn(
          span && spanMap[span],
          spanSm && `sm:${spanMap[spanSm]}`,
          spanMd && `md:${spanMap[spanMd]}`,
          spanLg && `lg:${spanMap[spanLg]}`,
          spanXl && `xl:${spanMap[spanXl]}`,
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GridItem.displayName = 'GridItem'

export { Grid, GridItem }