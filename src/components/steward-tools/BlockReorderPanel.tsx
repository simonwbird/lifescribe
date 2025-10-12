import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Loader2, Eye, EyeOff, Save } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BlockReorderPanelProps {
  personId: string;
  onReorder?: () => void;
}

interface Block {
  id: string;
  type: string;
  block_order: number;
  visibility: 'public' | 'family' | 'private';
}

export function BlockReorderPanel({ personId, onReorder }: BlockReorderPanelProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchBlocks();
  }, [personId]);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('person_page_blocks')
        .select('id, type, block_order, visibility')
        .eq('person_id', personId)
        .order('block_order', { ascending: true });

      if (error) throw error;
      setBlocks((data || []) as Block[]);
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching blocks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load blocks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setBlocks(items);
    setHasChanges(true);
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const updates = blocks.map((block, index) => ({
        id: block.id,
        block_order: index,
        updated_at: new Date().toISOString(),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('person_page_blocks')
          .update({ 
            block_order: update.block_order,
            updated_at: update.updated_at,
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      setHasChanges(false);
      toast({
        title: 'Order saved',
        description: 'Block order has been updated successfully',
      });
      
      onReorder?.();
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: 'Error',
        description: 'Failed to save block order',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getBlockLabel = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Eye className="h-3 w-3" />;
      case 'family':
        return <Eye className="h-3 w-3 text-primary" />;
      case 'private':
        return <EyeOff className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reorder Blocks</CardTitle>
        <CardDescription>
          Drag and drop to change the order of blocks on the page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasChanges && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm font-medium">You have unsaved changes</p>
            <Button
              size="sm"
              onClick={handleSaveOrder}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Order
            </Button>
          </div>
        )}

        {blocks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No blocks found
          </p>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="blocks">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {blocks.map((block, index) => (
                    <Draggable
                      key={block.id}
                      draggableId={block.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg border
                            ${snapshot.isDragging ? 'bg-accent' : 'bg-card'}
                          `}
                        >
                          <div
                            {...provided.dragHandleProps}
                            className="cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {getBlockLabel(block.type)}
                              </p>
                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              {getVisibilityIcon(block.visibility)}
                              <span className="text-xs capitalize">
                                {block.visibility}
                              </span>
                            </Badge>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </CardContent>
    </Card>
  );
}
