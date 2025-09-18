import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Users, Target, Clock } from 'lucide-react';
import { useNudgeData } from '@/hooks/useNudgeData';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useToast } from '@/hooks/use-toast';
import type { NudgeTemplate, NudgeTriggerType, NudgeChannelType } from '@/lib/nudgeTypes';
import { NUDGE_TRIGGER_LABELS, NUDGE_CHANNEL_LABELS, CONVERSION_EVENT_LABELS } from '@/lib/nudgeTypes';

interface NudgeCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: NudgeTemplate[];
}

export function NudgeCreateModal({ open, onOpenChange, templates }: NudgeCreateModalProps) {
  const { createNudge, estimateAudience } = useNudgeData();
  const { track } = useAnalytics();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: '' as NudgeTriggerType,
    channel: '' as NudgeChannelType,
    template_id: '',
    is_ab_test: false,
    holdout_percentage: 10,
    variant_a_percentage: 45,
    variant_b_template_id: '',
    conversion_window_hours: 72,
    conversion_events: ['MEMORY_RECORDED'] as string[],
    throttle_max_per_day: 1,
    throttle_min_interval_hours: 24
  });
  
  const [audienceEstimate, setAudienceEstimate] = useState({
    total_users: 0,
    eligible_users: 0,
    holdout_users: 0,
    variant_a_users: 0,
    variant_b_users: 0
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEstimateAudience = async () => {
    if (formData.trigger_type) {
      try {
        const estimate = await estimateAudience(formData.trigger_type, {});
        setAudienceEstimate(estimate);
      } catch (error) {
        console.error('Error estimating audience:', error);
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.trigger_type || !formData.channel || !formData.template_id) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    if (formData.is_ab_test && !formData.variant_b_template_id) {
      toast({
        title: 'Missing A/B test template',
        description: 'Please select a template for variant B',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createNudge({
        name: formData.name,
        description: formData.description,
        trigger_type: formData.trigger_type,
        channel: formData.channel,
        template_id: formData.template_id,
        is_ab_test: formData.is_ab_test,
        holdout_percentage: formData.holdout_percentage,
        variant_a_percentage: formData.variant_a_percentage,
        variant_b_template_id: formData.variant_b_template_id,
        conversion_window_hours: formData.conversion_window_hours,
        conversion_events: formData.conversion_events,
        throttle_config: {
          max_per_day: formData.throttle_max_per_day,
          min_interval_hours: formData.throttle_min_interval_hours
        },
        trigger_config: {},
        audience_rules: {},
        status: 'draft'
      });

      track('NUDGE_CREATED' as any, {
        nudge_name: formData.name,
        trigger_type: formData.trigger_type,
        channel: formData.channel,
        is_ab_test: formData.is_ab_test,
        estimated_audience: audienceEstimate.eligible_users
      });

      toast({
        title: 'Nudge created successfully',
        description: 'Your nudge has been created and is ready to configure'
      });

      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        trigger_type: '' as NudgeTriggerType,
        channel: '' as NudgeChannelType,
        template_id: '',
        is_ab_test: false,
        holdout_percentage: 10,
        variant_a_percentage: 45,
        variant_b_template_id: '',
        conversion_window_hours: 72,
        conversion_events: ['MEMORY_RECORDED'],
        throttle_max_per_day: 1,
        throttle_min_interval_hours: 24
      });
    } catch (error) {
      console.error('Error creating nudge:', error);
      toast({
        title: 'Error creating nudge',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableTemplates = templates.filter(t => t.channel === formData.channel);
  const variantBTemplates = availableTemplates.filter(t => t.id !== formData.template_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Nudge</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Nudge Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., First Memory Onboarding"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the purpose and goal of this nudge"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Trigger & Channel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trigger & Channel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Trigger Event *</Label>
                  <Select 
                    value={formData.trigger_type} 
                    onValueChange={(value: NudgeTriggerType) => {
                      setFormData(prev => ({ ...prev, trigger_type: value }));
                      handleEstimateAudience();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger event" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(NUDGE_TRIGGER_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Channel *</Label>
                  <Select 
                    value={formData.channel} 
                    onValueChange={(value: NudgeChannelType) => 
                      setFormData(prev => ({ ...prev, channel: value, template_id: '', variant_b_template_id: '' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select communication channel" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(NUDGE_CHANNEL_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.channel && (
                  <div>
                    <Label>Template *</Label>
                    <Select 
                      value={formData.template_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, template_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select message template" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* A/B Testing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  A/B Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable A/B Testing</Label>
                    <p className="text-sm text-muted-foreground">
                      Test different variants to optimize performance
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_ab_test}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_ab_test: checked }))}
                  />
                </div>

                {formData.is_ab_test && (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="holdout">Holdout %</Label>
                        <Input
                          id="holdout"
                          type="number"
                          min="0"
                          max="50"
                          value={formData.holdout_percentage}
                          onChange={(e) => setFormData(prev => ({ ...prev, holdout_percentage: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="variant-a">Variant A %</Label>
                        <Input
                          id="variant-a"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.variant_a_percentage}
                          onChange={(e) => setFormData(prev => ({ ...prev, variant_a_percentage: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label>Variant B %</Label>
                        <Input
                          value={100 - formData.variant_a_percentage - formData.holdout_percentage}
                          disabled
                        />
                      </div>
                    </div>

                    {variantBTemplates.length > 0 && (
                      <div>
                        <Label>Variant B Template</Label>
                        <Select 
                          value={formData.variant_b_template_id} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, variant_b_template_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select template for variant B" />
                          </SelectTrigger>
                          <SelectContent>
                            {variantBTemplates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Conversion Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Conversion Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="conversion-window">Conversion Window (hours)</Label>
                  <Input
                    id="conversion-window"
                    type="number"
                    min="1"
                    max="720"
                    value={formData.conversion_window_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, conversion_window_hours: parseInt(e.target.value) || 72 }))}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    How long to track conversions after sending the nudge
                  </p>
                </div>

                <div>
                  <Label>Conversion Events</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(CONVERSION_EVENT_LABELS).map(([event, label]) => (
                      <Badge
                        key={event}
                        variant={formData.conversion_events.includes(event) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            conversion_events: prev.conversion_events.includes(event)
                              ? prev.conversion_events.filter(e => e !== event)
                              : [...prev.conversion_events, event]
                          }));
                        }}
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Audience Estimate */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Audience Estimate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {audienceEstimate.total_users > 0 ? (
                  <>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{audienceEstimate.eligible_users.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Eligible Users</div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Total Users</span>
                        <span>{audienceEstimate.total_users.toLocaleString()}</span>
                      </div>
                      {formData.is_ab_test && (
                        <>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Holdout</span>
                            <span>{audienceEstimate.holdout_users.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Variant A</span>
                            <span>{audienceEstimate.variant_a_users.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Variant B</span>
                            <span>{audienceEstimate.variant_b_users.toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Select a trigger to estimate audience size</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Creating...' : 'Create Nudge'}
              </Button>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}