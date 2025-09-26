import { useCallback } from 'react'

interface ConfettiOptions {
  particleCount?: number
  spread?: number
  origin?: { x?: number; y?: number }
  colors?: string[]
  startVelocity?: number
  gravity?: number
  drift?: number
  ticks?: number
}

export function useConfetti() {
  const triggerConfetti = useCallback(async (options: ConfettiOptions = {}) => {
    try {
      const confetti = await import('canvas-confetti')
      
      const defaults = {
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#fd79a8'],
        ...options
      }
      
      confetti.default(defaults)
    } catch (error) {
      console.error('Failed to load confetti:', error)
    }
  }, [])

  const celebrateSuccess = useCallback(() => {
    triggerConfetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    })
  }, [triggerConfetti])

  const celebratePost = useCallback(() => {
    // Multiple bursts for posting
    triggerConfetti({
      particleCount: 50,
      spread: 60,
      origin: { x: 0.3, y: 0.7 }
    })
    
    setTimeout(() => {
      triggerConfetti({
        particleCount: 50,
        spread: 60,
        origin: { x: 0.7, y: 0.7 }
      })
    }, 200)
  }, [triggerConfetti])

  const celebrateReaction = useCallback(() => {
    triggerConfetti({
      particleCount: 30,
      spread: 45,
      origin: { y: 0.8 },
      colors: ['#ff69b4', '#ffd700', '#ff6347', '#98fb98']
    })
  }, [triggerConfetti])

  const celebrateUpload = useCallback(() => {
    triggerConfetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#4ecdc4', '#45b7d1', '#96ceb4']
    })
  }, [triggerConfetti])

  const schoolPride = useCallback(() => {
    // School colors burst
    const colors = ['#ff1744', '#2196f3', '#ffc107', '#4caf50']
    
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        triggerConfetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: colors
        })
      }, i * 300)
    }
  }, [triggerConfetti])

  const hearts = useCallback(() => {
    // Heart-shaped confetti effect
    triggerConfetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#ff69b4', '#ff1493', '#ffc0cb', '#ffb6c1']
    })
  }, [triggerConfetti])

  const stars = useCallback(() => {
    // Star burst effect
    triggerConfetti({
      particleCount: 100,
      spread: 360,
      origin: { y: 0.5 },
      colors: ['#ffd700', '#ffed4e', '#fff59d'],
      gravity: 0.3
    })
  }, [triggerConfetti])

  const fireworks = useCallback(() => {
    // Firework burst pattern
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, gravity: 0.3 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      
      triggerConfetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      
      triggerConfetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)
  }, [triggerConfetti])

  return {
    triggerConfetti,
    celebrateSuccess,
    celebratePost,
    celebrateReaction,
    celebrateUpload,
    schoolPride,
    hearts,
    stars,
    fireworks
  }
}