import React, { ReactNode, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
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

interface PortalLayoutManagerProps {
  blocks: BlockItem[]
  layoutMap: LayoutMap
  breakpoint: Breakpoint
  className?: string
}

/**
 * PortalLayoutManager uses React Portals to teleport blocks between containers
 * Each block is rendered once and mounted into #main or #rail based on breakpoint
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

  // Get the current layout configuration
  const currentLayout = layoutMap[breakpoint]

  // Distribute block IDs into main and rail
  const mainBlockIds = useMemo(() => {
    const placedIds = new Set([...currentLayout.main, ...currentLayout.rail])
    const unplacedIds = blocks
      .filter(block => !placedIds.has(block.id))
      .map(block => block.id)
    
    return [...currentLayout.main, ...unplacedIds]
  }, [currentLayout.main, currentLayout.rail, blocks])

  const railBlockIds = useMemo(() => {
    return currentLayout.rail
  }, [currentLayout.rail])

  // Create portal containers
  useEffect(() => {
    const mainContainer = document.getElementById('portal-main')
    const railContainer = document.getElementById('portal-rail')

    if (!mainContainer || !railContainer) {
      console.warn('Portal containers not found')
    }
  }, [])

  return (
    <div className={cn('lg:grid lg:grid-cols-12 lg:gap-6', className)}>
      {/* Main content column */}
      <div 
        id="portal-main" 
        className="lg:col-span-8 space-y-6"
        data-portal-container="main"
      >
        {mainBlockIds.map(blockId => {
          const component = blockMap.get(blockId)
          if (!component) return null
          
          return (
            <div key={blockId} data-block-id={blockId}>
              {component}
            </div>
          )
        })}
      </div>

      {/* Right rail column */}
      <div 
        id="portal-rail"
        className={cn(
          'lg:col-span-4 space-y-4',
          railBlockIds.length === 0 && 'hidden'
        )}
        data-portal-container="rail"
      >
        {railBlockIds.map(blockId => {
          const component = blockMap.get(blockId)
          if (!component) return null
          
          return (
            <div key={blockId} data-block-id={blockId}>
              {component}
            </div>
          )
        })}
      </div>
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
