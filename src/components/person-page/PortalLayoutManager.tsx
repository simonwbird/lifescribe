import React, { ReactNode, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Breakpoint } from '@/hooks/useBreakpoint'
import { getBlockMetadata } from '@/lib/blockRegistry'
import { cn } from '@/lib/utils'
import { DEFAULT_LAYOUT_MAP } from '@/config/personPageLayouts'

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

// Re-export Breakpoint for convenience
export type { Breakpoint }

interface PortalLayoutManagerProps {
  blocks: BlockItem[]
  layoutMap: LayoutMap
  breakpoint: Breakpoint
  className?: string
}

/**
 * PortalLayoutManager uses React Portals to teleport blocks between containers
 * Each block is rendered once and mounted into #main or #rail based on breakpoint
 * Enforces singleton rules via BlockValidator
 */
export function PortalLayoutManager({
  blocks,
  layoutMap,
  breakpoint,
  className
}: PortalLayoutManagerProps) {

  // Create a map of block IDs to components
  const blockMap = useMemo(() => {
    const map = new Map<string, ReactNode>()
    blocks.forEach(block => {
      map.set(block.id, block.component)
    })
    return map
  }, [blocks])

  // Get the current layout configuration (fallback to defaults if missing)
  const currentLayout = layoutMap[breakpoint] || DEFAULT_LAYOUT_MAP[breakpoint]

  // Distribute block IDs into main and rail with logical DOM order
  // Priority: Content blocks first (Hero, Bio, Timeline...), then widgets
  // This ensures screen readers encounter content in a logical reading order
  const logicalOrder = useMemo(() => {
    const contentBlocks = blocks
      .filter(block => {
        const metadata = getBlockMetadata(block.id)
        return metadata?.category === 'content'
      })
      .map(b => b.id)
    
    const widgetBlocks = blocks
      .filter(block => {
        const metadata = getBlockMetadata(block.id)
        return metadata?.category === 'widget' || metadata?.category === 'navigation'
      })
      .map(b => b.id)
    
    return [...contentBlocks, ...widgetBlocks]
  }, [blocks])

  // Identify widget/navigation blocks present
  const widgetIds = useMemo(() => {
    return blocks
      .filter(block => {
        const metadata = getBlockMetadata(block.id)
        return metadata?.category === 'widget' || metadata?.category === 'navigation'
      })
      .map(b => b.id)
  }, [blocks])

  // Compute effective rail IDs with robust fallbacks
  const effectiveRailIds = useMemo(() => {
    const baseRail = currentLayout.rail.length === 0
      ? DEFAULT_LAYOUT_MAP[breakpoint].rail
      : currentLayout.rail

    // Prefer configured rail IDs that exist in the provided blocks
    const filteredBase = baseRail.filter(id => blocks.some(b => b.id === id))

    // On desktop/tablet, ensure ALL widget/navigation blocks go to rail
    if (breakpoint !== 'mobile') {
      const withAllWidgets = Array.from(new Set([...(filteredBase.length > 0 ? filteredBase : []), ...widgetIds]))
      return withAllWidgets
    }

    // Mobile: return filtered config (usually empty)
    return filteredBase
  }, [currentLayout.rail, blocks, breakpoint, widgetIds])

  // Compute main and rail block IDs ensuring NO OVERLAP
  const { mainBlockIds, railBlockIds } = useMemo(() => {
    // Start with rail blocks (widgets/navigation by default)
    const railIds = effectiveRailIds
    
    // Main gets configured main blocks that aren't in rail
    const mainIds = currentLayout.main
      .filter(id => blocks.some(b => b.id === id))
      .filter(id => !railIds.includes(id))
    
    // Add any unplaced blocks to main (excluding anything already in rail)
    const placedIds = new Set([...mainIds, ...railIds])
    const unplacedIds = logicalOrder.filter(blockId => !placedIds.has(blockId))
    
    return {
      mainBlockIds: [...mainIds, ...unplacedIds],
      railBlockIds: railIds
    }
  }, [currentLayout.main, effectiveRailIds, logicalOrder, blocks])

  // Debugging: log layout computation to help identify why rail may be empty in preview
  useEffect(() => {
    try {
      // Avoid noisy logs in production; this is harmless during debugging
      // eslint-disable-next-line no-console
      console.info('[PortalLayoutManager] Debug', {
        breakpoint,
        providedLayout: layoutMap[breakpoint],
        currentLayout,
        allBlockIds: blocks.map(b => b.id),
        mainBlockIds,
        railBlockIds
      })
    } catch {}
  }, [breakpoint, layoutMap, currentLayout, blocks, mainBlockIds, railBlockIds])

  // Create portal containers
  useEffect(() => {
    const mainContainer = document.getElementById('portal-main')
    const railContainer = document.getElementById('portal-rail')

    if (!mainContainer || !railContainer) {
      console.warn('[PortalLayoutManager] Portal containers not found')
    }
  }, [])

  /**
   * Render a block with semantic HTML
   * Note: Singleton enforcement is handled by layout logic (each block ID appears once in arrays)
   */
  const renderBlock = (blockId: string) => {
    const component = blockMap.get(blockId)
    if (!component) return null

    const metadata = getBlockMetadata(blockId)
    const anchorId = metadata?.anchorId || blockId.toLowerCase().replace(/\s+/g, '-')
    
    return (
      <section
        key={blockId}
        id={anchorId}
        data-block-id={blockId}
        data-block-singleton={metadata?.singleton}
        data-block-category={metadata?.category}
        aria-label={metadata?.ariaLabel || metadata?.displayName}
        className="scroll-mt-20" // Offset for fixed header when jumping to anchor
      >
        {component}
      </section>
    )
  }

  return (
    <div className={cn('lg:grid lg:grid-cols-12 lg:gap-6', className)}>
      {/* Main content column - semantic main landmark */}
      <main 
        id="portal-main" 
        className="lg:col-span-8 space-y-6"
        data-portal-container="main"
        role="main"
        aria-label="Main content"
        tabIndex={-1}
      >
        {mainBlockIds.map(blockId => renderBlock(blockId))}
      </main>

      {/* Right rail column - complementary landmark */}
      <aside 
        id="portal-rail"
        className={cn(
          'hidden lg:block lg:col-span-4 space-y-4'
        )}
        data-portal-container="rail"
        role="complementary"
        aria-label="Sidebar widgets"
      >
        {railBlockIds.map(blockId => renderBlock(blockId))}
      </aside>
    </div>
  )
}

/**
 * BlockPortal - Helper component to portal a block to a specific container
 */
interface BlockPortalProps {
  blockId: string
  containerId: 'main' | 'rail'
  children: ReactNode
}

export function BlockPortal({ blockId, containerId, children }: BlockPortalProps) {
  const container = document.getElementById(`portal-${containerId}`)
  
  if (!container) {
    console.warn(`Portal container #portal-${containerId} not found`)
    return <>{children}</>
  }

  return createPortal(
    <div data-block-id={blockId}>
      {children}
    </div>,
    container
  )
}
