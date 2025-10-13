import { Clock, Unlock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVaultAccessConditions, useUpdateAccessCondition } from '@/hooks/useVault';
import { format } from 'date-fns';

interface VaultAccessConditionsProps {
  sectionId: string;
  familyId: string;
}

export default function VaultAccessConditions({ sectionId, familyId }: VaultAccessConditionsProps) {
  const { data: conditions } = useVaultAccessConditions(sectionId);
  const updateCondition = useUpdateAccessCondition();

  const handleUnlock = async (conditionId: string) => {
    await updateCondition.mutateAsync({
      id: conditionId,
      updates: {
        is_unlocked: true,
        unlocked_at: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-1">Access Conditions</h3>
        <p className="text-sm text-muted-foreground">
          Define when delegates can access this section
        </p>
      </div>

      {!conditions || conditions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              No access conditions set. Section is manually controlled.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {conditions.map((condition) => (
            <Card key={condition.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {condition.condition_type === 'time_lock' ? (
                      <Clock className="h-5 w-5 text-amber-500" />
                    ) : condition.condition_type === 'death_verification' ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <Unlock className="h-5 w-5 text-blue-500" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium capitalize">
                        {condition.condition_type.replace('_', ' ')}
                      </div>
                      {condition.unlock_date && (
                        <div className="text-sm text-muted-foreground">
                          Unlocks: {format(new Date(condition.unlock_date), 'PPP')}
                        </div>
                      )}
                      {condition.is_unlocked && condition.unlocked_at && (
                        <div className="text-sm text-green-600">
                          Unlocked {format(new Date(condition.unlocked_at), 'PPp')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {condition.is_unlocked ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700">
                        Unlocked
                      </Badge>
                    ) : condition.condition_type === 'admin_unlock' ? (
                      <Button
                        size="sm"
                        onClick={() => handleUnlock(condition.id)}
                        disabled={updateCondition.isPending}
                      >
                        <Unlock className="h-4 w-4 mr-2" />
                        Unlock Now
                      </Button>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-700">
                        Locked
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
