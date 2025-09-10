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

      // Calculate the true center between spouses for child connections
      const spouseANode = nodes.find(n => n.person.id === marriage.parentA?.id)
      const spouseBNode = nodes.find(n => n.person.id === marriage.parentB?.id)
      
      if (!spouseANode || !spouseBNode) return
      
      const spouseAX = spouseANode.x + personWidth / 2
      const spouseBX = spouseBNode.x + personWidth / 2
      const spouseY = spouseANode.y + personHeight / 2
      const centerX = (spouseAX + spouseBX) / 2

      const drop = 50 // vertical down from union bar to the sibling bar

      // Build child nodes list once
      const childNodes = marriage.children
        .map(c => nodes.find(n => n.person.id === c.id))
        .filter(Boolean) as LayoutNode[]

      if (childNodes.length === 0) return

      // Horizontal bar Y level
      const barY = spouseY + drop

      // 1) Vertical from heart center down to the sibling bar
      connections.push(
        <line
          key={`union-drop-${marriage.id}`}
          x1={centerX}
          y1={spouseY + 12} // Start just below the heart
          x2={centerX}
          y2={barY}
          stroke="#94A3B8"
          strokeWidth="2"
          className="transition-colors hover:stroke-blue-500"
        />
      )

      // 2) If multiple children, draw the sibling bar
      if (childNodes.length > 1) {
        const minCenter = Math.min(...childNodes.map(n => n.x + personWidth / 2))
        const maxCenter = Math.max(...childNodes.map(n => n.x + personWidth / 2))
        connections.push(
          <line
            key={`sibling-bar-${marriage.id}`}
            x1={minCenter}
            y1={barY}
            x2={maxCenter}
            y2={barY}
            stroke="#94A3B8"
            strokeWidth="2"
          />
        )
      }

      // 3) Drops from sibling bar to each child top center
      childNodes.forEach((cn, idx) => {
        const cx = cn.x + personWidth / 2
        connections.push(
          <line
            key={`child-drop-${marriage.id}-${cn.person.id}-${idx}`}
            x1={cx}
            y1={barY}
            x2={cx}
            y2={cn.y}
            stroke="#94A3B8"
            strokeWidth="2"
          />
        )
      })
    })

    return connections
  }

  const renderSpouseConnections = () => {
    const elements = marriages
      .filter(m => m.explicit && m.parentA && m.parentB) // only explicit marriages
      .map((marriage) => {
        // Find the actual positions of the spouses
        const spouseANode = nodes.find(n => n.person.id === marriage.parentA?.id)
        const spouseBNode = nodes.find(n => n.person.id === marriage.parentB?.id)
        
        if (!spouseANode || !spouseBNode) {
          return null;
        }
        
        // Use the layout engine's calculated positions
        const spouseAX = spouseANode.x + personWidth / 2
        const spouseBX = spouseBNode.x + personWidth / 2  
        const spouseY = spouseANode.y + personHeight / 2
        
        // Calculate the true center between spouses
        const centerX = (spouseAX + spouseBX) / 2
        
        return (
          <g key={`spouse-connection-${marriage.id}`} className="spouse-connection">
            {/* Clean horizontal connection line between spouses */}
            <line
              x1={spouseAX}
              y1={spouseY}
              x2={spouseBX}
              y2={spouseY}
              stroke={marriage.branchColor}
              strokeWidth="4"
              className="transition-colors"
            />
            
            {/* Heart icon in center with subtle shadow */}
            <circle
              cx={centerX}
              cy={spouseY}
              r="16"
              fill="white"
              stroke={marriage.branchColor}
              strokeWidth="3"
              className="drop-shadow-md"
            />
            
            {/* Heart symbol using calculated position */}
            <circle 
              cx={centerX} 
              cy={spouseY} 
              r="12" 
              fill="#ef4444" 
              stroke="white" 
              strokeWidth="2"
            />
            <text 
              x={centerX} 
              y={spouseY + 4} 
              textAnchor="middle" 
              fontSize="12" 
              fill="white" 
              fontWeight="bold"
            >
              ♥
            </text>
          </g>
        )
      }).filter(Boolean);
      
    return elements;
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