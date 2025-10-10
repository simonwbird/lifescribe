import { useState, ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

interface AccessibleImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt'> {
  src: string
  alt: string // Required - no optional
  fallback?: string
  priority?: boolean
  onError?: () => void
}

/**
 * Accessible image component with required alt text
 * Enforces WCAG compliance for images
 */
export function AccessibleImage({
  src,
  alt,
  fallback = '/placeholder.svg',
  priority = false,
  className,
  onError,
  ...props
}: AccessibleImageProps) {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const handleLoad = () => {
    setLoaded(true)
  }

  const handleError = () => {
    setError(true)
    setLoaded(true)
    onError?.()
  }

  // Warn if alt text is empty or suspiciously short
  if (process.env.NODE_ENV === 'development') {
    if (!alt || alt.length < 3) {
      console.warn('AccessibleImage: Alt text should be descriptive', { src, alt })
    }
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
          <div className="text-center p-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Image unavailable</p>
            <p className="text-xs mt-1">{alt}</p>
          </div>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0"
          )}
          {...props}
        />
      )}

      {/* Screen reader loading state */}
      {!loaded && !error && (
        <span className="sr-only">Loading image: {alt}</span>
      )}
    </div>
  )
}
