import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Beaker, 
  ArrowLeft, 
  Archive, 
  PenTool, 
  TreePine, 
  FileSpreadsheet, 
  BarChart3, 
  Bell, 
  Shield,
  Info,
  Eye
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useLabs } from '@/hooks/useLabs'
import { useMode } from '@/contexts/ModeContext'
import Header from '@/components/Header'

const FEATURES = [
  {
    id: 'collections' as const,
    title: 'Collections',
    description: 'Manage recipes, heirlooms/objects, homes/properties, and pets',
    icon: Archive,
    status: 'beta',
  },
  {
    id: 'advancedComposer' as const,
    title: 'Advanced Composer',
    description: 'Multi-asset story editor with enhanced media capabilities',
    icon: PenTool,
    status: 'experimental',
  },
  {
    id: 'alternateTreeViews' as const,
    title: 'Alternate Tree Views',
    description: 'Fan chart, canvas/zoom layout, and generational tree views',
    icon: TreePine,
    status: 'beta',
  },
  {
    id: 'gedcomImport' as const,
    title: 'GEDCOM / CSV Import–Export',
    description: 'Import and export family tree data in standard formats',
    icon: FileSpreadsheet,
    status: 'experimental',
  },
  {
    id: 'analytics' as const,
    title: 'Analytics Dashboard',
    description: 'View insights about your family story collection',
    icon: BarChart3,
    status: 'experimental',
  },
  {
    id: 'notifications' as const,
    title: 'Realtime Notifications',
    description: 'Get notified about family activity and updates',
    icon: Bell,
    status: 'experimental',
  },
  {
    id: 'safeBox' as const,
    title: 'Safe Box / Documents',
    description: 'Secure storage for important family documents',
    icon: Shield,
    status: 'coming-soon',
  },
]

export default function Labs() {
  const navigate = useNavigate()
  const { labsEnabled, flags, loading, updateLabsEnabled, updateFlag } = useLabs()
  const { mode } = useMode()
  const isSimpleMode = mode === 'simple'

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Beaker className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Labs</h1>
              <p className="text-muted-foreground">
                Experimental features and early access
              </p>
            </div>
          </div>
        </div>

        {/* Labs Toggle */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Enable Labs Features
                  <Badge variant="secondary">Experimental</Badge>
                  {isSimpleMode && <Badge variant="outline">Simple Mode</Badge>}
                </CardTitle>
                <CardDescription>
                  {isSimpleMode 
                    ? "Labs features are available but simplified in Simple Mode for easier use."
                    : "Turn on experimental features and get early access to new capabilities. Features may be unstable."
                  }
                </CardDescription>
              </div>
              <Switch
                checked={labsEnabled}
                onCheckedChange={updateLabsEnabled}
                disabled={isSimpleMode}
              />
            </div>
          </CardHeader>
        </Card>

        {!labsEnabled && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {isSimpleMode 
                ? "Labs features are simplified in Simple Mode. Switch to Studio Mode in your profile for full access."
                : "Enable Labs to access experimental features. These features are in development and may change or be removed."
              }
            </AlertDescription>
          </Alert>
        )}

        {labsEnabled && (
          <>
            <Alert className="mb-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Labs features are experimental and may be unstable. Use with caution in production workflows.
              </AlertDescription>
            </Alert>

            {/* Feature Toggles */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Feature Flags</h2>
              
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                const isComingSoon = feature.status === 'coming-soon'
                
                return (
                  <Card key={feature.id} className={isComingSoon ? 'opacity-60' : ''}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-4">
                          <Icon className="h-6 w-6 text-primary mt-1 shrink-0" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{feature.title}</h3>
                              <Badge 
                                variant={
                                  feature.status === 'beta' ? 'default' : 
                                  feature.status === 'experimental' ? 'secondary' : 
                                  'outline'
                                }
                                className="text-xs"
                              >
                                {feature.status === 'coming-soon' ? 'Coming Soon' : feature.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        
                        <Switch
                          checked={flags[feature.id]}
                          onCheckedChange={(checked) => updateFlag(feature.id, checked)}
                          disabled={isComingSoon || (isSimpleMode && !labsEnabled)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Separator className="my-8" />

            {/* Footer */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Have feedback on Labs features? Let us know how we can improve.
              </p>
              <Button variant="outline" asChild>
                <Link to="/help">
                  Send Feedback
                </Link>
              </Button>
            </div>
          </>
        )}

        {isSimpleMode && (
          <Alert>
            <Eye className="h-4 w-4" />
            <AlertDescription>
              You're viewing Labs in Simple Mode. Advanced features are simplified for easier use. Switch to Studio Mode in your profile for full control over Labs features.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </>
  )
}