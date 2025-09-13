import React from 'react'

const strokeCommon = {
  stroke: 'var(--fe-line)',
  strokeWidth: 2,
  fill: 'none',
  strokeLinecap: 'round' as const
};

function vCurve(x1: number, y1: number, x2: number, y2: number) {
  // More organic curved connection like Ancestry.com
  const dx = x2 - x1;
  const dy = y2 - y1;
  const cx1 = x1;
  const cy1 = y1 + dy * 0.5;
  const cx2 = x2;  
  const cy2 = y1 + dy * 0.5;
  return `M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
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
          d={vCurve(conn.parentX, conn.parentY, conn.childX, conn.childY)} 
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