import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MousePointer, 
  Move3D, 
  Plus, 
  Zap, 
  X, 
  ChevronRight,
  ChevronLeft,
  Grid3x3
} from 'lucide-react'

interface TutorialStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  position: { x: number; y: number }
  highlight?: string
}

interface FamilyTreeTutorialProps {
  onClose: () => void
  onComplete: () => void
  isVisible: boolean
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Interactive Family Tree!',
    description: 'Let\'s take a quick tour of the drag-and-drop family tree editor. You\'ll learn how to organize your family in just a few steps.',
    icon: Zap,
    position: { x: 50, y: 20 }
  },
  {
    id: 'drag-drop',
    title: 'Drag & Drop People',
    description: 'Click and drag any family member card to move them around. They automatically snap to a grid for neat alignment.',
    icon: Move3D,
    position: { x: 30, y: 40 },
    highlight: 'person-card'
  },
  {
    id: 'hotspots',
    title: 'Smart Connection Hotspots',
    description: 'Hover over any person card to see connection hotspots. Green for parents, blue for children, pink for spouses!',
    icon: Plus,
    position: { x: 70, y: 40 },
    highlight: 'hotspots'
  },
  {
    id: 'zoom-pan',
    title: 'Navigate Large Trees',
    description: 'Use mouse wheel to zoom, click and drag the background to pan. Use the controls in the bottom-right for auto-layout.',
    icon: MousePointer,
    position: { x: 80, y: 80 },
    highlight: 'zoom-controls'
  },
  {
    id: 'grid-snap',
    title: 'Grid Alignment',
    description: 'Everything snaps to an invisible grid for professional organization. Toggle the grid visibility in the controls.',
    icon: Grid3x3,
    position: { x: 20, y: 70 }
  }
]

export default function FamilyTreeTutorial({ onClose, onComplete, isVisible }: FamilyTreeTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Auto-advance through steps for demo
    if (!isVisible) return

    const timer = setTimeout(() => {
      if (currentStep < tutorialSteps.length - 1) {
        setCurrentStep(prev => prev + 1)
      }
    }, 4000) // 4 seconds per step

    return () => clearTimeout(timer)
  }, [currentStep, isVisible])

  if (!isVisible) return null

  const currentTutorialStep = tutorialSteps[currentStep]

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(prev => prev + 1)
        setIsAnimating(false)
      }, 200)
    } else {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(prev => prev - 1)
        setIsAnimating(false)
      }, 200)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm">
        {/* Tutorial Card */}
        <Card 
          className={`absolute w-80 bg-white shadow-2xl border-2 border-primary transition-all duration-500 ${
            isAnimating ? 'scale-95 opacity-70' : 'scale-100 opacity-100'
          }`}
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                  <currentTutorialStep.icon className="w-5 h-5 text-white" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  Step {currentStep + 1} of {tutorialSteps.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold leading-tight">
                {currentTutorialStep.title}
              </h3>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                {currentTutorialStep.description}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                />
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-gray-500"
                >
                  Skip Tutorial
                </Button>

                <Button
                  onClick={handleNext}
                  size="sm"
                  className="flex items-center"
                >
                  {currentStep === tutorialSteps.length - 1 ? 'Get Started!' : 'Next'}
                  {currentStep !== tutorialSteps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Highlight Elements */}
        {currentTutorialStep.highlight && (
          <div className="absolute inset-0 pointer-events-none">
            {/* This would highlight specific elements based on the highlight prop */}
            <div 
              className="absolute border-4 border-primary rounded-lg animate-pulse"
              style={{
                // Dynamic positioning based on highlight target
                left: '20%',
                top: '30%',
                width: '200px',
                height: '150px'
              }}
            />
          </div>
        )}

        {/* Interactive Hints */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 text-sm text-gray-600 shadow-lg">
            💡 Tip: You can pause this tutorial anytime and explore on your own!
          </div>
        </div>
      </div>
    </>
  )
}