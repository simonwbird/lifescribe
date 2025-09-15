import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Palette, Zap, Eye, Type, Gauge } from 'lucide-react'
import { useMode } from '@/contexts/ModeContext'

export default function ModeToggle() {
  const { mode, setMode, flags, loading } = useMode()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Interface Mode
              <Badge variant={mode === 'simple' ? 'secondary' : 'default'}>
                {mode === 'simple' ? 'Simple' : 'Studio'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Choose how you want to experience LifeScribe
            </CardDescription>
          </div>
          <Switch
            checked={mode === 'studio'}
            onCheckedChange={(checked) => setMode(checked ? 'studio' : 'simple')}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Simple Mode */}
          <div className={`p-4 rounded-lg border-2 transition-colors ${
            mode === 'simple' 
              ? 'border-primary bg-primary/5' 
              : 'border-border bg-background'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4" />
              <span className="font-semibold">Simple Mode</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Clean, focused interface perfect for capturing memories without distractions
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Type className="h-3 w-3" />
                Larger text & buttons
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Gauge className="h-3 w-3" />
                Spacious layout
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Zap className="h-3 w-3" />
                Essential features only
              </div>
            </div>
          </div>

          {/* Studio Mode */}
          <div className={`p-4 rounded-lg border-2 transition-colors ${
            mode === 'studio' 
              ? 'border-primary bg-primary/5' 
              : 'border-border bg-background'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Palette className="h-4 w-4" />
              <span className="font-semibold">Studio Mode</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Full-featured interface with all tools and advanced capabilities
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Type className="h-3 w-3" />
                Compact design
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Gauge className="h-3 w-3" />
                Dense layout
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Zap className="h-3 w-3" />
                Advanced features
              </div>
            </div>
          </div>
        </div>

        {/* Current Settings Display */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Active Settings</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Density: <span className="font-mono">{flags.density}</span></div>
            <div>Typography: <span className="font-mono">{flags.typography}</span></div>
            <div>Motion: <span className="font-mono">{flags.motion}</span></div>
            <div>Create Menu: <span className="font-mono">{flags.showCreateMenu ? 'visible' : 'hidden'}</span></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}