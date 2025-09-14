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
  // For X coordinate, snap to nearest grid line (same as before)
  const snappedX = Math.round(x / gridSize) * gridSize;
  
  // For Y coordinate, snap to top or bottom of nearest grid cell
  const gridCellY = Math.floor(y / gridSize);
  const cellTopY = gridCellY * gridSize;
  const cellBottomY = (gridCellY + 1) * gridSize;
  const cellCenterY = cellTopY + gridSize / 2;
  
  // Determine if we should snap to top or bottom based on position within cell
  const snappedY = y < cellCenterY ? cellTopY : cellBottomY;
  
  return {
    x: snappedX,
    y: snappedY
  };
};