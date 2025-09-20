import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, FabricText, Line, PencilBrush, FabricImage } from 'fabric';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Square, 
  Circle as CircleIcon, 
  ArrowRight, 
  Type, 
  Pencil, 
  MousePointer, 
  Undo, 
  Redo,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ScreenshotAnnotatorProps {
  imageDataUrl: string;
  onSave: (annotatedDataUrl: string) => void;
  onCancel: () => void;
}

type Tool = 'select' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'pencil';

export const ScreenshotAnnotator = ({ imageDataUrl, onSave, onCancel }: ScreenshotAnnotatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('rectangle');
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1200,
      height: 800,
      backgroundColor: 'transparent',
      // Improve rendering quality
      enableRetinaScaling: true,
      imageSmoothingEnabled: false,
    });

    // Load the screenshot as background
    FabricImage.fromURL(imageDataUrl).then((img) => {
      const aspectRatio = img.width! / img.height!;
      let canvasWidth = 1200;
      let canvasHeight = 800;
      
      // Calculate optimal size to show more detail while maintaining aspect ratio
      const maxWidth = Math.min(window.innerWidth * 0.8, 1400);
      const maxHeight = Math.min(window.innerHeight * 0.7, 900);
      
      if (aspectRatio > maxWidth / maxHeight) {
        canvasWidth = maxWidth;
        canvasHeight = maxWidth / aspectRatio;
      } else {
        canvasHeight = maxHeight;
        canvasWidth = maxHeight * aspectRatio;
      }
      
      canvas.setDimensions({ width: canvasWidth, height: canvasHeight });
      
      // Scale and position the background image with better quality
      img.scaleToWidth(canvasWidth);
      img.scaleToHeight(canvasHeight);
      img.set({
        left: 0,
        top: 0,
        selectable: false,
        evented: false,
        // Maintain image quality when scaled
        imageSmoothing: false,
      });
      
      canvas.add(img);
      canvas.sendObjectToBack(img);
      canvas.renderAll();
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [imageDataUrl]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === 'pencil';
    
    if (activeTool === 'pencil') {
      const brush = new PencilBrush(fabricCanvas);
      brush.color = '#ff0000';
      brush.width = 3;
      fabricCanvas.freeDrawingBrush = brush;
    }

    fabricCanvas.selection = activeTool === 'select';
    fabricCanvas.defaultCursor = activeTool === 'select' ? 'default' : 'crosshair';
  }, [activeTool, fabricCanvas]);

  const handleMouseDown = (options: any) => {
    if (!fabricCanvas || activeTool === 'select' || activeTool === 'pencil') return;
    
    setIsDrawing(true);
    const pointer = fabricCanvas.getPointer(options.e);
    setStartPoint(pointer);
  };

  const handleMouseUp = (options: any) => {
    if (!fabricCanvas || !isDrawing || !startPoint) return;
    
    setIsDrawing(false);
    const pointer = fabricCanvas.getPointer(options.e);
    
    switch (activeTool) {
      case 'rectangle':
        const rect = new Rect({
          left: Math.min(startPoint.x, pointer.x),
          top: Math.min(startPoint.y, pointer.y),
          width: Math.abs(pointer.x - startPoint.x),
          height: Math.abs(pointer.y - startPoint.y),
          fill: 'transparent',
          stroke: '#ff0000',
          strokeWidth: 3,
        });
        fabricCanvas.add(rect);
        break;
        
      case 'circle':
        const radius = Math.abs(pointer.x - startPoint.x) / 2;
        const circle = new Circle({
          left: Math.min(startPoint.x, pointer.x),
          top: Math.min(startPoint.y, pointer.y),
          radius: radius,
          fill: 'transparent',
          stroke: '#ff0000',
          strokeWidth: 3,
        });
        fabricCanvas.add(circle);
        break;
        
      case 'arrow':
        const line = new Line([startPoint.x, startPoint.y, pointer.x, pointer.y], {
          stroke: '#ff0000',
          strokeWidth: 3,
          selectable: true,
        });
        
        // Add arrowhead
        const angle = Math.atan2(pointer.y - startPoint.y, pointer.x - startPoint.x);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;
        
        const arrowHead1 = new Line([
          pointer.x,
          pointer.y,
          pointer.x - arrowLength * Math.cos(angle - arrowAngle),
          pointer.y - arrowLength * Math.sin(angle - arrowAngle)
        ], {
          stroke: '#ff0000',
          strokeWidth: 3,
          selectable: false,
        });
        
        const arrowHead2 = new Line([
          pointer.x,
          pointer.y,
          pointer.x - arrowLength * Math.cos(angle + arrowAngle),
          pointer.y - arrowLength * Math.sin(angle + arrowAngle)
        ], {
          stroke: '#ff0000',
          strokeWidth: 3,
          selectable: false,
        });
        
        fabricCanvas.add(line, arrowHead1, arrowHead2);
        break;
        
      case 'text':
        setShowTextInput(true);
        setStartPoint(pointer);
        return;
    }
    
    setStartPoint(null);
  };

  const addText = () => {
    if (!fabricCanvas || !textInput.trim() || !startPoint) return;
    
    const text = new FabricText(textInput, {
      left: startPoint.x,
      top: startPoint.y,
      fontFamily: 'Arial',
      fontSize: 20,
      fill: '#ff0000',
      fontWeight: 'bold',
    });
    
    fabricCanvas.add(text);
    setTextInput('');
    setShowTextInput(false);
    setStartPoint(null);
  };

  const handleZoom = (delta: number) => {
    const newZoom = Math.min(Math.max(zoom + delta, 0.5), 3);
    setZoom(newZoom);
  };

  const resetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'select' && !fabricCanvas?.getActiveObject()) {
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning && lastPanPoint) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      setPanOffset(prev => ({
        x: prev.x + deltaX / zoom,
        y: prev.y + deltaY / zoom
      }));
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    setLastPanPoint(null);
  };

  const handleUndo = () => {
    if (!fabricCanvas) return;
    const objects = fabricCanvas.getObjects();
    if (objects.length > 0) {
      fabricCanvas.remove(objects[objects.length - 1]);
    }
  };

  const handleSave = () => {
    if (!fabricCanvas) return;
    
    const dataUrl = fabricCanvas.toDataURL({
      format: 'png',
      quality: 0.9,
      multiplier: 2, // Higher resolution export
    });
    
    onSave(dataUrl);
    toast({
      title: "Screenshot annotated",
      description: "Your annotated screenshot has been saved."
    });
  };

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('mouse:up', handleMouseUp);

    return () => {
      fabricCanvas.off('mouse:down', handleMouseDown);
      fabricCanvas.off('mouse:up', handleMouseUp);
    };
  }, [fabricCanvas, activeTool, isDrawing, startPoint]);

  const tools = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: CircleIcon, label: 'Circle' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'pencil', icon: Pencil, label: 'Draw' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2">
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Annotate Screenshot</h3>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant={activeTool === tool.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTool(tool.id as Tool)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {tool.label}
                </Button>
              );
            })}
            
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleZoom(-0.2)}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="flex items-center px-2 text-sm font-medium">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="outline" size="sm" onClick={() => handleZoom(0.2)}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={resetZoom}>
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleUndo}>
                <Undo className="w-4 h-4" />
              </Button>
              <Button onClick={handleSave}>
                <Download className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 max-h-[80vh] overflow-auto">
          <div className="flex justify-center">
            <div 
              className="relative overflow-hidden border border-border rounded cursor-grab active:cursor-grabbing"
              style={{
                transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                transformOrigin: 'center center'
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onWheel={handleWheel}
            >
              <canvas ref={canvasRef} className="block" />
            </div>
          </div>
        </div>

        {showTextInput && (
          <div className="p-4 border-t bg-muted">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="text-input">Enter text</Label>
                <Input
                  id="text-input"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter text to add..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addText();
                    } else if (e.key === 'Escape') {
                      setShowTextInput(false);
                      setTextInput('');
                    }
                  }}
                  autoFocus
                />
              </div>
              <Button onClick={addText} disabled={!textInput.trim()}>
                Add Text
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowTextInput(false);
                  setTextInput('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};