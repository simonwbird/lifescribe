import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ImageViewer } from '@/components/ui/image-viewer';

interface StoryImage {
  id: string;
  url: string;
  alt?: string;
}

interface StoryImageGalleryProps {
  images: StoryImage[];
  className?: string;
}

export function StoryImageGallery({ images, className }: StoryImageGalleryProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const handleImageClick = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  if (images.length === 0) return null;

  // Determine layout based on image count
  const getLayoutClasses = () => {
    const count = images.length;

    switch (count) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2 gap-2';
      case 3:
        return 'grid-cols-2 gap-2';
      case 4:
        return 'grid-cols-2 gap-2';
      case 5:
        return 'grid-cols-3 gap-2';
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

    return '';
  };

  const getAspectRatio = (index: number) => {
    const count = images.length;
    
    // Single image can be wider
    if (count === 1) {
      return 'aspect-video';
    }

    // Wide bottom image for 3-image layout
    if (count === 3 && index === 2) {
      return 'aspect-video';
    }

    // Default square for multi-image layouts
    return 'aspect-square';
  };

  return (
    <>
      <div className={cn('grid', getLayoutClasses(), className)}>
        {images.map((image, index) => (
          <div
            key={image.id}
            onClick={() => handleImageClick(index)}
            className={cn(
              'relative rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]',
              getImageClasses(index),
              getAspectRatio(index)
            )}
            data-test="image-thumb"
          >
            <img
              src={image.url}
              alt={image.alt || `Image ${index + 1}`}
              className="w-full h-full object-cover"
              width={600}
              height={600}
              loading={index < 2 ? 'eager' : 'lazy'}
              fetchPriority={index < 2 ? 'high' : 'low'}
              onError={(e) => {
                console.error('Image failed to load:', image.url);
                e.currentTarget.style.display = 'none';
              }}
            />
            
            {/* Overlay gradient for better visibility of corner badges */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            
            {/* Image count badge for galleries with 2+ images */}
            {images.length > 1 && (
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-background/90 backdrop-blur-sm rounded text-xs font-medium">
                {index + 1} / {images.length}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Image Viewer Modal */}
      <ImageViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        imageUrl={images[viewerIndex]?.url || ''}
        imageAlt={images[viewerIndex]?.alt}
        title={`Image ${viewerIndex + 1} of ${images.length}`}
      />
    </>
  );
}