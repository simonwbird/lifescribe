import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Image, 
  MessageSquare, 
  Calendar, 
  Users, 
  Pin 
} from 'lucide-react';
import { useBulkEditContent } from '@/hooks/useContentAdmin';
import type { ContentItem } from '@/lib/contentAdminTypes';

interface BulkEditModalProps {
  selectedItemIds: string[];
  contentItems: ContentItem[];
  onClose: () => void;
}

const contentTypeIcons = {
  story: FileText,
  media: Image,
  answer: MessageSquare
};

export function BulkEditModal({ selectedItemIds, contentItems, onClose }: BulkEditModalProps) {
  const [operationType, setOperationType] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [reassignToPerson, setReassignToPerson] = useState('');

  const bulkEditMutation = useBulkEditContent();

  const groupedByType = contentItems.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  const handleBulkEdit = async () => {
    if (!operationType || !changeReason.trim()) return;

    const operationData: any = {
      family_id: contentItems[0]?.family_id,
      content_type: Object.keys(groupedByType)[0] // Assuming single type for now
    };

    switch (operationType) {
      case 'bulk_title_update':
        operationData.new_title = newTitle;
        break;
      case 'bulk_date_update':
        operationData.new_date = newDate;
        break;
      case 'bulk_reassign':
        operationData.person_id = reassignToPerson;
        break;
      case 'bulk_pin':
        operationData.pin_status = true;
        break;
      case 'bulk_unpin':
        operationData.pin_status = false;
        break;
    }

    await bulkEditMutation.mutateAsync({
      content_ids: selectedItemIds,
      operation_type: operationType,
      operation_data: operationData,
      change_reason: changeReason
    });

    onClose();
  };

  const canProceed = operationType && changeReason.trim() && (
    operationType === 'bulk_pin' || 
    operationType === 'bulk_unpin' ||
    (operationType === 'bulk_title_update' && newTitle.trim()) ||
    (operationType === 'bulk_date_update' && newDate) ||
    (operationType === 'bulk_reassign' && reassignToPerson)
  );

  return (
    <div className="space-y-6">
      {/* Selected Items Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Selected Items ({selectedItemIds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(groupedByType).map(([type, items]) => {
              const Icon = contentTypeIcons[type as keyof typeof contentTypeIcons];
              return (
                <div key={type} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <Badge variant="outline">
                    {items.length} {type}s
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Operation Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Bulk Operation</label>
        <Select value={operationType} onValueChange={setOperationType}>
          <SelectTrigger>
            <SelectValue placeholder="Select operation type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bulk_title_update">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Update Titles
              </div>
            </SelectItem>
            <SelectItem value="bulk_date_update">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Update Dates
              </div>
            </SelectItem>
            <SelectItem value="bulk_reassign">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Reassign to Person
              </div>
            </SelectItem>
            <SelectItem value="bulk_pin">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4" />
                Pin as Highlights
              </div>
            </SelectItem>
            <SelectItem value="bulk_unpin">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4" />
                Unpin Highlights
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Operation-specific fields */}
      {operationType === 'bulk_title_update' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">New Title</label>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter new title for all selected items"
          />
        </div>
      )}

      {operationType === 'bulk_date_update' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">New Date</label>
          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>
      )}

      {operationType === 'bulk_reassign' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Reassign to Person</label>
          <Input
            value={reassignToPerson}
            onChange={(e) => setReassignToPerson(e.target.value)}
            placeholder="Enter person ID or name"
          />
        </div>
      )}

      <Separator />

      {/* Change Reason */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Change Reason (Required)</label>
        <Textarea
          value={changeReason}
          onChange={(e) => setChangeReason(e.target.value)}
          placeholder="Why are you making this bulk change?"
          rows={3}
        />
      </div>

      {/* Preview */}
      {operationType && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This will {operationType.replace('bulk_', '').replace('_', ' ')} for{' '}
              <strong>{selectedItemIds.length}</strong> items.
              {operationType === 'bulk_title_update' && newTitle && (
                <> New title: "<strong>{newTitle}</strong>"</>
              )}
              {operationType === 'bulk_date_update' && newDate && (
                <> New date: <strong>{new Date(newDate).toLocaleDateString()}</strong></>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleBulkEdit}
          disabled={!canProceed || bulkEditMutation.isPending}
        >
          Apply Bulk Changes
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}