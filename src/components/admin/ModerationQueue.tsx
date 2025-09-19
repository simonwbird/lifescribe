import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Clock, Eye, Flag, Shield, User } from 'lucide-react';
import { useModerationQueue, useBulkModerationAction } from '@/hooks/useModerationData';
import { ModerationItemDetail } from './ModerationItemDetail';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { ModerationFilters, ModerationActionType, ModerationQueueItem } from '@/lib/moderationTypes';

const sourceColors = {
  user_flag: 'bg-yellow-500',
  automated_nsfw: 'bg-red-500',
  automated_toxicity: 'bg-orange-500',
  automated_pii: 'bg-purple-500',
  dmca: 'bg-blue-500'
};

const statusColors = {
  pending: 'bg-yellow-500',
  in_review: 'bg-blue-500',
  resolved: 'bg-green-500',
  escalated: 'bg-red-500'
};

export function ModerationQueue() {
  const [filters, setFilters] = useState<ModerationFilters>({});
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkRationale, setBulkRationale] = useState('');
  const [detailItemId, setDetailItemId] = useState<string | null>(null);

  const { data: queueItems = [], isLoading } = useModerationQueue(filters);
  const bulkMutation = useBulkModerationAction();

  // Keyboard shortcuts for fast triage
  useKeyboardShortcuts({
    j: () => {
      if (selectedItemIndex < queueItems.length - 1) {
        setSelectedItemIndex(prev => prev + 1);
      }
    },
    k: () => {
      if (selectedItemIndex > 0) {
        setSelectedItemIndex(prev => prev - 1);
      }
    },
    h: () => {
      const currentItem = queueItems[selectedItemIndex];
      if (currentItem) {
        handleQuickAction(currentItem, 'hide');
      }
    },
    b: () => {
      const currentItem = queueItems[selectedItemIndex];
      if (currentItem) {
        handleQuickAction(currentItem, 'blur');
      }
    }
  });

  const handleQuickAction = (item: ModerationQueueItem, action: ModerationActionType) => {
    // This would trigger a quick action modal or direct action
    setDetailItemId(item.id);
  };

  const handleBulkAction = async (actionType: ModerationActionType) => {
    if (!bulkRationale.trim()) {
      return;
    }

    await bulkMutation.mutateAsync({
      item_ids: selectedItems,
      action_type: actionType,
      rationale: bulkRationale
    });

    setSelectedItems([]);
    setBulkRationale('');
    setShowBulkActions(false);
  };

  const getSLAStatus = (slaDate?: string) => {
    if (!slaDate) return null;
    const now = new Date();
    const sla = new Date(slaDate);
    const hoursLeft = (sla.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursLeft < 0) return { status: 'overdue', hours: Math.abs(hoursLeft) };
    if (hoursLeft < 4) return { status: 'urgent', hours: hoursLeft };
    return { status: 'normal', hours: hoursLeft };
  };

  if (isLoading) {
    return <div className="p-6">Loading moderation queue...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Moderation Queue</h1>
          <p className="text-muted-foreground">Review and act on flagged content</p>
        </div>
        
        {selectedItems.length > 0 && (
          <Dialog open={showBulkActions} onOpenChange={setShowBulkActions}>
            <DialogTrigger asChild>
              <Button>
                Bulk Actions ({selectedItems.length})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Moderation Actions</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Rationale for bulk action (required)"
                  value={bulkRationale}
                  onChange={(e) => setBulkRationale(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleBulkAction('hide')}
                    disabled={!bulkRationale.trim() || bulkMutation.isPending}
                  >
                    Hide All
                  </Button>
                  <Button 
                    onClick={() => handleBulkAction('blur')}
                    disabled={!bulkRationale.trim() || bulkMutation.isPending}
                  >
                    Blur All
                  </Button>
                  <Button 
                    onClick={() => handleBulkAction('resolve')}
                    disabled={!bulkRationale.trim() || bulkMutation.isPending}
                  >
                    Resolve All
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleBulkAction('escalate')}
                    disabled={!bulkRationale.trim() || bulkMutation.isPending}
                  >
                    Escalate All
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={filters.status?.join(',') || ''}
              onValueChange={(value) => 
                setFilters(prev => ({ 
                  ...prev, 
                  status: value ? value.split(',') as any : undefined 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.item_type?.join(',') || ''}
              onValueChange={(value) => 
                setFilters(prev => ({ 
                  ...prev, 
                  item_type: value ? value.split(',') as any : undefined 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="story">Stories</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="answer">Answers</SelectItem>
                <SelectItem value="comment">Comments</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="overdue"
                checked={filters.overdue_only || false}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, overdue_only: !!checked }))
                }
              />
              <label htmlFor="overdue" className="text-sm font-medium">
                Overdue only
              </label>
            </div>

            <Button
              variant="outline"
              onClick={() => setFilters({})}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Queue Items */}
      <div className="space-y-2">
        {queueItems.map((item, index) => {
          const slaStatus = getSLAStatus(item.sla_due_at);
          const isSelected = selectedItems.includes(item.id);
          const isCurrentIndex = index === selectedItemIndex;
          
          return (
            <Card 
              key={item.id} 
              className={`cursor-pointer transition-colors ${
                isCurrentIndex ? 'ring-2 ring-primary' : ''
              } ${isSelected ? 'bg-muted/50' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedItems(prev => [...prev, item.id]);
                        } else {
                          setSelectedItems(prev => prev.filter(id => id !== item.id));
                        }
                      }}
                    />
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={sourceColors[item.flag?.source || 'user_flag']}>
                        <Flag className="w-3 h-3 mr-1" />
                        {item.flag?.source.replace('_', ' ')}
                      </Badge>
                      
                      <Badge className={statusColors[item.status]}>
                        {item.status}
                      </Badge>
                      
                      <Badge variant="outline">
                        {item.item_type}
                      </Badge>
                      
                      {item.priority > 3 && (
                        <Badge variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          High Priority
                        </Badge>
                      )}
                      
                      {slaStatus?.status === 'overdue' && (
                        <Badge variant="destructive">
                          <Clock className="w-3 h-3 mr-1" />
                          Overdue
                        </Badge>
                      )}
                      
                      {slaStatus?.status === 'urgent' && (
                        <Badge variant="outline" className="text-orange-600">
                          <Clock className="w-3 h-3 mr-1" />
                          {Math.round(slaStatus.hours)}h left
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {item.assigned_to && (
                      <Badge variant="secondary">
                        <User className="w-3 h-3 mr-1" />
                        Assigned
                      </Badge>
                    )}
                    
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[600px] sm:w-[700px]">
                        <SheetHeader>
                          <SheetTitle>Moderation Review</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4">
                          <ModerationItemDetail itemId={item.id} />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="font-medium">{item.flag?.reason}</p>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(item.created_at).toLocaleDateString()} •
                    Family ID: {item.family_id.slice(0, 8)}... •
                    Item ID: {item.item_id.slice(0, 8)}...
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {queueItems.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No items in queue</h3>
              <p className="text-muted-foreground">
                All clear! No flagged content requires review.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Keyboard shortcuts help */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Keyboard shortcuts:</strong> J/K to navigate, H to hide, B to blur
          </p>
        </CardContent>
      </Card>
    </div>
  );
}