interface LogoProps {
  className?: string
  variant?: 'icon' | 'wordmark'
  onClick?: () => void
  clickable?: boolean
}

/**
 * LifeScribe Logo Component
 * 
 * Two variants:
 * - 'icon': 32×32 book heart icon only
 * - 'wordmark': Icon plus "LifeScribe" text
 */
export function LifeScribeLogo({ 
  className = '', 
  variant = 'icon',
  onClick,
  clickable = false 
}: LogoProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault()
      onClick()
    }
  }

  const commonProps = clickable ? {
    onClick: handleClick,
    role: 'button',
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick?.()
      }
    },
    className: `${className} cursor-pointer hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded`
  } : { className }

  if (variant === 'icon') {
    return (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...commonProps}
        role="img"
        aria-label={clickable ? "LifeScribe logo, navigate to home" : "LifeScribe logo"}
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
    <div {...commonProps}>
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
