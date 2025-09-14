import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { 
  FileText, 
  Camera, 
  Mic, 
  Video,
  Calendar,
  Users,
  Upload,
  RotateCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CaptureHubProps {
  className?: string
}

interface TileConfig {
  id: 'write' | 'photo' | 'voice' | 'video'
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
    route: '/stories/new',
    color: '#2563EB',
    colorRgb: '37, 99, 235',
    hints: ['first job', 'grandma\'s recipe', 'that road trip'],
    ariaLabel: 'Write a story'
  },
  {
    id: 'photo',
    title: 'Photo',
    description: 'Add a photo and tell its story.',
    icon: Camera,
    route: '/stories/new?type=photo',
    color: '#10B981',
    colorRgb: '16, 185, 129',
    hints: ['wedding', 'school play', 'first home'],
    ariaLabel: 'Add a photo'
  },
  {
    id: 'voice',
    title: 'Voice',
    description: 'Record your voice or a loved one\'s.',
    icon: Mic,
    route: '/stories/new?type=voice',
    color: '#F59E0B',
    colorRgb: '245, 158, 11',
    hints: ['grandpa\'s laugh', 'lullaby', 'bedtime tale'],
    ariaLabel: 'Record voice'
  },
  {
    id: 'video',
    title: 'Video',
    description: 'Share a short clip or message.',
    icon: Video,
    route: '/stories/new',
    color: '#8B5CF6',
    colorRgb: '139, 92, 246',
    hints: ['birthday candles', 'holiday cheers', 'silly dance'],
    ariaLabel: 'Record video'
  }
]

const QUICK_ACTIONS = [
  {
    title: 'Answer today\'s prompt',
    route: '/prompts',
    icon: Calendar,
    ariaLabel: 'Answer today\'s writing prompt'
  },
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

// Cache key for personalized backgrounds
const CACHE_KEY = 'lifescribe_hub_backgrounds'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

interface BackgroundCache {
  timestamp: number
  backgrounds: Record<string, string>
}

export function CaptureHub({ className }: CaptureHubProps) {
  const [backgrounds, setBackgrounds] = useState<Record<string, string>>({})
  const [currentHints, setCurrentHints] = useState<Record<string, string>>({})
  const [streak, setStreak] = useState({ current: 4, target: 7 })
  const [loading, setLoading] = useState(true)

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

  // Get personalized backgrounds or fallbacks
  useEffect(() => {
    getPersonalizedBackgrounds()
  }, [])

  const getPersonalizedBackgrounds = async () => {
    try {
      // Check cache first
      const cached = getCachedBackgrounds()
      if (cached) {
        setBackgrounds(cached)
        setLoading(false)
        return
      }

      // Fetch user's media from Supabase
      const { data: media, error } = await supabase
        .from('media')
        .select('file_path, mime_type')
        .like('mime_type', 'image%')
        .order('created_at', { ascending: false })
        .limit(12)

      if (error) throw error

      const newBackgrounds: Record<string, string> = {}
      
      if (media && media.length > 0) {
        // Use user's images with random selection
        TILES.forEach(tile => {
          const randomImage = media[Math.floor(Math.random() * media.length)]
          const { data: signedUrl } = supabase.storage
            .from('media')
            .getPublicUrl(randomImage.file_path)
          
          newBackgrounds[tile.id] = signedUrl.publicUrl
        })
      } else {
        // Use fallback images
        TILES.forEach(tile => {
          newBackgrounds[tile.id] = `/hub/${tile.id}-fallback.jpg`
        })
      }

      setBackgrounds(newBackgrounds)
      setCachedBackgrounds(newBackgrounds)
      setLoading(false)
    } catch (error) {
      console.error('Error loading backgrounds:', error)
      // Use fallbacks on error
      const fallbacks: Record<string, string> = {}
      TILES.forEach(tile => {
        fallbacks[tile.id] = `/hub/${tile.id}-fallback.jpg`
      })
      setBackgrounds(fallbacks)
      setLoading(false)
    }
  }

  const getCachedBackgrounds = (): Record<string, string> | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null

      const data: BackgroundCache = JSON.parse(cached)
      const now = Date.now()
      
      if (now - data.timestamp < CACHE_DURATION) {
        return data.backgrounds
      }
      
      localStorage.removeItem(CACHE_KEY)
      return null
    } catch {
      return null
    }
  }

  const setCachedBackgrounds = (backgrounds: Record<string, string>) => {
    try {
      const data: BackgroundCache = {
        timestamp: Date.now(),
        backgrounds
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  const refreshBackgrounds = () => {
    localStorage.removeItem(CACHE_KEY)
    getPersonalizedBackgrounds()
  }

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
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshBackgrounds}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Change background images"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Capture Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {TILES.map((tile) => {
          const Icon = tile.icon
          const backgroundUrl = backgrounds[tile.id]
          const currentHint = currentHints[tile.id]

          return (
            <Link
              key={tile.id}
              to={tile.route}
              className={cn(
                "group relative block rounded-2xl p-6 shadow-lg overflow-hidden",
                "aspect-[16/10] transition-all duration-300",
                "hover:scale-[1.02] focus:scale-[1.02]",
                "focus:outline-none focus:ring-4 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-black/10",
                // Voice tile special animation
                tile.id === 'voice' && "motion-safe:animate-pulse"
              )}
              style={{
                background: backgroundUrl && !loading
                  ? `linear-gradient(to bottom, rgba(${tile.colorRgb}, 0.78), rgba(${tile.colorRgb}, 0.78)), url(${backgroundUrl})`
                  : `linear-gradient(to bottom, rgba(${tile.colorRgb}, 0.9), rgba(${tile.colorRgb}, 0.95))`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              aria-label={tile.ariaLabel}
              aria-describedby={`${tile.id}-description`}
            >
              {/* Background image with blur and parallax effect */}
              {backgroundUrl && !loading && (
                <div 
                  className="absolute inset-0 transition-all duration-400 group-hover:scale-105 blur-md"
                  style={{
                    backgroundImage: `url(${backgroundUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  role="img"
                  aria-label={`Soft-focused ${tile.title.toLowerCase()} background`}
                />
              )}

              {/* Sheen effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse" />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-between text-white">
                <div className="flex items-start justify-between">
                  <Icon className="h-7 w-7" />
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-1">{tile.title}</h2>
                  <p 
                    id={`${tile.id}-description`}
                    className="text-sm text-white/90 mb-2"
                  >
                    {tile.description}
                  </p>
                  {currentHint && (
                    <p className="text-xs text-white/75 italic">
                      {currentHint}
                    </p>
                  )}
                </div>
              </div>

              {/* Loading shimmer */}
              {loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
              )}
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