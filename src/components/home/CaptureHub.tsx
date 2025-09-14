import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  Camera, 
  Mic, 
  Lightbulb,
  Users,
  GitBranch
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
    title: 'Add a story in your family tree',
    route: '/family/tree',
    icon: GitBranch,
    ariaLabel: 'Add a story to your family tree'
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
            What would you like to capture today?
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Share your family's stories and memories
          </p>
        </div>
        <div className="flex items-center justify-center sm:justify-end gap-3">
          <StreakChip />
        </div>
      </div>

      {/* Capture Tiles */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {TILES.map((tile) => {
          const Icon = tile.icon
          const currentHint = currentHints[tile.id]

          return (
            <Link
              key={tile.id}
              to={tile.route}
              className={cn(
                "group relative block rounded-2xl shadow-lg overflow-hidden",
                "transition-all duration-300",
                "p-4 sm:p-5 lg:p-6",
                "hover:scale-[1.02] focus:scale-[1.02]",
                "focus:outline-none focus:ring-4 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-black/10",
                "min-h-[160px] sm:min-h-[180px] md:min-h-[200px] lg:min-h-[140px]",
                "flex"
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
              <div className="relative z-10 w-full flex flex-col justify-between text-white">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 flex-shrink-0" />
                </div>

                <div className="flex-1 flex flex-col justify-end">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 leading-tight">
                    {tile.title}
                  </h2>
                  <p 
                    id={`${tile.id}-description`}
                    className="text-sm sm:text-base lg:text-sm text-white/90 leading-snug"
                  >
                    {tile.description}
                  </p>
                  {currentHint && (
                    <p className="text-xs sm:text-sm text-white/75 italic mt-1 line-clamp-1">
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
      <div className="flex flex-col xs:flex-row flex-wrap gap-3 justify-center sm:justify-start">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.route}
              to={action.route}
              className={cn(
                "inline-flex items-center justify-center xs:justify-start gap-3 px-4 py-3 rounded-xl",
                "bg-white shadow ring-1 ring-black/5",
                "hover:shadow-md transition-shadow duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                "min-w-[140px] xs:min-w-0 flex-1 xs:flex-initial max-w-none xs:max-w-fit"
              )}
              aria-label={action.ariaLabel}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
              <span className="text-sm sm:text-base font-medium text-gray-700 text-center xs:text-left">
                {action.title}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}