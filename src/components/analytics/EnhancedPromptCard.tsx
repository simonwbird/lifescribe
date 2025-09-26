import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useABTest } from './ABTestProvider'
import { useEnhancedAnalytics } from '@/hooks/useEnhancedAnalytics'
import { Lightbulb, Mic, Pen, Camera } from 'lucide-react'

interface EnhancedPromptCardProps {
  prompt: {
    id: string
    text: string
    type: string
  }
  position: number
  source: string
  onPromptSelect: (promptId: string) => void
}

export function EnhancedPromptCard({ prompt, position, source, onPromptSelect }: EnhancedPromptCardProps) {
  const { getTestConfig } = useABTest()
  const { trackPromptView, trackStoryStart } = useEnhancedAnalytics()
  const [visualConfig, setVisualConfig] = useState<any>(null)
  const [ctaConfig, setCTAConfig] = useState<any>(null)
  const [densityConfig, setDensityConfig] = useState<any>(null)

  useEffect(() => {
    // Load AB test configurations
    const loadConfigs = async () => {
      const [visual, cta, density] = await Promise.all([
        getTestConfig('prompt_visual_test'),
        getTestConfig('cta_copy_test'),
        getTestConfig('card_density_test')
      ])
      
      setVisualConfig(visual)
      setCTAConfig(cta)
      setDensityConfig(density)
    }

    loadConfigs()

    // Track prompt view
    trackPromptView(prompt.id, prompt.type, position, source)
  }, [prompt.id, position, source, getTestConfig, trackPromptView])

  const handlePromptClick = () => {
    trackStoryStart('voice', prompt.id, 'prompt')
    onPromptSelect(prompt.id)
  }

  // Apply visual variant styles
  const isEnhanced = visualConfig?.style === 'enhanced'
  const showIcons = visualConfig?.showIcons === true
  
  // Apply density variant
  const isCompact = densityConfig?.density === 'compact'
  
  // Apply CTA variant
  const ctaText = ctaConfig?.text || 'Create Story'

  const getPromptIcon = () => {
    switch (prompt.type) {
      case 'voice': return <Mic className="w-4 h-4" />
      case 'photo': return <Camera className="w-4 h-4" />
      case 'text': return <Pen className="w-4 h-4" />
      default: return <Lightbulb className="w-4 h-4" />
    }
  }

  return (
    <Card className={`
      group cursor-pointer transition-all duration-200 
      ${isEnhanced ? 'bg-gradient-to-br from-background to-muted/50 border-primary/20' : 'bg-background'}
      ${isCompact ? 'p-3' : 'p-4'}
      hover:border-primary/40 hover:shadow-md hover:scale-[1.02]
    `}>
      <CardContent className={`${isCompact ? 'p-3' : 'p-4'}`}>
        <div className="space-y-3">
          {/* Header with icon and type badge */}
          {(showIcons || isEnhanced) && (
            <div className="flex items-center justify-between">
              {showIcons && (
                <div className="flex items-center gap-2 text-primary">
                  {getPromptIcon()}
                  <Badge variant="secondary" className="text-xs">
                    {prompt.type}
                  </Badge>
                </div>
              )}
            </div>
          )}
          
          {/* Prompt text */}
          <p className={`
            ${isCompact ? 'text-sm' : 'text-body'} 
            text-foreground leading-relaxed
            ${isEnhanced ? 'font-medium' : ''}
          `}>
            {prompt.text}
          </p>
          
          {/* CTA Button */}
          <Button 
            onClick={handlePromptClick}
            className={`
              w-full transition-colors
              ${isEnhanced ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary' : ''}
            `}
            size={isCompact ? 'sm' : 'default'}
          >
            {ctaText}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}