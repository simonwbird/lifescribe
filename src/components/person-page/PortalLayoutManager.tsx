import React, { ReactNode, useMemo, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Breakpoint } from '@/hooks/useBreakpoint'
import { BlockValidator, getBlockMetadata } from '@/lib/blockRegistry'
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
  // Initialize block validator
  const validatorRef = useRef<BlockValidator>(new BlockValidator())

  // Reset validator on blocks change
  useEffect(() => {
    validatorRef.current.reset()
  }, [blocks])

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

  const mainBlockIds = useMemo(() => {
    // Get all blocks that should be in main based on layout
    const mainIds = currentLayout.main.filter(id => 
      blocks.some(b => b.id === id)
    )
    
    // Determine effective rail IDs (fallback to defaults if rail config is empty)
    const fallbackRail = currentLayout.rail.length === 0
      ? DEFAULT_LAYOUT_MAP[breakpoint].rail
      : currentLayout.rail

    // Add any unplaced blocks to main
    const placedIds = new Set([...mainIds, ...fallbackRail])
    const unplacedIds = logicalOrder.filter(blockId => !placedIds.has(blockId))
    
    return [...mainIds, ...unplacedIds]
  }, [currentLayout.main, currentLayout.rail, logicalOrder, blocks, breakpoint])

  const railBlockIds = useMemo(() => {
    const useDefault = currentLayout.rail.length === 0
    const source = useDefault ? DEFAULT_LAYOUT_MAP[breakpoint].rail : currentLayout.rail
    if (useDefault) {
      console.warn('[PortalLayoutManager] Empty rail config detected; falling back to DEFAULT_LAYOUT_MAP for', breakpoint)
    }
    return source.filter(id => blocks.some(b => b.id === id))
  }, [currentLayout.rail, blocks, breakpoint])

  // Debugging: log layout computation to help identify why rail may be empty in preview
  useEffect(() => {
    try {
      // Avoid noisy logs in production; this is harmless during debugging
      // eslint-disable-next-line no-console
      console.debug('[PortalLayoutManager] Debug', {
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
   * Render a block with singleton validation and semantic HTML
   */
  const renderBlock = (blockId: string) => {
    const component = blockMap.get(blockId)
    if (!component) return null

    // Validate singleton rules
    if (!validatorRef.current.canRender(blockId)) {
      return null // Drop duplicate singleton
    }

    // Register the block as rendered
    validatorRef.current.registerBlock(blockId)

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
    <div className={cn('md:grid md:grid-cols-12 md:gap-6', className)}>
      {/* Main content column - semantic main landmark */}
      <main 
        id="portal-main" 
        className="md:col-span-8 space-y-6"
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
          'md:col-span-4 space-y-4'
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
