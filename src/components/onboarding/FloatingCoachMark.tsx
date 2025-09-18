import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, Sparkles, X, ArrowUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface FloatingCoachMarkProps {
  profileId: string
  familyId: string
}

export default function FloatingCoachMark({ profileId, familyId }: FloatingCoachMarkProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isPulsing, setIsPulsing] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    checkShouldShow()
  }, [profileId, familyId])

  const checkShouldShow = async () => {
    try {
      // Don't show if user has already dismissed
      const dismissed = localStorage.getItem(`coach-mark-dismissed-${profileId}`)
      if (dismissed) return

      // Check if user has recorded any stories
      const { data: stories } = await supabase
        .from('stories')
        .select('id')
        .eq('profile_id', profileId)
        .limit(1)

      // Only show if no stories recorded yet
      if (!stories || stories.length === 0) {
        setIsVisible(true)
        
        // Auto-expand after 2 seconds if still visible
        setTimeout(() => {
          setIsExpanded(true)
          setIsPulsing(false)
        }, 2000)
      }
    } catch (error) {
      console.error('Error checking coach mark visibility:', error)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(`coach-mark-dismissed-${profileId}`, 'true')
  }

  const handleStartRecording = () => {
    handleDismiss()
    window.location.href = '/stories/new?type=voice&coach=true'
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
      {!isExpanded ? (
        // Floating pulse button
        <Button
          onClick={() => setIsExpanded(true)}
          className={`
            relative w-16 h-16 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 
            hover:from-brand-600 hover:to-brand-700 shadow-xl
            ${isPulsing ? 'animate-pulse' : ''}
          `}
        >
          <Mic className="h-6 w-6 text-white" />
          
          {/* Ripple effect */}
          <div className="absolute inset-0 rounded-full animate-ping bg-brand-400 opacity-20" />
          
          {/* Badge */}
          <Badge className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs animate-bounce">
            Start Here!
          </Badge>
        </Button>
      ) : (
        // Expanded coach mark
        <Card className="w-80 shadow-2xl border-brand-200 bg-gradient-to-br from-white to-brand-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">
                  Quick Start
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="text-center space-y-3">
              <h3 className="font-semibold text-lg text-brand-900">
                Record Your First Memory
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Share a story that matters to you. It could be about a special moment, 
                a family tradition, or someone you love. Just 60 seconds is all it takes!
              </p>
              
              <div className="bg-brand-100/50 rounded-lg p-3 mb-4">
                <p className="text-xs text-brand-700 font-medium flex items-center justify-center gap-1">
                  <ArrowUp className="h-3 w-3" />
                  Voice recordings are treasured most by families
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDismiss}
                  className="flex-1"
                  size="sm"
                >
                  Later
                </Button>
                <Button
                  onClick={handleStartRecording}
                  className="flex-1 bg-brand-600 hover:bg-brand-700"
                  size="sm"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Start Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}