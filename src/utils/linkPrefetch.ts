/**
 * Link prefetching utility for performance optimization
 * Prefetches nearby navigation links to improve perceived performance
 */

interface PrefetchOptions {
  priority?: 'high' | 'low'
  delay?: number
}

// Track prefetched URLs to avoid duplicates
const prefetchedUrls = new Set<string>()

/**
 * Prefetch a route by creating a hidden link with rel="prefetch"
 */
export function prefetchRoute(url: string, options: PrefetchOptions = {}) {
  const { priority = 'low', delay = 0 } = options

  // Skip if already prefetched
  if (prefetchedUrls.has(url)) {
    return
  }

  const prefetch = () => {
    // Check if link already exists
    const existingLink = document.querySelector(`link[href="${url}"]`)
    if (existingLink) {
      prefetchedUrls.add(url)
      return
    }

    // Create prefetch link
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    link.as = 'document'
    
    if (priority === 'high') {
      link.setAttribute('importance', 'high')
    }

    link.onload = () => {
      prefetchedUrls.add(url)
    }

    link.onerror = () => {
      console.warn(`Failed to prefetch: ${url}`)
    }

    document.head.appendChild(link)
  }

  if (delay > 0) {
    setTimeout(prefetch, delay)
  } else {
    prefetch()
  }
}

/**
 * Prefetch routes when hovering over links
 */
export function enableHoverPrefetch() {
  const handleMouseEnter = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    
    // Check if target has closest method (is an Element)
    if (!target || typeof target.closest !== 'function') {
      return
    }
    
    const link = target.closest('a[href^="/"]') as HTMLAnchorElement
    
    if (link && link.href) {
      const url = new URL(link.href)
      if (url.origin === window.location.origin) {
        prefetchRoute(url.pathname)
      }
    }
  }

  document.addEventListener('mouseenter', handleMouseEnter, true)

  return () => {
    document.removeEventListener('mouseenter', handleMouseEnter, true)
  }
}

/**
 * Prefetch navigation links in viewport
 */
export function prefetchVisibleLinks() {
  if (!('IntersectionObserver' in window)) {
    return
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const link = entry.target as HTMLAnchorElement
        const url = new URL(link.href)
        
        if (url.origin === window.location.origin) {
          prefetchRoute(url.pathname, { delay: 500 })
        }
        
        observer.unobserve(link)
      }
    })
  }, {
    rootMargin: '50px'
  })

  // Observe all internal navigation links
  document.querySelectorAll('a[href^="/"]').forEach(link => {
    observer.observe(link)
  })

  return () => observer.disconnect()
}
