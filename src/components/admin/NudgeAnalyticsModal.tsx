import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp, TrendingDown, Users, Mail, MousePointer, Target } from 'lucide-react';
import { useNudgeData } from '@/hooks/useNudgeData';
import type { NudgeAnalytics } from '@/lib/nudgeTypes';

interface NudgeAnalyticsModalProps {
  nudgeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--muted))'];

export function NudgeAnalyticsModal({ nudgeId, open, onOpenChange }: NudgeAnalyticsModalProps) {
  const { getNudgeAnalytics, nudges } = useNudgeData();
  const [analytics, setAnalytics] = useState<NudgeAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const nudge = nudges.find(n => n.id === nudgeId);

  useEffect(() => {
    if (open && nudgeId) {
      loadAnalytics();
    }
  }, [open, nudgeId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await getNudgeAnalytics(nudgeId);
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Nudge Analytics</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!analytics || !nudge) {
    return null;
  }

  const funnelData = [
    { name: 'Sent', value: analytics.total_sends, percentage: 100 },
    { name: 'Delivered', value: Math.round(analytics.total_sends * analytics.delivery_rate), percentage: analytics.delivery_rate * 100 },
    { name: 'Opened', value: Math.round(analytics.total_sends * analytics.open_rate), percentage: analytics.open_rate * 100 },
    { name: 'Clicked', value: Math.round(analytics.total_sends * analytics.click_rate), percentage: analytics.click_rate * 100 },
    { name: 'Converted', value: Math.round(analytics.total_sends * analytics.conversion_rate), percentage: analytics.conversion_rate * 100 }
  ];

  const variantData = [
    { name: 'Control', conversions: analytics.conversions_by_variant.control, fill: CHART_COLORS[0] },
    { name: 'Variant A', conversions: analytics.conversions_by_variant.a, fill: CHART_COLORS[1] },
    { name: 'Variant B', conversions: analytics.conversions_by_variant.b, fill: CHART_COLORS[2] }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Analytics: {nudge.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Sends</span>
                </div>
                <div className="text-2xl font-bold">{analytics.total_sends.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Delivery Rate</span>
                </div>
                <div className="text-2xl font-bold">{(analytics.delivery_rate * 100).toFixed(1)}%</div>
                <Progress value={analytics.delivery_rate * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MousePointer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Click Rate</span>
                </div>
                <div className="text-2xl font-bold">{(analytics.click_rate * 100).toFixed(1)}%</div>
                <Progress value={analytics.click_rate * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Conversion Rate</span>
                </div>
                <div className="text-2xl font-bold">{(analytics.conversion_rate * 100).toFixed(1)}%</div>
                <Progress value={analytics.conversion_rate * 100} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: 'Users',
                      color: 'hsl(var(--primary))'
                    }
                  }}
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={funnelData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        formatter={(value, name) => [
                          `${value.toLocaleString()} users`,
                          name
                        ]}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-4 space-y-2">
                  {funnelData.map((step, index) => (
                    <div key={step.name} className="flex items-center justify-between">
                      <span className="text-sm">{step.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{step.value.toLocaleString()}</span>
                        <Badge variant="outline">{step.percentage.toFixed(1)}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* A/B Test Results */}
            {nudge.is_ab_test && (
              <Card>
                <CardHeader>
                  <CardTitle>A/B Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      conversions: {
                        label: 'Conversions',
                        color: 'hsl(var(--primary))'
                      }
                    }}
                  >
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={variantData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="conversions"
                        >
                          {variantData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={<ChartTooltipContent />}
                          formatter={(value, name) => [
                            `${value} conversions`,
                            name
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  
                  <div className="mt-4 space-y-2">
                    {variantData.map((variant) => (
                      <div key={variant.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: variant.fill }} 
                          />
                          <span className="text-sm">{variant.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{variant.conversions}</span>
                          {variant.name === 'Variant B' && variant.conversions > analytics.conversions_by_variant.a && (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          )}
                          {variant.name === 'Variant B' && variant.conversions < analytics.conversions_by_variant.a && (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Additional Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analytics.avg_hours_to_convert.toFixed(1)}h</div>
                  <div className="text-sm text-muted-foreground">Average Time to Convert</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">{(analytics.open_rate * 100).toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Open Rate</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Object.values(analytics.conversions_by_variant).reduce((a, b) => a + b, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Conversions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}