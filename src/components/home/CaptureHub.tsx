import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  Camera, 
  Mic, 
  Lightbulb,
  Users,
  Upload
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CaptureHubProps {
  className?: string
}

interface TileConfig {
  id: 'write' | 'photo' | 'voice' | 'prompts'
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  route: string
  color: string
  colorRgb: string // for rgba overlays
  hints: string[]
  ariaLabel: string
}

const TILES: TileConfig[] = [
  {
    id: 'write',
    title: 'Write',
    description: 'Capture a memory in your own words.',
    icon: FileText,
    route: '/stories/new?type=write',
    color: '#3B9EFF',
    colorRgb: '59, 158, 255',
    hints: ['first job', 'grandma\'s recipe', 'that road trip'],
    ariaLabel: 'Write a story'
  },
  {
    id: 'photo',
    title: 'Photo & Video',
    description: 'Add photos, videos and tell their story.',
    icon: Camera,
    route: '/stories/new?type=photo',
    color: '#00D4AA',
    colorRgb: '0, 212, 170',
    hints: ['wedding', 'school play', 'first home'],
    ariaLabel: 'Add photos and videos'
  },
  {
    id: 'voice',
    title: 'Voice',
    description: 'Record your voice or a loved one\'s.',
    icon: Mic,
    route: '/stories/new?type=voice',
    color: '#FFB976',
    colorRgb: '255, 185, 118',
    hints: ['grandpa\'s laugh', 'lullaby', 'bedtime tale'],
    ariaLabel: 'Record voice'
  },
  {
    id: 'prompts',
    title: 'Prompts',
    description: 'Answer today\'s writing prompt.',
    icon: Lightbulb,
    route: '/prompts',
    color: '#A78BFA',
    colorRgb: '167, 139, 250',
    hints: ['childhood memory', 'family tradition', 'favorite recipe'],
    ariaLabel: 'Answer writing prompt'
  }
]

const QUICK_ACTIONS = [
  {
    title: 'Invite family',
    route: '/family/members',
    icon: Users,
    ariaLabel: 'Invite family members'
  },
  {
    title: 'Upload a batch',
    route: '/stories/new',
    icon: Upload,
    ariaLabel: 'Upload multiple files'
  }
]

export function CaptureHub({ className }: CaptureHubProps) {
  const [currentHints, setCurrentHints] = useState<Record<string, string>>({})
  const [streak] = useState({ current: 4, target: 7 })

  // Rotate hints every 3 seconds
  useEffect(() => {
    const rotateHints = () => {
      const newHints: Record<string, string> = {}
      TILES.forEach(tile => {
        const randomHint = tile.hints[Math.floor(Math.random() * tile.hints.length)]
        newHints[tile.id] = randomHint
      })
      setCurrentHints(newHints)
    }

    rotateHints() // Initial hints
    const interval = setInterval(rotateHints, 3000)
    return () => clearInterval(interval)
  }, [])

  const StreakChip = () => {
    const progress = (streak.current / streak.target) * 100
    const circumference = 2 * Math.PI * 10 // radius = 10
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
      <div 
        className="relative inline-flex items-center justify-center"
        title={`${streak.target - streak.current} more days for your weekly badge`}
      >
        <svg className="w-7 h-7 transform -rotate-90" viewBox="0 0 24 24">
          {/* Background circle */}
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="text-primary transition-all duration-300"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-xs font-semibold text-gray-700">
          {streak.current}
        </span>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            What would you like to capture today?
          </h1>
          <p className="text-gray-600 mt-1">
            Share your family's stories and memories
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StreakChip />
        </div>
      </div>

      {/* Capture Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {TILES.map((tile) => {
          const Icon = tile.icon
          const currentHint = currentHints[tile.id]

          return (
            <Link
              key={tile.id}
              to={tile.route}
              className={cn(
                "group relative block rounded-2xl shadow-lg overflow-hidden",
                "aspect-[4/3] sm:aspect-[16/10] transition-all duration-300",
                "p-3 sm:p-6",
                "hover:scale-[1.02] focus:scale-[1.02]",
                "focus:outline-none focus:ring-4 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-black/10"
              )}
              style={{
                background: `linear-gradient(135deg, rgba(${tile.colorRgb}, 1), rgba(${tile.colorRgb}, 0.8))`,
              }}
              aria-label={tile.ariaLabel}
              aria-describedby={`${tile.id}-description`}
            >
              {/* Sheen effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-between text-white">
                <div className="flex items-start justify-between">
                  <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                </div>

                <div>
                  <h2 className="text-base sm:text-xl font-semibold mb-1">{tile.title}</h2>
                  <p 
                    id={`${tile.id}-description`}
                    className="text-xs sm:text-sm text-white/90 mb-1 sm:mb-2 line-clamp-1 sm:line-clamp-none"
                  >
                    {tile.description}
                  </p>
                  {currentHint && (
                    <p className="text-xs text-white/75 italic hidden sm:block">
                      {currentHint}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.route}
              to={action.route}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-3 rounded-xl",
                "bg-white shadow ring-1 ring-black/5",
                "hover:shadow-md transition-shadow duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}
              aria-label={action.ariaLabel}
            >
              <Icon className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {action.title}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}