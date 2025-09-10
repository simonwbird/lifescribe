import React from 'react'

interface GridOverlayProps {
  zoom: number
  gridSize?: number
}

export default function GridOverlay({ zoom, gridSize = 40 }: GridOverlayProps) {
  // Only show grid when zoomed in enough to be useful
  if (zoom < 0.5) return null

  const scaledGridSize = gridSize * zoom
  const opacity = Math.min(0.3, zoom * 0.3) // Fade grid as zoom decreases

  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity }}
    >
      <defs>
        <pattern 
          id="grid" 
          width={scaledGridSize} 
          height={scaledGridSize} 
          patternUnits="userSpaceOnUse"
        >
          <path 
            d={`M ${scaledGridSize} 0 L 0 0 0 ${scaledGridSize}`} 
            fill="none" 
            stroke="#e5e7eb" 
            strokeWidth={zoom > 0.8 ? 1 : 0.5}
            opacity={zoom > 0.8 ? 0.6 : 0.3}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  )
}