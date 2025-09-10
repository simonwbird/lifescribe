import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Grid3x3, 
  Shuffle,
  RotateCcw,
  Settings
} from 'lucide-react'

interface ZoomControlsProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToScreen: () => void
  onAutoArrange: () => void
  onToggleGrid: () => void
  onReset?: () => void
  showGrid: boolean
}

export default function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  onAutoArrange,
  onToggleGrid,
  onReset,
  showGrid
}: ZoomControlsProps) {
  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-lg border">
      <CardContent className="p-2">
        <div className="flex flex-col space-y-1">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomIn}
              disabled={zoom >= 2.0}
              className="h-8 w-8 p-0"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <div className="text-xs font-mono bg-gray-50 px-2 py-1 rounded min-w-[50px] text-center">
              {Math.round(zoom * 100)}%
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onZoomOut}
              disabled={zoom <= 0.2}
              className="h-8 w-8 p-0"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Layout Controls */}
          <div className="flex flex-col space-y-1 border-t pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onFitToScreen}
              className="h-8 justify-start px-2"
              title="Fit to Screen"
            >
              <Maximize2 className="h-3.5 w-3.5 mr-2" />
              <span className="text-xs">Fit</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onAutoArrange}
              className="h-8 justify-start px-2"
              title="Auto Arrange by Generation"
            >
              <Shuffle className="h-3.5 w-3.5 mr-2" />
              <span className="text-xs">Auto</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleGrid}
              className={`h-8 justify-start px-2 ${showGrid ? 'bg-blue-50 text-blue-700' : ''}`}
              title="Toggle Grid"
            >
              <Grid3x3 className="h-3.5 w-3.5 mr-2" />
              <span className="text-xs">Grid</span>
            </Button>
            
            {onReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="h-8 justify-start px-2"
                title="Reset Positions"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-2" />
                <span className="text-xs">Reset</span>
              </Button>
            )}
          </div>

          {/* Help */}
          <div className="border-t pt-2 text-xs text-gray-500 space-y-1">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Parents</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <span>Children</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-pink-500 rounded-full mr-2"></div>
              <span>Spouses</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}