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
  
  console.log('=== ConnectionRenderer called ===');
  console.log('Received marriages:', marriages.length);
  console.log('Marriages data:', marriages.map(m => `${m.id}: explicit=${m.explicit}`));
  
  const renderParentChildConnections = () => {
    const connections: JSX.Element[] = []
    let connectionIndex = 0

    marriages.forEach(marriage => {
      if (marriage.children.length === 0) return

      const drop = 50 // vertical down from union bar to the sibling bar

      // Build child nodes list once
      const childNodes = marriage.children
        .map(c => nodes.find(n => n.person.id === c.id))
        .filter(Boolean) as LayoutNode[]

      if (childNodes.length === 0) return

      // Horizontal bar Y level
      const barY = marriage.y + drop

      // 1) Vertical from union bar down to the sibling bar
      connections.push(
        <line
          key={`union-drop-${marriage.id}`}
          x1={marriage.x}
          y1={marriage.y}
          x2={marriage.x}
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
    console.log('=== RENDERING SPOUSE CONNECTIONS ===');
    console.log('Total marriages:', marriages.length);
    console.log('Explicit marriages:', marriages.filter(m => m.explicit).length);
    
    return marriages
      .filter(m => m.explicit && m.parentA && m.parentB) // only explicit marriages
      .map((marriage) => {
        console.log(`Rendering marriage: ${marriage.parentA?.full_name} + ${marriage.parentB?.full_name} at x=${marriage.x}`);
        
        // Find the actual positions of the spouses
        const spouseANode = nodes.find(n => n.person.id === marriage.parentA?.id)
        const spouseBNode = nodes.find(n => n.person.id === marriage.parentB?.id)
        
        if (!spouseANode || !spouseBNode) return null
        
        // Use the layout engine's calculated positions - DON'T recalculate!
        const spouseAX = spouseANode.x + personWidth / 2
        const spouseBX = spouseBNode.x + personWidth / 2  
        const spouseY = spouseANode.y + personHeight / 2
        
        // Trust the layout engine's marriage.x calculation for perfect centering
        const centerX = marriage.x
        
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
            
            {/* Large, obvious test elements for debugging */}
            <rect
              x={centerX - 20}
              y={spouseY - 20}
              width="40"
              height="40"
              fill="red"
              stroke="black"
              strokeWidth="3"
              opacity="0.8"
            />
            
            <text
              x={centerX}
              y={spouseY + 5}
              textAnchor="middle"
              fontSize="16"
              fill="white"
              fontWeight="bold"
            >
              ♥
            </text>
            
            {/* Debug coordinates */}
            <text
              x={centerX}
              y={spouseY + 25}
              textAnchor="middle"
              fontSize="8"
              fill="black"
            >
              {centerX},{spouseY}
            </text>
          </g>
        )
      }).filter(Boolean)
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