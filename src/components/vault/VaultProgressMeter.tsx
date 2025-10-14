import { Shield, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useVaultProgress } from '@/hooks/useVault';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface VaultProgressMeterProps {
  familyId: string;
}

export default function VaultProgressMeter({ familyId }: VaultProgressMeterProps) {
  const { data: progress, isLoading } = useVaultProgress(familyId);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-2 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentage = (progress as any)?.progress_percentage || 0;
  const status = percentage < 30 ? 'low' : percentage < 70 ? 'medium' : 'high';

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          SafeBox Vault Readiness
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(percentage)}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            {(progress as any)?.sections_with_items > 0 ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <AlertCircle className="h-3 w-3 text-amber-500" />
            )}
            <div>
              <div className="font-medium">{(progress as any)?.sections_with_items}/{(progress as any)?.total_sections}</div>
              <div className="text-muted-foreground">Sections</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(progress as any)?.delegates_assigned > 0 ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <AlertCircle className="h-3 w-3 text-amber-500" />
            )}
            <div>
              <div className="font-medium">{(progress as any)?.delegates_assigned}</div>
              <div className="text-muted-foreground">Delegates</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(progress as any)?.total_items > 0 ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <AlertCircle className="h-3 w-3 text-amber-500" />
            )}
            <div>
              <div className="font-medium">{(progress as any)?.total_items}</div>
              <div className="text-muted-foreground">Items Stored</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(progress as any)?.checklists_completed > 0 ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <AlertCircle className="h-3 w-3 text-amber-500" />
            )}
            <div>
              <div className="font-medium">{(progress as any)?.checklists_completed}/{(progress as any)?.total_checklists}</div>
              <div className="text-muted-foreground">Checklist</div>
            </div>
          </div>
        </div>

        {status === 'low' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs">
            <div className="font-medium text-amber-700 dark:text-amber-400 mb-1">
              Getting Started
            </div>
            <div className="text-muted-foreground">
              Add important documents and assign delegates to protect your family's future.
            </div>
          </div>
        )}

        {status === 'medium' && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs">
            <div className="font-medium text-blue-700 dark:text-blue-400 mb-1">
              Good Progress
            </div>
            <div className="text-muted-foreground">
              You're building a solid foundation. Keep adding critical information.
            </div>
          </div>
        )}

        {status === 'high' && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-xs">
            <div className="font-medium text-green-700 dark:text-green-400 mb-1">
              Well Prepared
            </div>
            <div className="text-muted-foreground">
              Your vault is comprehensive. Review and update regularly.
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => navigate('/vault')} 
            className="text-xs"
            variant="outline"
            size="sm"
            aria-label="Open SafeBox Vault"
          >
            <Lock className="h-3 w-3 mr-1" />
            Open Vault
          </Button>
          <Button 
            onClick={() => navigate('/vault/docs/new')} 
            className="text-xs"
            variant="outline"
            size="sm"
            aria-label="Add new document"
          >
            Add Docs
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => navigate('/vault/delegates')} 
            className="text-xs"
            variant="outline"
            size="sm"
            aria-label="Manage delegates"
          >
            Delegates
          </Button>
          <Button 
            onClick={() => navigate('/vault/checklists')} 
            className="text-xs"
            variant="outline"
            size="sm"
            aria-label="View checklists"
          >
            Checklists
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
