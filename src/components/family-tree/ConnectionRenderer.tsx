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
          // Clean T-junction connection from spouse pair center to child
          const connectionKey = `spouse-child-${parentSpousePair.spouse1.id}-${parentSpousePair.spouse2.id}-${child.id}`
          const dropDistance = 50 // Distance to drop down from parents
          
          connections.push(
            <g key={connectionKey} className="parent-child-connection">
              {/* Vertical line down from spouse pair center */}
              <line
                x1={parentSpousePair.x}
                y1={parentSpousePair.y + personHeight}
                x2={parentSpousePair.x}
                y2={parentSpousePair.y + personHeight + dropDistance}
                stroke="#94A3B8"
                strokeWidth="2"
                className="transition-colors hover:stroke-blue-500"
              />
              {/* Horizontal line to child x-position */}
              <line
                x1={parentSpousePair.x}
                y1={parentSpousePair.y + personHeight + dropDistance}
                x2={childNode.x}
                y2={parentSpousePair.y + personHeight + dropDistance}
                stroke="#94A3B8"
                strokeWidth="2"
                className="transition-colors hover:stroke-blue-500"
              />
              {/* Vertical line down to child */}
              <line
                x1={childNode.x}
                y1={parentSpousePair.y + personHeight + dropDistance}
                x2={childNode.x}
                y2={childNode.y}
                stroke="#94A3B8"
                strokeWidth="2"
                className="transition-colors hover:stroke-blue-500"
              />
            </g>
          )
        } else {
          // Direct parent-child connection for single parents
          const connectionKey = `parent-child-${node.person.id}-${child.id}`
          const dropDistance = 30
          
          connections.push(
            <g key={connectionKey} className="single-parent-child-connection">
              {/* Vertical line down from parent */}
              <line
                x1={node.x}
                y1={node.y + personHeight}
                x2={node.x}
                y2={node.y + personHeight + dropDistance}
                stroke="#94A3B8"
                strokeWidth="2"
                className="transition-colors hover:stroke-blue-500"
              />
              {/* Horizontal line to child */}
              <line
                x1={node.x}
                y1={node.y + personHeight + dropDistance}
                x2={childNode.x}
                y2={node.y + personHeight + dropDistance}
                stroke="#94A3B8"
                strokeWidth="2"
                className="transition-colors hover:stroke-blue-500"
              />
              {/* Vertical line down to child */}
              <line
                x1={childNode.x}
                y1={node.y + personHeight + dropDistance}
                x2={childNode.x}
                y2={childNode.y}
                stroke="#94A3B8"
                strokeWidth="2"
                className="transition-colors hover:stroke-blue-500"
              />
            </g>
          )
        }
      })
    })

    return connections
  }

  const renderSpouseConnections = () => {
    return spousePairs.map((pair, index) => (
      <g key={`spouse-${pair.spouse1.id}-${pair.spouse2.id}`} className="spouse-connection">
        {/* Clean horizontal connection line between spouses */}
        <line
          x1={pair.x - pair.width / 4}
          y1={pair.y + personHeight / 2}
          x2={pair.x + pair.width / 4}
          y2={pair.y + personHeight / 2}
          stroke={pair.branchColor}
          strokeWidth="4"
          className="transition-colors"
        />
        
        {/* Heart icon in center with subtle shadow */}
        <circle
          cx={pair.x}
          cy={pair.y + personHeight / 2}
          r="16"
          fill="white"
          stroke={pair.branchColor}
          strokeWidth="3"
          className="drop-shadow-md"
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
    
    // Create horizontal connectors for siblings from the same parents
    const siblingGroups = new Map<string, LayoutNode[]>()
    
    nodes.forEach(node => {
      if (node.parents.length > 0) {
        const parentKey = node.parents.map(p => p.id).sort().join('-')
        if (!siblingGroups.has(parentKey)) {
          siblingGroups.set(parentKey, [])
        }
        siblingGroups.get(parentKey)!.push(node)
      }
    })

    siblingGroups.forEach((siblings, parentKey) => {
      if (siblings.length > 1) {
        // Find the parent connection point
        const parentSpousePair = spousePairs.find(sp => {
          const spouseIds = [sp.spouse1.id, sp.spouse2.id].sort().join('-')
          return spouseIds === parentKey
        })
        
        if (parentSpousePair) {
          const minChildX = Math.min(...siblings.map(n => n.x))
          const maxChildX = Math.max(...siblings.map(n => n.x))
          const connectorY = parentSpousePair.y + personHeight + 50
          
          // Only draw horizontal connector if there are multiple children
          if (minChildX !== maxChildX) {
            connections.push(
              <line
                key={`sibling-connector-${parentKey}`}
                x1={minChildX}
                y1={connectorY}
                x2={maxChildX}
                y2={connectorY}
                stroke="#94A3B8"
                strokeWidth="2"
                className="transition-colors hover:stroke-blue-500"
              />
            )
          }
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