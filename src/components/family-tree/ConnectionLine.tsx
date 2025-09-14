import React, { useState } from 'react'
import { X } from 'lucide-react'

interface ConnectionLineProps {
  from: { x: number; y: number }
  to: { x: number; y: number }
  type: 'parent' | 'spouse' | 'child' | 'divorced'
  isHighlighted?: boolean
  relationshipId?: string
  onDelete?: (relationshipId: string) => void
  allRelationships?: Array<{
    id: string
    from_person_id: string
    to_person_id: string
    relationship_type: 'parent' | 'spouse' | 'child' | 'divorced'
  }>
  allPositions?: Record<string, { x: number; y: number }>
}

export default function ConnectionLine({ 
  from, 
  to, 
  type, 
  isHighlighted = false, 
  relationshipId, 
  onDelete,
  allRelationships = [],
  allPositions = {}
}: ConnectionLineProps) {
  const [isHovered, setIsHovered] = useState(false)
  // Card dimensions for connection points
  const CARD_WIDTH = 208 // 52 * 4 (w-52 in Tailwind)
  const CARD_HEIGHT = 120 // Approximate card height

  // Calculate connection points on card edges
  const getConnectionPoints = () => {
    const fromCenter = { x: from.x + CARD_WIDTH / 2, y: from.y + CARD_HEIGHT / 2 }
    const toCenter = { x: to.x + CARD_WIDTH / 2, y: to.y + CARD_HEIGHT / 2 }
    
    let startPoint = { ...fromCenter }
    let endPoint = { ...toCenter }

    if (type === 'parent' || type === 'child') {
      // Parent-child connections: from bottom of parent to top of child
      if (from.y < to.y) {
        // Parent to child
        startPoint = { x: from.x + CARD_WIDTH / 2, y: from.y + CARD_HEIGHT }
        endPoint = { x: to.x + CARD_WIDTH / 2, y: to.y }
      } else {
        // Child to parent
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

  // Check if this parent-child connection should use T-intersection
  const shouldUseTIntersection = () => {
    if (type !== 'parent' || !allRelationships || !allPositions) return false
    
    // Get the relationship details
    const currentRel = allRelationships.find(r => r.id === relationshipId)
    if (!currentRel) return false
    
    const parentId = currentRel.from_person_id
    const childId = currentRel.to_person_id
    
    // Find if this parent has a spouse or ex-spouse
    const spouseRel = allRelationships.find(r => 
      (r.relationship_type === 'spouse' || r.relationship_type === 'divorced') && 
      (r.from_person_id === parentId || r.to_person_id === parentId)
    )
    
    if (!spouseRel) return false
    
    const spouseId = spouseRel.from_person_id === parentId ? spouseRel.to_person_id : spouseRel.from_person_id
    const spousePos = allPositions[spouseId]
    
    if (!spousePos) return false
    
    // Check if spouse is also parent to this child
    const spouseParentRel = allRelationships.find(r =>
      r.relationship_type === 'parent' &&
      r.from_person_id === spouseId &&
      r.to_person_id === childId
    )
    
    return !!spouseParentRel
  }

  const getTIntersectionPath = () => {
    if (!allRelationships || !allPositions) return createPath()
    
    const currentRel = allRelationships.find(r => r.id === relationshipId)
    if (!currentRel) return createPath()
    
    const parentId = currentRel.from_person_id
    const childId = currentRel.to_person_id
    
    // Find spouse or ex-spouse
    const spouseRel = allRelationships.find(r => 
      (r.relationship_type === 'spouse' || r.relationship_type === 'divorced') && 
      (r.from_person_id === parentId || r.to_person_id === parentId)
    )
    
    if (!spouseRel) return createPath()
    
    const spouseId = spouseRel.from_person_id === parentId ? spouseRel.to_person_id : spouseRel.from_person_id
    const spousePos = allPositions[spouseId]
    const parentPos = allPositions[parentId]
    const childPos = allPositions[childId]
    
    if (!spousePos || !parentPos || !childPos) return createPath()
    
    // Calculate T-intersection point (middle of marriage line)
    const leftParent = parentPos.x < spousePos.x ? parentPos : spousePos
    const rightParent = parentPos.x < spousePos.x ? spousePos : parentPos
    
    const marriageStartX = leftParent.x + CARD_WIDTH
    const marriageEndX = rightParent.x
    const marriageY = leftParent.y + CARD_HEIGHT / 2
    
    const tIntersectionX = (marriageStartX + marriageEndX) / 2
    const tIntersectionY = marriageY
    
    // Path from T-intersection to child
    const verticalLineLength = 100 // Increased for clearer parent-child hierarchy
    const childConnectionY = childPos.y
    const childConnectionX = childPos.x + CARD_WIDTH / 2
    
    return `M ${tIntersectionX} ${tIntersectionY} 
            L ${tIntersectionX} ${tIntersectionY + verticalLineLength}
            L ${childConnectionX} ${tIntersectionY + verticalLineLength}
            L ${childConnectionX} ${childConnectionY}`
  }

  // Create path - with T-intersection for children of married parents
  const createPath = () => {
    if (type === 'spouse') {
      // Straight horizontal line for spouse connections
      return `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`
    } else if (shouldUseTIntersection()) {
      return getTIntersectionPath()
    } else {
      // L-shaped path for parent/child connections
      const midY = startPoint.y + (endPoint.y - startPoint.y) / 2
      
      return `M ${startPoint.x} ${startPoint.y} 
              L ${startPoint.x} ${midY} 
              L ${endPoint.x} ${midY} 
              L ${endPoint.x} ${endPoint.y}`
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
      case 'divorced':
        return {
          ...baseStyle,
          stroke: isHighlighted ? '#9ca3af' : '#6b7280',
          strokeDasharray: '12 6 2 6'
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

  // Calculate midpoint for delete button
  const midX = (startPoint.x + endPoint.x) / 2
  const midY = (startPoint.y + endPoint.y) / 2

  const handleDelete = () => {
    if (relationshipId && onDelete) {
      onDelete(relationshipId)
    }
  }

  return (
    <div 
      className="absolute top-0 left-0 z-10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        className="absolute top-0 left-0 pointer-events-auto"
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

        {/* Invisible thicker line for easier hover detection */}
        <path
          d={createPath()}
          style={{
            ...getLineStyle(),
            strokeWidth: 15,
            stroke: 'transparent',
            transform: `translate(${-minX}px, ${-minY}px)`,
          }}
          className="cursor-pointer"
        />

        {/* Visible line */}
        <path
          d={createPath()}
          style={{
            ...getLineStyle(),
            transform: `translate(${-minX}px, ${-minY}px)`,
            filter: isHighlighted ? `url(#glow-${type})` : 'none',
            markerEnd: type !== 'spouse' && type !== 'divorced' ? `url(#arrow-${type})` : 'none'
          }}
          className={`transition-all duration-200 ${isHighlighted ? 'drop-shadow-lg' : ''} pointer-events-none`}
        />

        {/* Connection type label */}
        {isHighlighted && (
          <text
            x={width / 2}
            y={height / 2 - 10}
            textAnchor="middle"
            className="fill-gray-700 text-xs font-medium pointer-events-none"
            style={{ transform: `translate(${-minX}px, ${-minY}px)` }}
          >
            {type === 'parent' ? 'parent' : type === 'spouse' ? 'married' : type === 'divorced' ? 'divorced' : type}
          </text>
        )}
      </svg>

      {/* Delete button */}
      {isHovered && onDelete && relationshipId && (
        <button
          onClick={handleDelete}
          className="absolute bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-all duration-200 transform hover:scale-110 z-20"
          style={{
            left: minX + width / 2 - 10,
            top: minY + height / 2 - 10,
          }}
          title="Delete relationship"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}