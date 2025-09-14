import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, Camera, Mic, Lightbulb } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CaptureModeTilesProps {
  className?: string
  variant?: 'default' | 'compact'
  forceMobileCompact?: boolean
}

const captureModeTiles = [
  {
    mode: 'write' as const,
    icon: FileText,
    label: 'Write',
    subtitle: 'Write a memory',
    route: '/stories/new?type=write',
    shortcut: 'W',
    color: '#3B9EFF',
    colorRgb: '59, 158, 255'
  },
  {
    mode: 'photo' as const,
    icon: Camera,
    label: 'Photo & Video',
    subtitle: 'Add photos & videos',
    route: '/stories/new?type=photo',
    shortcut: 'P',
    color: '#00D4AA',
    colorRgb: '0, 212, 170'
  },
  {
    mode: 'voice' as const,
    icon: Mic,
    label: 'Voice',
    subtitle: 'Record voice',
    route: '/stories/new?type=voice',
    shortcut: 'V',
    color: '#FFB976',
    colorRgb: '255, 185, 118'
  },
  {
    mode: 'prompts' as const,
    icon: Lightbulb,
    label: 'Prompts',
    subtitle: 'Answer today\'s prompt',
    route: '/prompts',
    shortcut: 'Q',
    color: '#A78BFA',
    colorRgb: '167, 139, 250'
  }
]

export function CaptureModeTiles({ className, variant = 'default', forceMobileCompact = true }: CaptureModeTilesProps) {
  // Auto-compact on mobile if forceMobileCompact is true
  const effectiveVariant = forceMobileCompact ? variant : variant
  const tileHeight = effectiveVariant === 'compact' ? 'h-16 sm:h-20' : 'h-20 sm:h-24'
  const iconSize = effectiveVariant === 'compact' ? 'h-4 w-4 sm:h-5 sm:w-5' : 'h-5 w-5 sm:h-6 sm:w-6'
  const textSize = effectiveVariant === 'compact' ? 'text-xs sm:text-xs' : 'text-xs sm:text-sm'
  const subtextSize = effectiveVariant === 'compact' ? 'text-[10px] sm:text-[10px]' : 'text-[10px] sm:text-xs'
  const padding = effectiveVariant === 'compact' ? 'p-2 sm:p-3' : 'p-3 sm:p-4'

  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:gap-3", className)}>
      {captureModeTiles.map(({ mode, icon: Icon, label, subtitle, route, shortcut, color, colorRgb }) => {
        return (
          <Link
            key={mode}
            to={route}
            className={cn(
              "relative flex-col gap-1 sm:gap-2 overflow-hidden shadow-sm group rounded-xl transition-all duration-300",
              "hover:scale-[1.02] focus:scale-[1.02]",
              "focus:outline-none focus:ring-4 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-black/10",
              tileHeight,
              padding
            )}
            style={{
              background: `rgba(${colorRgb}, 1)`,
            }}
            aria-label={`${label} - ${subtitle}`}
          >
            {/* Sheen effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between items-center text-white">
              <Icon className={iconSize} />
              <div className="text-center">
                <div className={cn("font-semibold", textSize)}>{label}</div>
                <div className={cn("text-white/80 hidden sm:block", subtextSize)}>{subtitle}</div>
              </div>
              <Badge variant="secondary" className={cn("text-[10px] h-4 sm:h-5 bg-white/20 text-white border-white/30", effectiveVariant === 'compact' && "hidden sm:flex")}>
                {shortcut}
              </Badge>
            </div>
          </Link>
        )
      })}
    </div>
  )
}