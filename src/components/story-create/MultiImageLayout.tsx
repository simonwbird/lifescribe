import { useState } from 'react';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageData {
  id: string;
  url: string;
  file: File;
}

interface MultiImageLayoutProps {
  images: ImageData[];
  onReorder: (images: ImageData[]) => void;
  onRemove: (id: string) => void;
  onImageClick?: (id: string) => void;
  className?: string;
}

export function MultiImageLayout({ 
  images, 
  onReorder, 
  onRemove,
  onImageClick,
  className 
}: MultiImageLayoutProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex === null || dragOverIndex === null) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dragOverIndex, 0, draggedImage);

    onReorder(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // Determine layout based on image count
  const getLayoutClasses = () => {
    const count = images.length;

    switch (count) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2 gap-2';
      case 3:
        return 'grid-cols-2 gap-2'; // 2 images on top, 1 spanning below
      case 4:
        return 'grid-cols-2 gap-2';
      case 5:
        return 'grid-cols-3 gap-2'; // 3 on top, 2 below
      case 6:
        return 'grid-cols-3 gap-2';
      default:
        return 'grid-cols-3 gap-2';
    }
  };

  const getImageClasses = (index: number) => {
    const count = images.length;

    // Special layout for 3 images: 2 on top, 1 spanning below
    if (count === 3 && index === 2) {
      return 'col-span-2';
    }

    // Special layout for 5 images: 3 on top, 2 below
    if (count === 5 && index >= 3) {
      return 'col-span-1';
    }

    return '';
  };

  if (images.length === 0) return null;

  const layoutType = images.length === 2 ? '2-grid' 
    : images.length === 3 ? '3-masonry'
    : images.length === 4 ? '4-grid'
    : images.length >= 5 ? `${images.length}-collage`
    : 'single';

  return (
    <div 
      className={cn('grid', getLayoutClasses(), className)}
      data-testid="multi-image-layout"
      data-layout={layoutType}
    >
      {images.map((image, index) => (
        <div
          key={image.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          onDragLeave={handleDragLeave}
            className={cn(
              'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
              getImageClasses(index),
              draggedIndex === index && 'opacity-50',
              dragOverIndex === index && 'ring-2 ring-primary',
              onImageClick ? 'cursor-pointer hover:border-primary' : 'cursor-move hover:border-primary'
            )}
            onClick={() => onImageClick?.(image.id)}
          data-test="image-thumb"
        >
          {/* Drag Handle */}
          <div 
            className="absolute top-2 left-2 z-10 p-1 bg-background/80 rounded"
            data-testid="image-reorder-btn"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Remove Button */}
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            className="absolute top-2 right-2 z-10 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
            aria-label="Remove image"
            data-testid="remove-image-btn"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Image with proper attributes for CLS prevention */}
          <img
            src={image.url}
            alt={`Upload ${index + 1}`}
            className="w-full h-full object-cover"
            width={400}
            height={400}
            loading={index < 2 ? 'eager' : 'lazy'}
            fetchPriority={index < 2 ? 'high' : 'low'}
            draggable={false}
            onError={(e) => {
              console.error('Image failed to load:', image.url);
              e.currentTarget.style.display = 'none';
            }}
          />

          {/* Index indicator */}
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-background/80 rounded text-xs font-medium">
            {index + 1}
          </div>
        </div>
      ))}
    </div>
  );
}