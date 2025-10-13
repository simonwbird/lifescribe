import { useState } from 'react';
import { Plus, CheckCircle, Circle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  useVaultChecklists, 
  useVaultChecklistItems,
  useCreateChecklist,
  useCreateChecklistItem,
  useToggleChecklistItem 
} from '@/hooks/useVaultChecklists';
import { supabase } from '@/integrations/supabase/client';

interface VaultChecklistManagerProps {
  familyId: string;
}

export default function VaultChecklistManager({ familyId }: VaultChecklistManagerProps) {
  const { data: checklists } = useVaultChecklists(familyId);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null);
  const { data: items } = useVaultChecklistItems(selectedChecklist || undefined);
  const toggleItem = useToggleChecklistItem();
  const createChecklist = useCreateChecklist();
  const createItem = useCreateChecklistItem();
  const [isCreatingChecklist, setIsCreatingChecklist] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);

  const [newChecklist, setNewChecklist] = useState({ title: '', description: '' });
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    category: '',
  });

  const handleCreateChecklist = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const result = await createChecklist.mutateAsync({
      ...newChecklist,
      family_id: familyId,
      owner_id: user.id,
    });

    setSelectedChecklist(result.id);
    setIsCreatingChecklist(false);
    setNewChecklist({ title: '', description: '' });
  };

  const handleAddItem = async () => {
    if (!selectedChecklist) return;

    await createItem.mutateAsync({
      ...newItem,
      checklist_id: selectedChecklist,
      family_id: familyId,
    });

    setIsAddingItem(false);
    setNewItem({ title: '', description: '', priority: 'medium', category: '' });
  };

  const priorityColors = {
    low: 'bg-blue-500/10 text-blue-700',
    medium: 'bg-amber-500/10 text-amber-700',
    high: 'bg-orange-500/10 text-orange-700',
    urgent: 'bg-red-500/10 text-red-700',
  };

  // Auto-select first checklist if none selected
  if (!selectedChecklist && checklists && checklists.length > 0) {
    setSelectedChecklist(checklists[0].id);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-medium">When the Time Comes</h3>
          <p className="text-sm text-muted-foreground">
            Important tasks for your delegates to complete
          </p>
        </div>
        <Dialog open={isCreatingChecklist} onOpenChange={setIsCreatingChecklist}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Checklist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Checklist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newChecklist.title}
                  onChange={(e) => setNewChecklist({ ...newChecklist, title: e.target.value })}
                  placeholder="When the time comes"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newChecklist.description}
                  onChange={(e) => setNewChecklist({ ...newChecklist, description: e.target.value })}
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateChecklist} className="w-full">
                Create Checklist
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!checklists || checklists.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No checklists yet</p>
            <Button onClick={() => setIsCreatingChecklist(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Checklist
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>
                  {checklists.find(c => c.id === selectedChecklist)?.title}
                </CardTitle>
                <CardDescription>
                  {checklists.find(c => c.id === selectedChecklist)?.description}
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddingItem(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {items && items.length > 0 ? (
              items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <button
                    onClick={() => toggleItem.mutate({ 
                      id: item.id, 
                      isCompleted: !item.is_completed 
                    })}
                    className="mt-0.5"
                  >
                    {item.is_completed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className={`font-medium ${item.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                      {item.title}
                    </div>
                    {item.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={priorityColors[item.priority]}>
                        {item.priority}
                      </Badge>
                      {item.category && (
                        <Badge variant="outline">{item.category}</Badge>
                      )}
                      {item.profiles && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          {item.profiles.full_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No items yet. Add your first task.
              </div>
            )}

            {isAddingItem && (
              <Card className="bg-accent/50">
                <CardContent className="pt-6 space-y-3">
                  <Input
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="Task title"
                  />
                  <Textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Task description"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={newItem.priority}
                      onValueChange={(v: any) => setNewItem({ ...newItem, priority: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      placeholder="Category"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddItem} size="sm" className="flex-1">
                      Add
                    </Button>
                    <Button 
                      onClick={() => setIsAddingItem(false)} 
                      size="sm" 
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
