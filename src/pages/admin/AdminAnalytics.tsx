import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FunnelDashboard } from '@/components/analytics/FunnelDashboard'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, Zap, Target, BarChart3, TestTube } from 'lucide-react'
import { TrustMicrocopy } from '@/components/microcopy/TrustMicrocopy'

export default function AdminAnalytics() {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d')
  const [selectedFamily, setSelectedFamily] = useState<string>('all')

  const activeExperiments = [
    {
      id: 'prompt_visual_test',
      name: 'Prompt Visual Design',
      status: 'active',
      traffic: 50,
      variants: ['Control', 'Enhanced Visual'],
      startDate: '2025-09-20'
    },
    {
      id: 'cta_copy_test', 
      name: 'CTA Copy Variations',
      status: 'active',
      traffic: 100,
      variants: ['Create Story', 'Share Memory', 'Record Story'],
      startDate: '2025-09-15'
    }
  ]

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 font-serif font-semibold text-foreground">
            Analytics & Experiments
          </h1>
          <p className="text-muted-foreground mt-1">
            Data-driven insights and A/B test management
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedFamily} onValueChange={setSelectedFamily}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All families" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All families</SelectItem>
              <SelectItem value="family1">Bird Family</SelectItem>
              <SelectItem value="family2">Test Family</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="funnels" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="funnels" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Funnels
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="experiments" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            A/B Tests
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="funnels">
          <FunnelDashboard 
            familyId={selectedFamily === 'all' ? undefined : selectedFamily}
            timeframe={timeframe}
          />
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Tracking Status</CardTitle>
              <CardDescription>
                Monitor data quality and event coverage across key user flows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'prompt_view', count: '2,341', coverage: 98 },
                  { name: 'story_start', count: '1,203', coverage: 97 },
                  { name: 'story_save', count: '891', coverage: 99 },
                  { name: 'invite_send', count: '156', coverage: 96 }
                ].map(event => (
                  <div key={event.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{event.name}</h4>
                      <Badge variant={event.coverage >= 98 ? 'default' : 'secondary'}>
                        {event.coverage}%
                      </Badge>
                    </div>
                    <div className="text-h3 font-bold">{event.count}</div>
                    <div className="text-xs text-muted-foreground">Events (30d)</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experiments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Experiments</CardTitle>
              <CardDescription>
                Manage A/B tests for prompt visuals, CTA copy, and card density
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeExperiments.map(experiment => (
                  <div key={experiment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{experiment.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{experiment.status}</Badge>
                          <span>{experiment.traffic}% traffic</span>
                          <span>Started {experiment.startDate}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        View Results
                      </Button>
                    </div>
                    <div className="mt-3">
                      <div className="text-sm text-muted-foreground mb-1">Variants:</div>
                      <div className="flex gap-2">
                        {experiment.variants.map(variant => (
                          <Badge key={variant} variant="secondary" className="text-xs">
                            {variant}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Data-driven findings and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-heritage-primary/10 rounded border-l-4 border-heritage-primary">
                  <h4 className="font-medium text-sm mb-1">Prompt Engagement</h4>
                  <p className="text-sm text-muted-foreground">
                    Visual prompts show 23% higher conversion than text-only variants
                  </p>
                </div>
                <div className="p-3 bg-secondary/10 rounded border-l-4 border-secondary">
                  <h4 className="font-medium text-sm mb-1">CTA Performance</h4>
                  <p className="text-sm text-muted-foreground">
                    "Share Memory" outperforms "Create Story" by 18% in completion rate
                  </p>
                </div>
                <div className="p-3 bg-accent/10 rounded border-l-4 border-accent">
                  <h4 className="font-medium text-sm mb-1">Card Density</h4>
                  <p className="text-sm text-muted-foreground">
                    Compact layout increases prompt views by 31% on mobile devices
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Quality</CardTitle>
                <CardDescription>Event tracking health and coverage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overall Coverage</span>
                    <Badge variant="default">98.2%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Missing Events</span>
                    <span className="text-sm text-muted-foreground">1.8% (Target: &lt;2%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Experiments</span>
                    <span className="text-sm text-muted-foreground">2/month (Target: 2+)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="p-3 text-sm text-muted-foreground bg-heritage-cream/10 rounded border border-heritage-primary/20">
        All analytics data is aggregated and anonymized to protect user privacy while providing valuable insights for product improvement.
      </div>
    </div>
  )
}