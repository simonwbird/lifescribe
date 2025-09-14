import React from "react";

interface GridOverlayProps {
  width: number;
  height: number;
  gridSize: number;
  showGrid?: boolean;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({ 
  width, 
  height, 
  gridSize, 
  showGrid = false 
}) => {
  if (!showGrid) return null;

  const verticalLines = [];
  const horizontalLines = [];

  // Create vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    verticalLines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke="rgba(200, 200, 200, 0.3)"
        strokeWidth="1"
      />
    );
  }

  // Create horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    horizontalLines.push(
      <line
        key={`h-${y}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke="rgba(200, 200, 200, 0.3)"
        strokeWidth="1"
      />
    );
  }

  return (
    <g className="grid-overlay">
      {verticalLines}
      {horizontalLines}
    </g>
  );
};

// Utility function to snap coordinates to grid
export const snapToGrid = (x: number, y: number, gridSize: number) => {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize
  };
};