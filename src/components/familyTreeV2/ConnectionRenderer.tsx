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
  return (
    <g>
      {/* Union bars and stems (drawn first, behind cards) */}
      {unionConnections.map((union, i) => {
        const { x1, x2, y, ax, bx } = unionBar(union.spouse1, union.spouse2, union.rowY)
        const xm = Math.round((x1 + x2) / 2)
        
        return (
          <g key={`union-${union.unionId}-${i}`}>
            {/* Stems from spouse centers to bar */}
            <path d={`M${ax},${y - STEM_LEN} V${y}`} className="fe-stem" />
            <path d={`M${bx},${y - STEM_LEN} V${y}`} className="fe-stem" />
            
            {/* Horizontal bar between spouses */}
            <path d={`M${x1},${y} L${x2},${y}`} className="fe-bar" />
            
            {/* Children connections from bar midpoint */}
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
              
              return (
                <path
                  key={`union-child-${union.unionId}-${ci}`}
                  d={d}
                  className="fe-link"
                />
              )
            })}
          </g>
        )
      })}

      {/* Fallback parent-child connections (for single parents) */}
      {parentConnections.map((conn, i) => {
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
        
        return (
          <path
            key={`parent-${i}`}
            d={d}
            className="fe-link"
          />
        )
      })}

      {/* Simple spouse connection bars (fallback) */}
      {spouseConnections.map((conn, i) => (
        <path
          key={`spouse-${i}`}
          d={`M${conn.spouse1X},${conn.spouse1Y} L${conn.spouse2X},${conn.spouse2Y}`}
          className="fe-bar"
        />
      ))}
    </g>
  )
}