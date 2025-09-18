import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Play, Pause, BarChart3, Settings, Zap, Mail, Smartphone, Bell } from 'lucide-react';
import { useNudgeData } from '@/hooks/useNudgeData';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { Nudge, NudgeStatus } from '@/lib/nudgeTypes';
import { NUDGE_TRIGGER_LABELS, NUDGE_CHANNEL_LABELS } from '@/lib/nudgeTypes';
import { NudgeCreateModal } from './NudgeCreateModal';
import { NudgeAnalyticsModal } from './NudgeAnalyticsModal';

const getStatusColor = (status: NudgeStatus) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200';
    case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'email': return <Mail className="h-4 w-4" />;
    case 'sms': return <Smartphone className="h-4 w-4" />;
    case 'in_app': return <Bell className="h-4 w-4" />;
    case 'push': return <Zap className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
  }
};

export default function NudgeOrchestrator() {
  const { nudges, templates, loading, updateNudge } = useNudgeData();
  const { track } = useAnalytics();
  const [selectedTab, setSelectedTab] = useState('nudges');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [analyticsNudgeId, setAnalyticsNudgeId] = useState<string | null>(null);

  const handleStatusToggle = async (nudge: Nudge) => {
    const newStatus = nudge.status === 'active' ? 'paused' : 'active';
    
    try {
      await updateNudge(nudge.id, { 
        status: newStatus,
        ...(newStatus === 'active' && !nudge.started_at ? { started_at: new Date().toISOString() } : {})
      });
      
      track('NUDGE_STATUS_CHANGED' as any, {
        nudge_id: nudge.id,
        nudge_name: nudge.name,
        old_status: nudge.status,
        new_status: newStatus
      });
    } catch (error) {
      console.error('Failed to toggle nudge status:', error);
    }
  };

  const handleCreateNudge = () => {
    setShowCreateModal(true);
    track('NUDGE_CREATE_STARTED' as any, {});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nudge Orchestrator</h1>
          <p className="text-muted-foreground">
            Configure and A/B test enablement nudges to drive user engagement
          </p>
        </div>
        <Button onClick={handleCreateNudge}>
          <Plus className="h-4 w-4 mr-2" />
          Create Nudge
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="nudges">Active Nudges</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="nudges" className="space-y-4">
          {nudges.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No nudges configured</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first nudge to start driving user engagement
                </p>
                <Button onClick={handleCreateNudge}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Nudge
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {nudges.map((nudge) => (
                <Card key={nudge.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          {getChannelIcon(nudge.channel)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{nudge.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {NUDGE_TRIGGER_LABELS[nudge.trigger_type]} • {NUDGE_CHANNEL_LABELS[nudge.channel]}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {nudge.is_ab_test && (
                          <Badge variant="outline">A/B Test</Badge>
                        )}
                        <Badge className={getStatusColor(nudge.status)}>
                          {nudge.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {nudge.description && (
                          <p className="mb-2">{nudge.description}</p>
                        )}
                        <p>
                          Conversion window: {nudge.conversion_window_hours}h • 
                          Throttle: {nudge.throttle_config.max_per_day}/day
                        </p>
                        {nudge.is_ab_test && (
                          <p>
                            Holdout: {nudge.holdout_percentage}% • 
                            Variant A: {nudge.variant_a_percentage}% • 
                            Variant B: {100 - nudge.variant_a_percentage - nudge.holdout_percentage}%
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAnalyticsNudgeId(nudge.id)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </Button>
                        <Button
                          variant={nudge.status === 'active' ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleStatusToggle(nudge)}
                        >
                          {nudge.status === 'active' ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        {getChannelIcon(template.channel)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {NUDGE_CHANNEL_LABELS[template.channel]} • {template.category}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{template.variables.length} variables</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {template.subject && (
                      <p className="font-medium">Subject: {template.subject}</p>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {template.content}
                    </p>
                    {template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Performance Analytics</h3>
              <p className="text-muted-foreground">
                Click on a nudge's Analytics button to view detailed performance metrics
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NudgeCreateModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        templates={templates}
      />

      {analyticsNudgeId && (
        <NudgeAnalyticsModal
          nudgeId={analyticsNudgeId}
          open={!!analyticsNudgeId}
          onOpenChange={() => setAnalyticsNudgeId(null)}
        />
      )}
    </div>
  );
}