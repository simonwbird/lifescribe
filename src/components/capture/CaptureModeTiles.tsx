import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Camera, Mic, Video } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CaptureModeTilesProps {
  className?: string
  variant?: 'default' | 'compact'
}

const captureModeTiles = [
  {
    mode: 'write' as const,
    icon: FileText,
    label: 'Write',
    subtitle: 'Write a memory',
    route: '/stories/new?type=write',
    shortcut: 'W',
    color: '#4F9CF9',
    colorRgb: '79, 156, 249',
    backgroundImage: '/hub/write-fallback.jpg'
  },
  {
    mode: 'photo' as const,
    icon: Camera,
    label: 'Photo',
    subtitle: 'Add photos',
    route: '/stories/new?type=photo',
    shortcut: 'P',
    color: '#00D4AA',
    colorRgb: '0, 212, 170',
    backgroundImage: '/hub/photo-fallback.jpg'
  },
  {
    mode: 'voice' as const,
    icon: Mic,
    label: 'Voice',
    subtitle: 'Record voice',
    route: '/stories/new?type=voice',
    shortcut: 'V',
    color: '#FFB976',
    colorRgb: '255, 185, 118',
    backgroundImage: '/hub/voice-fallback.jpg'
  },
  {
    mode: 'video' as const,
    icon: Video,
    label: 'Video',
    subtitle: 'Record short video',
    route: '/stories/new?type=video',
    shortcut: 'Shift+V',
    color: '#A78BFA',
    colorRgb: '167, 139, 250',
    backgroundImage: '/hub/video-fallback.jpg'
  }
]

export function CaptureModeTiles({ className, variant = 'default' }: CaptureModeTilesProps) {
  const [backgrounds, setBackgrounds] = useState<Record<string, string>>({})

  useEffect(() => {
    // Initialize with fallback images
    const fallbacks: Record<string, string> = {}
    captureModeTiles.forEach(tile => {
      fallbacks[tile.mode] = tile.backgroundImage
    })
    setBackgrounds(fallbacks)
  }, [])

  const tileHeight = variant === 'compact' ? 'h-20' : 'h-24'
  const iconSize = variant === 'compact' ? 'h-5 w-5' : 'h-6 w-6'
  const textSize = variant === 'compact' ? 'text-xs' : 'text-sm'
  const subtextSize = variant === 'compact' ? 'text-[10px]' : 'text-xs'

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {captureModeTiles.map(({ mode, icon: Icon, label, subtitle, route, shortcut, color, colorRgb, backgroundImage }) => {
        const backgroundUrl = backgrounds[mode] || backgroundImage

        return (
          <Link
            key={mode}
            to={route}
            className={cn(
              "relative flex-col gap-2 p-4 overflow-hidden shadow-sm group rounded-xl transition-all duration-300",
              "hover:scale-[1.02] focus:scale-[1.02]",
              "focus:outline-none focus:ring-4 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-black/10",
              tileHeight
            )}
            style={{
              background: `linear-gradient(to bottom, rgba(${colorRgb}, 0.78), rgba(${colorRgb}, 0.78)), url(${backgroundUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            aria-label={`${label} - ${subtitle}`}
          >
            {/* Background blur effect */}
            <div 
              className="absolute inset-0 transition-all duration-400 group-hover:scale-105 blur-md"
              style={{
                backgroundImage: `url(${backgroundUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              role="img"
              aria-label={`${label} background`}
            />

            {/* Sheen effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between items-center text-white">
              <Icon className={iconSize} />
              <div className="text-center">
                <div className={cn("font-semibold", textSize)}>{label}</div>
                <div className={cn("text-white/80", subtextSize)}>{subtitle}</div>
              </div>
              <Badge variant="secondary" className="text-xs h-5 bg-white/20 text-white border-white/30">
                {shortcut}
              </Badge>
            </div>
          </Link>
        )
      })}
    </div>
  )
}