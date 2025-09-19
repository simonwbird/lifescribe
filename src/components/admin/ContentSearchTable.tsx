import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Edit, 
  Calendar, 
  Users, 
  Pin, 
  PinOff, 
  FileText, 
  Image, 
  MessageSquare,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useUpdateContent } from '@/hooks/useContentAdmin';
import type { ContentItem, ContentSuggestion } from '@/lib/contentAdminTypes';

interface ContentSearchTableProps {
  items: ContentItem[];
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  suggestions: ContentSuggestion[];
}

const contentTypeIcons = {
  story: FileText,
  media: Image,
  answer: MessageSquare
};

export function ContentSearchTable({ 
  items, 
  selectedItems, 
  onSelectionChange,
  suggestions 
}: ContentSearchTableProps) {
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [changeReason, setChangeReason] = useState('');

  const updateMutation = useUpdateContent();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(items.map(item => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, itemId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    }
  };

  const handleEdit = (item: ContentItem) => {
    setEditingItem(item);
    setEditValues({
      title: item.title || '',
      content: item.content || '',
      occurred_on: item.occurred_on || ''
    });
    setChangeReason('');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    const updates: Record<string, any> = {};
    
    // Only include changed values
    if (editValues.title !== editingItem.title) {
      updates.title = editValues.title;
    }
    if (editValues.content !== editingItem.content) {
      updates.content = editValues.content;
    }
    if (editValues.occurred_on !== editingItem.occurred_on) {
      updates.occurred_on = editValues.occurred_on;
    }

    if (Object.keys(updates).length === 0) {
      setEditingItem(null);
      return;
    }

    await updateMutation.mutateAsync({
      contentType: editingItem.type,
      contentId: editingItem.id,
      updates,
      changeReason: changeReason || 'Manual edit via admin',
      familyId: editingItem.family_id
    });

    setEditingItem(null);
  };

  const getItemSuggestions = (itemId: string) => {
    return suggestions.filter(s => s.content_id === itemId && s.status === 'pending');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedItems.length === items.length && items.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>People</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No content found matching your criteria
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const Icon = contentTypeIcons[item.type];
                const itemSuggestions = getItemSuggestions(item.id);
                const isSelected = selectedItems.includes(item.id);
                
                return (
                  <TableRow key={item.id} className={isSelected ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">
                          {truncateText(item.title || 'Untitled')}
                        </p>
                        {item.content && (
                          <p className="text-sm text-muted-foreground">
                            {truncateText(item.content, 150)}
                          </p>
                        )}
                        {item.file_name && (
                          <p className="text-xs text-muted-foreground">
                            {item.file_name} • {item.mime_type}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Icon className="w-4 h-4" />
                        <Badge variant="outline">
                          {item.type}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.people_links?.slice(0, 3).map(person => (
                          <Badge key={person.id} variant="secondary" className="text-xs">
                            {person.person_name}
                          </Badge>
                        ))}
                        {(item.people_links?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(item.people_links?.length || 0) - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {item.occurred_on ? formatDate(item.occurred_on) : formatDate(item.created_at)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {itemSuggestions.length > 0 && (
                          <Badge variant="outline" className="text-blue-600">
                            <Sparkles className="w-3 h-3 mr-1" />
                            {itemSuggestions.length}
                          </Badge>
                        )}
                        {item.is_pinned && (
                          <Badge variant="outline" className="text-yellow-600">
                            <Pin className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit Content</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Title</label>
                                <Input
                                  value={editValues.title || ''}
                                  onChange={(e) => setEditValues(prev => ({
                                    ...prev,
                                    title: e.target.value
                                  }))}
                                  placeholder="Enter title"
                                />
                              </div>
                              
                              {item.type !== 'media' && (
                                <div>
                                  <label className="text-sm font-medium">Content</label>
                                  <Textarea
                                    value={editValues.content || ''}
                                    onChange={(e) => setEditValues(prev => ({
                                      ...prev,
                                      content: e.target.value
                                    }))}
                                    placeholder="Enter content"
                                    rows={4}
                                  />
                                </div>
                              )}
                              
                              {item.type === 'answer' && (
                                <div>
                                  <label className="text-sm font-medium">Date Occurred</label>
                                  <Input
                                    type="date"
                                    value={editValues.occurred_on || ''}
                                    onChange={(e) => setEditValues(prev => ({
                                      ...prev,
                                      occurred_on: e.target.value
                                    }))}
                                  />
                                </div>
                              )}
                              
                              <div>
                                <label className="text-sm font-medium">Change Reason</label>
                                <Input
                                  value={changeReason}
                                  onChange={(e) => setChangeReason(e.target.value)}
                                  placeholder="Why are you making this change?"
                                />
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  onClick={handleSaveEdit}
                                  disabled={updateMutation.isPending}
                                >
                                  Save Changes
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => setEditingItem(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button size="sm" variant="outline">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}