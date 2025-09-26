import { memo } from 'react'
import { cn } from '@/lib/utils'

interface ProgressRingProps {
  progress: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  strokeWidth?: number
  className?: string
  showLabel?: boolean
  label?: string
}

export const ProgressRing = memo(function ProgressRing({
  progress,
  size = 'md',
  strokeWidth,
  className,
  showLabel = false,
  label
}: ProgressRingProps) {
  const sizes = {
    sm: { diameter: 48, defaultStroke: 4 },
    md: { diameter: 64, defaultStroke: 6 },
    lg: { diameter: 96, defaultStroke: 8 }
  }

  const { diameter, defaultStroke } = sizes[size]
  const stroke = strokeWidth || defaultStroke
  const radius = (diameter - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div 
      className={cn('relative inline-flex', className)}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `Progress: ${Math.round(progress)}%`}
    >
      <svg
        width={diameter}
        height={diameter}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="transparent"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        
        {/* Progress circle */}
        <circle
          cx={diameter / 2}
          cy={diameter / 2}
          r={radius}
          fill="transparent"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-base ease-out"
        />
      </svg>

      {/* Label */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-body-sm font-medium text-foreground">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  )
})