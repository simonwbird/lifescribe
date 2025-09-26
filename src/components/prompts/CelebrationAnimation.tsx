import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Trophy, Star, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CelebrationAnimationProps {
  show: boolean
  type: 'story_saved' | 'streak_milestone' | 'first_story' | 'week_complete'
  streak?: number
  onComplete?: () => void
  className?: string
}

const celebrationConfig = {
  story_saved: {
    icon: Star,
    title: 'Story Saved! ✨',
    subtitle: 'Another precious memory captured',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    duration: 2000
  },
  streak_milestone: {
    icon: Trophy,
    title: 'Amazing Streak! 🔥',
    subtitle: (streak: number) => `${streak} days in a row!`,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    duration: 3000
  },
  first_story: {
    icon: Heart,
    title: 'Welcome to Your Story Journey! 🎉',
    subtitle: 'Your first memory is now part of your family\'s legacy',
    color: 'text-pink-500',
    bgColor: 'bg-pink-50',
    duration: 3500
  },
  week_complete: {
    icon: Trophy,
    title: 'Week Complete! 🏆',
    subtitle: 'You\'re building an incredible collection of memories',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    duration: 3000
  }
}

export function CelebrationAnimation({ 
  show, 
  type, 
  streak = 0, 
  onComplete, 
  className 
}: CelebrationAnimationProps) {
  const [shouldShow, setShouldShow] = useState(false)
  const config = celebrationConfig[type]
  const Icon = config.icon

  useEffect(() => {
    if (show) {
      setShouldShow(true)
      const timer = setTimeout(() => {
        setShouldShow(false)
        onComplete?.()
      }, config.duration)

      return () => clearTimeout(timer)
    }
  }, [show, config.duration, onComplete])

  const particleCount = type === 'first_story' || type === 'week_complete' ? 20 : 12

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm",
            className
          )}
        >
          {/* Background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: particleCount }).map((_, i) => (
              <motion.div
                key={i}
                className={cn("absolute w-2 h-2 rounded-full", config.bgColor)}
                initial={{
                  x: '50vw',
                  y: '50vh',
                  scale: 0,
                  opacity: 0
                }}
                animate={{
                  x: `${Math.random() * 100}vw`,
                  y: `${Math.random() * 100}vh`,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: config.duration / 1000,
                  delay: Math.random() * 0.5,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>

          {/* Main celebration content */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: -50 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20,
              duration: 0.6
            }}
            className={cn(
              "relative bg-white rounded-2xl p-8 text-center shadow-2xl max-w-sm mx-4",
              config.bgColor
            )}
          >
            {/* Icon with animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: 0.2,
                type: "spring",
                stiffness: 400,
                damping: 10
              }}
              className={cn(
                "inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-white shadow-lg",
                config.color
              )}
            >
              <Icon className="h-8 w-8" />
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-bold mb-2"
            >
              {config.title}
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-muted-foreground text-sm"
            >
              {typeof config.subtitle === 'function' 
                ? config.subtitle(streak) 
                : config.subtitle}
            </motion.p>

            {/* Sparkles animation */}
            <div className="absolute -top-2 -right-2">
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Sparkles className={cn("h-6 w-6", config.color)} />
              </motion.div>
            </div>

            <div className="absolute -bottom-2 -left-2">
              <motion.div
                animate={{ 
                  rotate: [360, 0],
                  scale: [1.2, 0.8, 1.2]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              >
                <Sparkles className={cn("h-4 w-4", config.color)} />
              </motion.div>
            </div>

            {/* Progress indicator for timed celebrations */}
            {(type === 'first_story' || type === 'week_complete') && (
              <motion.div
                className="mt-4 w-full bg-gray-200 rounded-full h-1"
              >
                <motion.div
                  className={cn("h-1 rounded-full", `bg-current ${config.color}`)}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: config.duration / 1000, ease: "linear" }}
                />
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}