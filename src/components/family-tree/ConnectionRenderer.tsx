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

    nodes.forEach(node => {
      node.children.forEach(child => {
        const childNode = nodes.find(n => n.person.id === child.id)
        if (!childNode) return

        // Check if this is a connection from a marriage
        const parentMarriage = marriages.find(m => 
          (m.parentA?.id === node.person.id || m.parentB?.id === node.person.id) &&
          m.children.some(c => c.id === child.id)
        )

        if (parentMarriage) {
          // Clean T-junction connection from marriage center to child
          const connectionKey = `marriage-child-${parentMarriage.id}-${child.id}`
          const dropDistance = 50 // Distance to drop down from parents
          
          connections.push(
            <g key={connectionKey} className="parent-child-connection">
              {/* Vertical line down from marriage center */}
              <line
                x1={parentMarriage.x}
                y1={parentMarriage.y + personHeight}
                x2={parentMarriage.x}
                y2={parentMarriage.y + personHeight + dropDistance}
                stroke="#94A3B8"
                strokeWidth="2"
                className="transition-colors hover:stroke-blue-500"
              />
              {/* Horizontal line to child x-position */}
              <line
                x1={parentMarriage.x}
                y1={parentMarriage.y + personHeight + dropDistance}
                x2={childNode.x}
                y2={parentMarriage.y + personHeight + dropDistance}
                stroke="#94A3B8"
                strokeWidth="2"
                className="transition-colors hover:stroke-blue-500"
              />
              {/* Vertical line down to child */}
              <line
                x1={childNode.x}
                y1={parentMarriage.y + personHeight + dropDistance}
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
    return marriages.filter(m => m.parentA && m.parentB).map((marriage) => (
      <g key={`spouse-${marriage.id}`} className="spouse-connection">
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
        const parentMarriage = marriages.find(m => {
          const parentIds = []
          if (m.parentA) parentIds.push(m.parentA.id)
          if (m.parentB) parentIds.push(m.parentB.id)
          const marriageKey = parentIds.sort().join('-')
          return marriageKey === parentKey
        })
        
        if (parentMarriage) {
          const minChildX = Math.min(...siblings.map(n => n.x))
          const maxChildX = Math.max(...siblings.map(n => n.x))
          const connectorY = parentMarriage.y + personHeight + 50
          
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