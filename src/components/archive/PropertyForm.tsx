import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface PropertyFormProps {
  onSuccess: () => void;
}

export function PropertyForm({ onSuccess }: PropertyFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [acquiredYear, setAcquiredYear] = useState<number | ''>('');
  const [soldYear, setSoldYear] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const { data: memberData } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!memberData) throw new Error('No family membership found');

      const { error } = await supabase
        .from('properties')
        .insert({
          family_id: memberData.family_id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          name: name.trim(),
          address: address.trim() || null,
          acquired_year: acquiredYear || null,
          sold_year: soldYear || null,
          description: description.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Property saved!",
        description: "Your property has been added to the family archive.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving property:', error);
      toast({
        title: "Error",
        description: "Failed to save property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Property Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="The Family Home, Grandpa's Farm, etc."
          required
        />
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main Street, Springfield, IL"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="acquired">Year Acquired</Label>
          <Input
            id="acquired"
            type="number"
            value={acquiredYear}
            onChange={(e) => setAcquiredYear(e.target.value ? parseInt(e.target.value) : '')}
            placeholder="1965"
          />
        </div>
        <div>
          <Label htmlFor="sold">Year Sold (if applicable)</Label>
          <Input
            id="sold"
            type="number"
            value={soldYear}
            onChange={(e) => setSoldYear(e.target.value ? parseInt(e.target.value) : '')}
            placeholder="1995"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Three-bedroom colonial where the family lived for 30 years. Features include..."
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading || !name.trim()}>
          {loading ? 'Saving...' : 'Save Property'}
        </Button>
      </div>
    </form>
  );
}