import { useState, ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string
  alt: string
  fallback?: string
  aspectRatio?: string
  priority?: boolean
}

export function OptimizedImage({ 
  src, 
  alt, 
  fallback = '/placeholder.svg',
  aspectRatio,
  priority = false,
  className,
  ...props 
}: OptimizedImageProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Generate responsive image sources
  const generateSrcSet = (originalSrc: string) => {
    if (originalSrc.includes('placeholder.svg') || originalSrc.startsWith('data:')) {
      return undefined
    }
    
    // For Supabase storage or other services that support dynamic resizing
    const baseUrl = originalSrc.split('?')[0]
    const sizes = [480, 768, 1024, 1280]
    
    return sizes
      .map(size => `${baseUrl}?width=${size}&quality=80 ${size}w`)
      .join(', ')
  }

  const handleLoad = () => {
    setLoaded(true)
  }

  const handleError = () => {
    setError(true)
    setLoaded(true)
  }

  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-muted",
        aspectRatio && `aspect-[${aspectRatio}]`,
        className
      )}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      <img
        src={error ? fallback : src}
        srcSet={!error ? generateSrcSet(src) : undefined}
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-200",
          loaded ? "opacity-100" : "opacity-0"
        )}
        {...props}
      />
      
      {/* Screen reader friendly loading state */}
      {!loaded && (
        <span className="sr-only">Loading image: {alt}</span>
      )}
    </div>
  )
}