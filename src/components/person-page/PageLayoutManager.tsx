import React, { ReactNode, useMemo } from 'react'
import { Breakpoint } from '@/hooks/useBreakpoint'
import { cn } from '@/lib/utils'

export interface BlockItem {
  id: string
  component: ReactNode
}

export interface LayoutMap {
  desktop: {
    main: string[]
    rail: string[]
  }
  tablet: {
    main: string[]
    rail: string[]
  }
  mobile: {
    main: string[]
    rail: string[]
  }
}

interface PageLayoutManagerProps {
  blocks: BlockItem[]
  layoutMap: LayoutMap
  breakpoint: Breakpoint
  className?: string
}

export function PageLayoutManager({
  blocks,
  layoutMap,
  breakpoint,
  className
}: PageLayoutManagerProps) {
  // Create a map of block IDs to components for efficient lookup
  const blockMap = useMemo(() => {
    const map = new Map<string, ReactNode>()
    blocks.forEach(block => {
      map.set(block.id, block.component)
    })
    console.log('📦 PageLayoutManager: Block map created', {
      blockIds: Array.from(map.keys()),
      breakpoint
    })
    return map
  }, [blocks, breakpoint])

  // Get the current layout configuration
  const currentLayout = layoutMap[breakpoint]
  
  console.log('🗺️ PageLayoutManager: Current layout', {
    breakpoint,
    mainIds: currentLayout.main,
    railIds: currentLayout.rail,
    availableBlocks: Array.from(blockMap.keys())
  })

  // Distribute blocks into main and rail based on layout map
  const mainBlocks = useMemo(() => {
    const blocks = currentLayout.main
      .map(blockId => ({
        id: blockId,
        component: blockMap.get(blockId)
      }))
      .filter(item => item.component !== undefined)
    console.log('📍 Main blocks:', blocks.map(b => b.id))
    return blocks
  }, [currentLayout.main, blockMap])

  const railBlocks = useMemo(() => {
    const blocks = currentLayout.rail
      .map(blockId => ({
        id: blockId,
        component: blockMap.get(blockId)
      }))
      .filter(item => item.component !== undefined)
    console.log('🎯 Rail blocks:', blocks.map(b => b.id))
    return blocks
  }, [currentLayout.rail, blockMap])

  // Handle blocks not in layout map (default to main)
  const unplacedBlocks = useMemo(() => {
    const placedIds = new Set([...currentLayout.main, ...currentLayout.rail])
    return blocks
      .filter(block => !placedIds.has(block.id))
      .map(block => ({
        id: block.id,
        component: block.component
      }))
  }, [blocks, currentLayout, blockMap])

  return (
    <div className={cn('lg:grid lg:grid-cols-12 lg:gap-6', className)}>
      {/* Main content column */}
      <div className="lg:col-span-8 space-y-6">
        {[...mainBlocks, ...unplacedBlocks].map(block => (
          <div key={block.id}>
            {block.component}
          </div>
        ))}
      </div>

      {/* Right rail column (hidden on mobile if empty) */}
      {railBlocks.length > 0 && (
        <div className={cn(
          'lg:col-span-4 space-y-4',
          breakpoint === 'mobile' && 'hidden'
        )}>
          {railBlocks.map(block => (
            <div key={block.id}>
              {block.component}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
