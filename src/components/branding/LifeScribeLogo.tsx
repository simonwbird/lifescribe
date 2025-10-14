interface LogoProps {
  className?: string
  variant?: 'icon' | 'wordmark'
}

/**
 * LifeScribe Logo Component
 * 
 * Two variants:
 * - 'icon': 32×32 book heart icon only
 * - 'wordmark': Icon plus "LifeScribe" text
 */
export function LifeScribeLogo({ className = '', variant = 'icon' }: LogoProps) {
  if (variant === 'icon') {
    return (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="LifeScribe logo"
      >
        {/* Book shape */}
        <rect x="6" y="4" width="20" height="24" rx="2" fill="currentColor" opacity="0.2" />
        <path
          d="M8 6h16v20H8V6z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Heart in center */}
        <path
          d="M16 22c-3-2.5-6-5-6-8 0-2 1.5-3 3-3 1 0 2 .5 3 2 1-1.5 2-2 3-2 1.5 0 3 1 3 3 0 3-3 5.5-6 8z"
          fill="currentColor"
        />
        {/* Bookmark */}
        <path
          d="M16 4v8l-2-1.5L12 12V4"
          fill="currentColor"
          opacity="0.4"
        />
      </svg>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="LifeScribe"
      >
        {/* Book shape */}
        <rect x="6" y="4" width="20" height="24" rx="2" fill="currentColor" opacity="0.2" />
        <path
          d="M8 6h16v20H8V6z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Heart in center */}
        <path
          d="M16 22c-3-2.5-6-5-6-8 0-2 1.5-3 3-3 1 0 2 .5 3 2 1-1.5 2-2 3-2 1.5 0 3 1 3 3 0 3-3 5.5-6 8z"
          fill="currentColor"
        />
        {/* Bookmark */}
        <path
          d="M16 4v8l-2-1.5L12 12V4"
          fill="currentColor"
          opacity="0.4"
        />
      </svg>
      <span className="text-xl font-semibold tracking-tight">LifeScribe</span>
    </div>
  )
}
