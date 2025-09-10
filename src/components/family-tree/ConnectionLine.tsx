import React from 'react'

interface ConnectionLineProps {
  from: { x: number; y: number }
  to: { x: number; y: number }
  type: 'parent' | 'spouse' | 'child'
  isHighlighted?: boolean
}

export default function ConnectionLine({ from, to, type, isHighlighted = false }: ConnectionLineProps) {
  // Card dimensions for connection points
  const CARD_WIDTH = 208 // 52 * 4 (w-52 in Tailwind)
  const CARD_HEIGHT = 120 // Approximate card height

  // Calculate connection points on card edges
  const getConnectionPoints = () => {
    const fromCenter = { x: from.x + CARD_WIDTH / 2, y: from.y + CARD_HEIGHT / 2 }
    const toCenter = { x: to.x + CARD_WIDTH / 2, y: to.y + CARD_HEIGHT / 2 }
    
    let startPoint = { ...fromCenter }
    let endPoint = { ...toCenter }

    if (type === 'parent') {
      // Parent connections: from bottom of parent to top of child
      if (from.y < to.y) {
        startPoint = { x: from.x + CARD_WIDTH / 2, y: from.y + CARD_HEIGHT }
        endPoint = { x: to.x + CARD_WIDTH / 2, y: to.y }
      } else {
        startPoint = { x: from.x + CARD_WIDTH / 2, y: from.y }
        endPoint = { x: to.x + CARD_WIDTH / 2, y: to.y + CARD_HEIGHT }
      }
    } else if (type === 'spouse') {
      // Spouse connections: side to side
      if (from.x < to.x) {
        startPoint = { x: from.x + CARD_WIDTH, y: from.y + CARD_HEIGHT / 2 }
        endPoint = { x: to.x, y: to.y + CARD_HEIGHT / 2 }
      } else {
        startPoint = { x: from.x, y: from.y + CARD_HEIGHT / 2 }
        endPoint = { x: to.x + CARD_WIDTH, y: to.y + CARD_HEIGHT / 2 }
      }
    }

    return { startPoint, endPoint }
  }

  const { startPoint, endPoint } = getConnectionPoints()

  // Create smooth curved path
  const createPath = () => {
    const dx = endPoint.x - startPoint.x
    const dy = endPoint.y - startPoint.y
    
    if (type === 'spouse') {
      // Straight line for spouses
      return `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`
    } else {
      // Curved line for parent-child relationships
      const controlPoint1 = {
        x: startPoint.x,
        y: startPoint.y + dy * 0.5
      }
      const controlPoint2 = {
        x: endPoint.x,
        y: endPoint.y - dy * 0.5
      }

      return `M ${startPoint.x} ${startPoint.y} 
              C ${controlPoint1.x} ${controlPoint1.y}, 
                ${controlPoint2.x} ${controlPoint2.y}, 
                ${endPoint.x} ${endPoint.y}`
    }
  }

  const getLineStyle = () => {
    const baseStyle = {
      fill: 'none',
      strokeWidth: isHighlighted ? 3 : 2,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
    }

    switch (type) {
      case 'parent':
        return {
          ...baseStyle,
          stroke: isHighlighted ? '#3b82f6' : '#6b7280',
          strokeDasharray: 'none'
        }
      case 'spouse':
        return {
          ...baseStyle,
          stroke: isHighlighted ? '#ec4899' : '#f59e0b',
          strokeDasharray: '8 4'
        }
      default:
        return {
          ...baseStyle,
          stroke: isHighlighted ? '#10b981' : '#6b7280'
        }
    }
  }

  // Calculate SVG viewBox to contain the entire line
  const minX = Math.min(startPoint.x, endPoint.x) - 10
  const minY = Math.min(startPoint.y, endPoint.y) - 10
  const maxX = Math.max(startPoint.x, endPoint.x) + 10
  const maxY = Math.max(startPoint.y, endPoint.y) + 10
  
  const width = maxX - minX
  const height = maxY - minY

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none z-0"
      style={{
        left: minX,
        top: minY,
        width: width,
        height: height,
      }}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        {/* Glow effect for highlighted lines */}
        {isHighlighted && (
          <filter id={`glow-${type}`}>
            <feMorphology operator="dilate" radius="1"/>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/> 
            </feMerge>
          </filter>
        )}
        
        {/* Arrow markers */}
        <defs>
          <marker
            id={`arrow-${type}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="3"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path
              d="M0,0 L0,6 L9,3 z"
              fill={isHighlighted ? (type === 'spouse' ? '#ec4899' : '#3b82f6') : '#6b7280'}
            />
          </marker>
        </defs>
      </defs>

      <path
        d={createPath()}
        style={{
          ...getLineStyle(),
          transform: `translate(${-minX}px, ${-minY}px)`,
          filter: isHighlighted ? `url(#glow-${type})` : 'none',
          markerEnd: type !== 'spouse' ? `url(#arrow-${type})` : 'none'
        }}
        className={`transition-all duration-200 ${isHighlighted ? 'drop-shadow-lg' : ''}`}
      />

      {/* Connection type label */}
      {isHighlighted && (
        <text
          x={width / 2}
          y={height / 2 - 10}
          textAnchor="middle"
          className="fill-gray-700 text-xs font-medium"
          style={{ transform: `translate(${-minX}px, ${-minY}px)` }}
        >
          {type === 'parent' ? 'parent' : type === 'spouse' ? 'married' : type}
        </text>
      )}
    </svg>
  )
}