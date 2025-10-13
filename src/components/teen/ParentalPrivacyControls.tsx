import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, MessageCircleOff, AlertTriangle } from 'lucide-react';

interface ParentalPrivacyControlsProps {
  userId: string;
  familyId: string;
  isParent?: boolean;
}

interface PrivacySettings {
  visibility: string;
  dms_enabled: boolean;
  parental_monitor_enabled: boolean;
}

export function ParentalPrivacyControls({ userId, familyId, isParent = false }: ParentalPrivacyControlsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<PrivacySettings>({
    queryKey: ['teen-privacy-settings', userId, familyId],
    queryFn: async (): Promise<PrivacySettings> => {
      const { data, error } = await supabase
        .from('teen_privacy_settings' as any)
        .select('*')
        .eq('user_id', userId)
        .eq('family_id', familyId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Create default settings if none exist
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('teen_privacy_settings' as any)
          .insert({
            user_id: userId,
            family_id: familyId,
            visibility: 'family',
            dms_enabled: false,
            parental_monitor_enabled: true
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newData as any;
      }

      return data as any;
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('teen_privacy_settings' as any)
        .update(updates)
        .eq('user_id', userId)
        .eq('family_id', familyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teen-privacy-settings', userId, familyId] });
      toast({
        title: "Settings updated",
        description: "Privacy settings have been saved."
      });
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Could not update privacy settings.",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isReadOnly = isParent;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Privacy & Safety
        </CardTitle>
        <CardDescription>
          {isParent 
            ? "View your teen's privacy settings"
            : "Control who can see your content and interact with you"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visibility Setting */}
        <div className="space-y-2">
          <Label htmlFor="visibility" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Content Visibility
          </Label>
          <Select
            value={settings?.visibility || 'family'}
            onValueChange={(value) => !isReadOnly && updateSettingsMutation.mutate({ visibility: value })}
            disabled={isReadOnly}
          >
            <SelectTrigger id="visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="family">Family Only</SelectItem>
              <SelectItem value="private">Private (Only Me)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {settings?.visibility === 'family' 
              ? 'Your family members can see your posts'
              : 'Only you can see your posts'}
          </p>
        </div>

        {/* DMs Setting */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="dms" className="flex items-center gap-2">
              <MessageCircleOff className="h-4 w-4" />
              Direct Messages
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow family members to send you direct messages
            </p>
          </div>
          <Switch
            id="dms"
            checked={settings?.dms_enabled || false}
            onCheckedChange={(checked) => !isReadOnly && updateSettingsMutation.mutate({ dms_enabled: checked })}
            disabled={isReadOnly}
          />
        </div>

        {/* Parental Monitoring */}
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="monitoring" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Parental Monitoring
            </Label>
            <p className="text-sm text-muted-foreground">
              {isParent 
                ? 'You can view their privacy settings and activity'
                : 'Parents/guardians can view your activity and settings'}
            </p>
          </div>
          <Switch
            id="monitoring"
            checked={settings?.parental_monitor_enabled ?? true}
            onCheckedChange={(checked) => !isReadOnly && updateSettingsMutation.mutate({ parental_monitor_enabled: checked })}
            disabled={isReadOnly}
          />
        </div>

        {isParent && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Parent View
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              These are the current privacy settings for this user. You can view but not modify them.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
