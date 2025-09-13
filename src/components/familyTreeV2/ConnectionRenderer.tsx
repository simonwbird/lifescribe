import React from 'react'

const strokeCommon = {
  stroke: 'var(--fe-line)',
  strokeWidth: 2,
  fill: 'none',
  strokeLinecap: 'round' as const
};

function parentChildCurve(x1: number, y1: number, x2: number, y2: number) {
  // Gentle cubic curve for parent-child connections
  const dy = y2 - y1;
  const midY = y1 + dy * 0.5;
  return `M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`;
}

function hBar(x1: number, x2: number, y: number) {
  return `M${x1},${y} L${x2},${y}`;
}

interface ConnectionRendererProps {
  parentConnections: Array<{
    parentX: number;
    parentY: number; 
    childX: number;
    childY: number;
  }>;
  spouseConnections: Array<{
    spouse1X: number;
    spouse1Y: number;
    spouse2X: number;
    spouse2Y: number;
  }>;
}

export const ConnectionRenderer: React.FC<ConnectionRendererProps> = ({
  parentConnections,
  spouseConnections
}) => {
  return (
    <g>
      {/* Parent-child connections */}
      {parentConnections.map((conn, i) => (
        <path 
          key={`parent-${i}`}
          d={parentChildCurve(conn.parentX, conn.parentY, conn.childX, conn.childY)} 
          {...strokeCommon} 
        />
      ))}

      {/* Spouse connection bars */}
      {spouseConnections.map((conn, i) => (
        <path 
          key={`spouse-${i}`}
          d={hBar(conn.spouse1X, conn.spouse2X, conn.spouse1Y)} 
          stroke="var(--fe-line-strong)" 
          strokeWidth={3} 
          fill="none" 
        />
      ))}
    </g>
  );
};