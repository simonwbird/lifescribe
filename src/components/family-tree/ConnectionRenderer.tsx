import React from 'react'
import { Heart } from 'lucide-react'
import type { LayoutNode, Marriage } from '@/utils/familyTreeLayoutEngine'

interface ConnectionRendererProps {
  nodes: LayoutNode[]
  marriages: Marriage[]
  personWidth: number
  personHeight: number
}

export function ConnectionRenderer({ 
  nodes, 
  marriages, 
  personWidth, 
  personHeight 
}: ConnectionRendererProps) {
  
  const renderParentChildConnections = () => {
    const connections: JSX.Element[] = []
    let connectionIndex = 0

    marriages.forEach(marriage => {
      if (marriage.children.length === 0) return

      const dropDistance = 50 // Distance to drop down from parents
      
      marriage.children.forEach(child => {
        const childNode = nodes.find(n => n.person.id === child.id)
        if (!childNode) return

        const connectionKey = `marriage-to-child-${marriage.id}-${child.id}-${connectionIndex++}`
        
        connections.push(
          <g key={connectionKey} className="parent-child-connection">
            {/* Vertical line down from marriage center */}
            <line
              x1={marriage.x}
              y1={marriage.y + personHeight}
              x2={marriage.x}
              y2={marriage.y + personHeight + dropDistance}
              stroke="#94A3B8"
              strokeWidth="2"
              className="transition-colors hover:stroke-blue-500"
            />
            {/* Horizontal line to child x-position */}
            <line
              x1={marriage.x}
              y1={marriage.y + personHeight + dropDistance}
              x2={childNode.x}
              y2={marriage.y + personHeight + dropDistance}
              stroke="#94A3B8"
              strokeWidth="2"
              className="transition-colors hover:stroke-blue-500"
            />
            {/* Vertical line down to child */}
            <line
              x1={childNode.x}
              y1={marriage.y + personHeight + dropDistance}
              x2={childNode.x}
              y2={childNode.y}
              stroke="#94A3B8"
              strokeWidth="2"
              className="transition-colors hover:stroke-blue-500"
            />
          </g>
        )
      })

      // Draw horizontal connector between siblings if multiple children
      if (marriage.children.length > 1) {
        const childNodes = marriage.children
          .map(child => nodes.find(n => n.person.id === child.id))
          .filter(Boolean) as LayoutNode[]
        
        if (childNodes.length > 1) {
          const minX = Math.min(...childNodes.map(n => n.x))
          const maxX = Math.max(...childNodes.map(n => n.x))
          const connectorY = marriage.y + personHeight + dropDistance
          
          connections.push(
            <line
              key={`sibling-connector-${marriage.id}-${connectionIndex++}`}
              x1={minX}
              y1={connectorY}
              x2={maxX}
              y2={connectorY}
              stroke="#94A3B8"
              strokeWidth="2"
              className="transition-colors hover:stroke-blue-500"
            />
          )
        }
      }
    })

    return connections
  }

  const renderSpouseConnections = () => {
    return marriages.filter(m => m.parentA && m.parentB).map((marriage) => (
      <g key={`spouse-connection-${marriage.id}`} className="spouse-connection">
        {/* Clean horizontal connection line between spouses */}
        <line
          x1={marriage.x - 50}
          y1={marriage.y + personHeight / 2}
          x2={marriage.x + 50}
          y2={marriage.y + personHeight / 2}
          stroke={marriage.branchColor}
          strokeWidth="4"
          className="transition-colors"
        />
        
        {/* Heart icon in center with subtle shadow */}
        <circle
          cx={marriage.x}
          cy={marriage.y + personHeight / 2}
          r="16"
          fill="white"
          stroke={marriage.branchColor}
          strokeWidth="3"
          className="drop-shadow-md"
        />
        
        {/* Heart icon */}
        <Heart
          x={marriage.x - 8}
          y={marriage.y + personHeight / 2 - 8}
          width={16}
          height={16}
          fill={marriage.branchColor}
          stroke="none"
        />
      </g>
    ))
  }

  return (
    <g className="family-tree-connections">
      {/* Render parent-child connections */}
      {renderParentChildConnections()}
      
      {/* Render spouse connections */}
      {renderSpouseConnections()}
    </g>
  )
}

export default ConnectionRenderer