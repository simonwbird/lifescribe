import React from 'react'
import type { TreeNode, Relationship } from '@/lib/familyTreeTypes'

interface FamilyTreeConnectionsProps {
  nodes: TreeNode[]
  relationships: Relationship[]
  nodePositions: Record<string, { x: number; y: number }>
}

export default function FamilyTreeConnections({ 
  nodes, 
  relationships, 
  nodePositions 
}: FamilyTreeConnectionsProps) {
  
  const getNodePosition = (nodeId: string) => {
    const position = nodePositions[nodeId]
    if (position) {
      // Return center of the node card (assuming 192px width, 96px height)
      return {
        x: position.x + 96, // Half of card width (w-48 = 192px)
        y: position.y + 48  // Half of estimated card height
      }
    }
    return null
  }

  const renderConnectionLine = (fromId: string, toId: string, relationship: 'parent' | 'spouse' | 'divorced' | 'unmarried' | 'child' | 'sibling' | 'brother' | 'sister' | 'grandparent' | 'grandmother' | 'grandfather' | 'grandchild' | 'grandson' | 'granddaughter' | 'aunt' | 'uncle' | 'niece' | 'nephew' | 'cousin') => {
    const fromPos = getNodePosition(fromId)
    const toPos = getNodePosition(toId)
    
    if (!fromPos || !toPos) return null

    // Map extended relationship types to visual connection types
    const getVisualType = (relType: typeof relationship): 'parent' | 'spouse' | 'divorced' | 'unmarried' => {
      switch (relType) {
        case 'spouse':
          return 'spouse'
        case 'divorced':
          return 'divorced'
        case 'unmarried':
          return 'unmarried'
        case 'parent':
        case 'child':
        case 'grandparent':
        case 'grandmother':
        case 'grandfather':
        case 'grandchild':
        case 'grandson':
        case 'granddaughter':
          return 'parent'  // All hierarchical relationships use parent-style lines
        case 'sibling':
        case 'brother':
        case 'sister':
        case 'aunt':
        case 'uncle':
        case 'niece':
        case 'nephew':
        case 'cousin':
          return 'unmarried'  // Lateral relationships use unmarried-style lines
        default:
          return 'unmarried'
      }
    }

    const visualType = getVisualType(relationship)
    const strokeColor = visualType === 'spouse' 
      ? 'stroke-pink-400' 
      : visualType === 'divorced'
      ? 'stroke-gray-400'
      : visualType === 'unmarried'
      ? 'stroke-pink-200'
      : 'stroke-blue-400'
    
    const strokeWidth = visualType === 'spouse' || visualType === 'divorced' || visualType === 'unmarried' ? '3' : '2'
    const key = `${fromId}-${toId}-${relationship}`

    // Different line styles based on visual relationship type
    if (visualType === 'spouse' || visualType === 'divorced' || visualType === 'unmarried') {
      // Straight line for spouses and lateral relationships
      return (
        <line
          key={key}
          x1={fromPos.x}
          y1={fromPos.y}
          x2={toPos.x}
          y2={toPos.y}
          className={`${strokeColor} stroke-2`}
          strokeDasharray={visualType === 'spouse' ? '5,5' : visualType === 'divorced' ? '10,5,2,5' : visualType === 'unmarried' ? '2,2' : 'none'}
        />
      )
    } else if (visualType === 'parent') {
      // L-shaped line for parent-child relationships
      const midY = fromPos.y + (toPos.y - fromPos.y) / 2
      
      return (
        <g key={key}>
          {/* Vertical line from parent down */}
          <line
            x1={fromPos.x}
            y1={fromPos.y}
            x2={fromPos.x}
            y2={midY}
            className={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Horizontal line across */}
          <line
            x1={fromPos.x}
            y1={midY}
            x2={toPos.x}
            y2={midY}
            className={strokeColor}
            strokeWidth={strokeWidth}
          />
          {/* Vertical line down to child */}
          <line
            x1={toPos.x}
            y1={midY}
            x2={toPos.x}
            y2={toPos.y}
            className={strokeColor}
            strokeWidth={strokeWidth}
          />
        </g>
      )
    }
  }

  // Calculate SVG dimensions based on node positions
  const allPositions = Object.values(nodePositions)
  if (allPositions.length === 0) return null
  
  const minX = Math.min(...allPositions.map(p => p.x)) - 100
  const maxX = Math.max(...allPositions.map(p => p.x)) + 300
  const minY = Math.min(...allPositions.map(p => p.y)) - 100
  const maxY = Math.max(...allPositions.map(p => p.y)) + 300
  
  const width = maxX - minX
  const height = maxY - minY

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-0"
      style={{
        width: width,
        height: height,
        left: minX,
        top: minY
      }}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Grid background */}
      <defs>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      
      {/* Connection lines */}
      <g transform={`translate(${-minX}, ${-minY})`}>
        {relationships.map(rel => 
          renderConnectionLine(
            rel.relationship_type === 'parent' ? rel.to_person_id : rel.from_person_id,
            rel.relationship_type === 'parent' ? rel.from_person_id : rel.to_person_id,
            rel.relationship_type
          )
        )}
      </g>
    </svg>
  )
}