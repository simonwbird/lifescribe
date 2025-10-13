import { useState } from 'react';
import { Plus, Users, Clock, Unlock, Lock, Download, Trash2 } from 'lucide-react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useVaultItems, 
  useVaultDelegates, 
  useVaultAccessConditions,
  useCheckVaultAccess,
  useCreateVaultItem 
} from '@/hooks/useVault';
import VaultItemForm from './VaultItemForm';
import VaultDelegateManager from './VaultDelegateManager';
import VaultAccessConditions from './VaultAccessConditions';

interface VaultSectionViewProps {
  sectionId: string;
  familyId: string;
}

export default function VaultSectionView({ sectionId, familyId }: VaultSectionViewProps) {
  const { data: items, isLoading: itemsLoading } = useVaultItems(sectionId);
  const { data: delegates } = useVaultDelegates(sectionId);
  const { data: conditions } = useVaultAccessConditions(sectionId);
  const { data: hasAccess } = useCheckVaultAccess(sectionId);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const isLocked = conditions?.some(c => !c.is_unlocked && c.condition_type !== 'manual');

  if (!hasAccess) {
    return (
      <div className="text-center py-12">
        <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">
          You don't have permission to view this section yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {isLocked ? (
            <Lock className="h-5 w-5 text-amber-500" />
          ) : (
            <Unlock className="h-5 w-5 text-green-500" />
          )}
          Vault Section
        </DialogTitle>
      </DialogHeader>

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="delegates">
            Delegates ({delegates?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {items?.length || 0} items stored
            </div>
            <Button onClick={() => setIsAddingItem(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {itemsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !items || items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No items stored yet</p>
                <Button onClick={() => setIsAddingItem(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{item.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{item.item_type}</Badge>
                          <span>•</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.file_path && (
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {isAddingItem && (
            <Card>
              <CardContent className="pt-6">
                <VaultItemForm
                  sectionId={sectionId}
                  familyId={familyId}
                  onSuccess={() => setIsAddingItem(false)}
                  onCancel={() => setIsAddingItem(false)}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="delegates">
          <VaultDelegateManager 
            sectionId={sectionId} 
            familyId={familyId}
          />
        </TabsContent>

        <TabsContent value="access">
          <VaultAccessConditions
            sectionId={sectionId}
            familyId={familyId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
