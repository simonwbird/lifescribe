import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MVPMetricsDashboard from '@/components/analytics/MVPMetricsDashboard'
import AuthGate from '@/components/AuthGate'
import Header from '@/components/Header'
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
  Eye,
  Users
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useLabs } from '@/hooks/useLabs'
import { useMode } from '@/contexts/ModeContext'

const FEATURES = [
  {
    id: 'collections' as const,
    title: 'Collections',
    description: 'Manage recipes, heirlooms/objects, homes/properties, and pets',
    icon: Archive,
    status: 'beta',
  },
  {
    id: 'multiSpaces' as const,
    title: 'Multiple Family Spaces',
    description: 'Keep branches separate (e.g., in-laws, extended clan) with their own feeds and digests. May be unstable.',
    icon: Users,
    status: 'experimental',
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
      <AuthGate>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </AuthGate>
    )
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Labs</h1>
              <p className="text-muted-foreground">
                Experimental features and analytics
              </p>
            </div>

            <Tabs defaultValue="features" className="w-full">
              <TabsList>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="features" className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Experimental Features</h2>
                  <p className="text-muted-foreground mb-6">
                    Early access to new functionality - some features may be unstable
                  </p>
                </div>

                {/* Labs Toggle */}
                <Card>
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
                    <Alert>
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
                  </>
                )}

                <Separator />

                <div className="text-sm text-muted-foreground">
                  <p>Features marked as experimental may change or be removed without notice.</p>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <MVPMetricsDashboard />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AuthGate>
  )
}