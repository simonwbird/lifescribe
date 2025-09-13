import React from 'react'

const strokeCommon = {
  stroke: 'var(--fe-line)',
  strokeWidth: 2,
  fill: 'none',
  strokeLinecap: 'round' as const
};

function vLine(x1: number, y1: number, x2: number, y2: number) {
  // Straight lines like Ancestry.com
  const midY = y1 + (y2 - y1) / 2;
  return `M${x1},${y1} L${x1},${midY} L${x2},${midY} L${x2},${y2}`;
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
          d={vLine(conn.parentX, conn.parentY, conn.childX, conn.childY)} 
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