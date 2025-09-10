import React from 'react'
import { Heart } from 'lucide-react'
import type { LayoutNode, SpousePair } from '@/utils/familyTreeLayoutEngine'

interface ConnectionRendererProps {
  nodes: LayoutNode[]
  spousePairs: SpousePair[]
  personWidth: number
  personHeight: number
}

export function ConnectionRenderer({ 
  nodes, 
  spousePairs, 
  personWidth, 
  personHeight 
}: ConnectionRendererProps) {
  
  const renderParentChildConnections = () => {
    const connections: JSX.Element[] = []

    nodes.forEach(node => {
      node.children.forEach(child => {
        const childNode = nodes.find(n => n.person.id === child.id)
        if (!childNode) return

        // Check if this is a connection from a spouse pair
        const parentSpousePair = spousePairs.find(sp => 
          (sp.spouse1.id === node.person.id || sp.spouse2.id === node.person.id) &&
          sp.children.some(c => c.id === child.id)
        )

        if (parentSpousePair) {
          // Connection from spouse pair center to child
          const connectionKey = `spouse-child-${parentSpousePair.spouse1.id}-${parentSpousePair.spouse2.id}-${child.id}`
          
          connections.push(
            <g key={connectionKey}>
              {/* Vertical line down from spouse pair */}
              <line
                x1={parentSpousePair.x}
                y1={parentSpousePair.y + personHeight}
                x2={parentSpousePair.x}
                y2={parentSpousePair.y + personHeight + 40}
                stroke="#94A3B8"
                strokeWidth="2"
                className="transition-colors hover:stroke-blue-500"
              />
              {/* Horizontal line to child position */}
              <line
                x1={parentSpousePair.x}
                y1={parentSpousePair.y + personHeight + 40}
                x2={childNode.x}
                y2={parentSpousePair.y + personHeight + 40}
                stroke="#94A3B8"
                strokeWidth="2"
                className="transition-colors hover:stroke-blue-500"
              />
              {/* Vertical line down to child */}
              <line
                x1={childNode.x}
                y1={parentSpousePair.y + personHeight + 40}
                x2={childNode.x}
                y2={childNode.y}
                stroke="#94A3B8"
                strokeWidth="2"
                className="transition-colors hover:stroke-blue-500"
              />
            </g>
          )
        } else {
          // Direct parent-child connection
          const connectionKey = `parent-child-${node.person.id}-${child.id}`
          
          // Use smooth curved line for better aesthetics
          const midY = node.y + personHeight + (childNode.y - node.y - personHeight) / 2
          
          connections.push(
            <path
              key={connectionKey}
              d={`M ${node.x} ${node.y + personHeight} 
                  Q ${node.x} ${midY} ${childNode.x} ${childNode.y}`}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              className="transition-colors hover:stroke-blue-500"
            />
          )
        }
      })
    })

    return connections
  }

  const renderSpouseConnections = () => {
    return spousePairs.map((pair, index) => (
      <g key={`spouse-${pair.spouse1.id}-${pair.spouse2.id}`}>
        {/* Connection line between spouses */}
        <line
          x1={pair.x - pair.width / 4}
          y1={pair.y + personHeight / 2}
          x2={pair.x + pair.width / 4}
          y2={pair.y + personHeight / 2}
          stroke={pair.branchColor}
          strokeWidth="3"
          className="transition-colors"
        />
        
        {/* Heart icon in center */}
        <circle
          cx={pair.x}
          cy={pair.y + personHeight / 2}
          r="14"
          fill="white"
          stroke={pair.branchColor}
          strokeWidth="2"
          className="drop-shadow-sm"
        />
        
        {/* Heart icon */}
        <Heart
          x={pair.x - 8}
          y={pair.y + personHeight / 2 - 8}
          width={16}
          height={16}
          fill={pair.branchColor}
          stroke="none"
        />
      </g>
    ))
  }

  const renderMultiChildConnections = () => {
    const connections: JSX.Element[] = []

    // Group children by their parent pair or single parent
    spousePairs.forEach(pair => {
      if (pair.children.length > 1) {
        const childNodes = pair.children
          .map(child => nodes.find(n => n.person.id === child.id))
          .filter(Boolean) as LayoutNode[]

        if (childNodes.length > 1) {
          // Create horizontal connector for multiple children
          const minChildX = Math.min(...childNodes.map(n => n.x))
          const maxChildX = Math.max(...childNodes.map(n => n.x))
          const connectorY = pair.y + personHeight + 40

          connections.push(
            <line
              key={`multi-child-${pair.spouse1.id}-${pair.spouse2.id}`}
              x1={minChildX}
              y1={connectorY}
              x2={maxChildX}
              y2={connectorY}
              stroke="#94A3B8"
              strokeWidth="2"
              strokeDasharray="5,3"
              className="transition-colors hover:stroke-blue-500"
            />
          )
        }
      }
    })

    return connections
  }

  return (
    <g className="family-tree-connections">
      {/* Render parent-child connections */}
      {renderParentChildConnections()}
      
      {/* Render spouse connections */}
      {renderSpouseConnections()}
      
      {/* Render multi-child connectors */}
      {renderMultiChildConnections()}
    </g>
  )
}

export default ConnectionRenderer