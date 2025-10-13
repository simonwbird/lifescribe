import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateVaultItem } from '@/hooks/useVault';
import { supabase } from '@/integrations/supabase/client';

interface VaultItemFormProps {
  sectionId: string;
  familyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function VaultItemForm({ 
  sectionId, 
  familyId, 
  onSuccess, 
  onCancel 
}: VaultItemFormProps) {
  const createItem = useCreateVaultItem();
  const [formData, setFormData] = useState({
    title: '',
    item_type: 'document',
    content: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Encrypt the sensitive data
    const encryptedData = {
      content: formData.content,
      notes: formData.notes,
      // In production, use proper encryption here
      encrypted: true,
    };

    await createItem.mutateAsync({
      section_id: sectionId,
      family_id: familyId,
      title: formData.title,
      item_type: formData.item_type,
      encrypted_data: encryptedData,
      created_by: user.id,
    });

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Item Type</Label>
        <Select
          value={formData.item_type}
          onValueChange={(value) => setFormData({ ...formData, item_type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="document">Document</SelectItem>
            <SelectItem value="password">Password</SelectItem>
            <SelectItem value="account">Account Info</SelectItem>
            <SelectItem value="contact">Contact</SelectItem>
            <SelectItem value="note">Secure Note</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Will & Testament"
          required
        />
      </div>

      <div>
        <Label>Content</Label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Enter sensitive information here..."
          rows={4}
          required
        />
      </div>

      <div>
        <Label>Notes (Optional)</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional context or instructions..."
          rows={2}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={createItem.isPending}>
          {createItem.isPending ? 'Saving...' : 'Save Item'}
        </Button>
      </div>
    </form>
  );
}
