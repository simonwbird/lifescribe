import React from 'react'
import { 
  topPort, 
  bottomPort, 
  unionBar, 
  unionYForRow, 
  roundedOrthogonal, 
  STEM_LEN, 
  CORNER_RAD 
} from './AncestryConnectors'

interface ConnectionRendererProps {
  parentConnections: Array<{
    parentX: number
    parentY: number
    childX: number
    childY: number
  }>
  spouseConnections: Array<{
    spouse1X: number
    spouse1Y: number
    spouse2X: number
    spouse2Y: number
    rowY: number
  }>
  unionConnections?: Array<{
    unionId: string
    spouse1: { x: number; y: number }
    spouse2: { x: number; y: number }
    children: Array<{ x: number; y: number }>
    rowY: number
  }>
}

export const ConnectionRenderer: React.FC<ConnectionRendererProps> = ({
  parentConnections,
  spouseConnections,
  unionConnections = []
}) => {
  console.log('ConnectionRenderer rendering with:', {
    parentConnections: parentConnections.length,
    spouseConnections: spouseConnections.length, 
    unionConnections: unionConnections.length
  })

  return (
    <g>
      {/* DEBUG: Highly visible test lines */}
      <path d="M100,100 L300,100" stroke="red" strokeWidth="5" />
      <path d="M100,200 L300,200" stroke="blue" strokeWidth="5" />
      
      {/* Union bars and stems (drawn first, behind cards) */}
      {unionConnections.map((union, i) => {
        console.log(`Rendering union ${i}:`, union)
        const { x1, x2, y, ax, bx } = unionBar(union.spouse1, union.spouse2, union.rowY)
        const xm = Math.round((x1 + x2) / 2)
        
        console.log(`Union ${i} coords:`, { x1, x2, y, ax, bx, xm })
        
        return (
          <g key={`union-${union.unionId}-${i}`}>
            {/* Highly visible stems */}
            <path 
              d={`M${ax},${y - STEM_LEN} V${y}`} 
              stroke="red" 
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path 
              d={`M${bx},${y - STEM_LEN} V${y}`} 
              stroke="red" 
              strokeWidth="4"
              strokeLinecap="round"
            />
            
            {/* Highly visible bar */}
            <path 
              d={`M${x1},${y} L${x2},${y}`} 
              stroke="blue" 
              strokeWidth="5"
              strokeLinecap="round"
            />
            
            {/* Children connections */}
            {union.children.map((child, ci) => {
              const tp = topPort(child)
              const midY = Math.round((y + tp.y) / 2)
              const points = [
                { x: xm, y: y },
                { x: xm, y: midY },
                { x: tp.x, y: midY },
                { x: tp.x, y: tp.y }
              ]
              const d = roundedOrthogonal(points, CORNER_RAD)
              
              console.log(`Child ${ci} connection:`, { child, tp, midY, points, d })
              
              return (
                <path
                  key={`union-child-${union.unionId}-${ci}`}
                  d={d}
                  stroke="green"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              )
            })}
          </g>
        )
      })}

      {/* Parent-child connections with bright colors */}
      {parentConnections.map((conn, i) => {
        console.log(`Rendering parent connection ${i}:`, conn)
        const parentBottom = bottomPort({ x: conn.parentX, y: conn.parentY })
        const childTop = topPort({ x: conn.childX, y: conn.childY })
        const midY = Math.round((parentBottom.y + childTop.y) / 2)
        
        const points = [
          parentBottom,
          { x: parentBottom.x, y: midY },
          { x: childTop.x, y: midY },
          childTop
        ]
        const d = roundedOrthogonal(points, CORNER_RAD)
        
        console.log(`Parent connection ${i} coords:`, { parentBottom, childTop, midY, points, d })
        
        return (
          <path
            key={`parent-${i}`}
            d={d}
            stroke="orange"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        )
      })}

      {/* Spouse connection bars */}
      {spouseConnections.map((conn, i) => (
        <path
          key={`spouse-${i}`}
          d={`M${conn.spouse1X},${conn.spouse1Y} L${conn.spouse2X},${conn.spouse2Y}`}
          stroke="purple"
          strokeWidth="5"
        />
      ))}
    </g>
  )
}