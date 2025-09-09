import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  name: string;
}

interface ThingFormProps {
  onSuccess: () => void;
}

const objectTypes = [
  'artwork', 'jewelry', 'instrument', 'document', 'keepsake', 
  'furniture', 'book', 'clothing', 'tool', 'photograph', 'other'
];

export function ThingForm({ onSuccess }: ThingFormProps) {
  const [title, setTitle] = useState('');
  const [objectType, setObjectType] = useState('');
  const [yearEstimated, setYearEstimated] = useState<number | ''>('');
  const [maker, setMaker] = useState('');
  const [description, setDescription] = useState('');
  const [provenance, setProvenance] = useState('');
  const [condition, setCondition] = useState('');
  const [valueEstimate, setValueEstimate] = useState('');
  const [currentPropertyId, setCurrentPropertyId] = useState('');
  const [roomHint, setRoomHint] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProperties();
  }, []);

  async function fetchProperties() {
    try {
      const { data: memberData } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!memberData) return;

      const { data, error } = await supabase
        .from('properties')
        .select('id, name')
        .eq('family_id', memberData.family_id)
        .order('name');

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const { data: memberData } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!memberData) throw new Error('No family membership found');

      const { error } = await supabase
        .from('things')
        .insert({
          family_id: memberData.family_id,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          title: title.trim(),
          object_type: objectType || null,
          year_estimated: yearEstimated || null,
          maker: maker.trim() || null,
          description: description.trim() || null,
          provenance: provenance.trim() || null,
          condition: condition.trim() || null,
          value_estimate: valueEstimate.trim() || null,
          current_property_id: currentPropertyId || null,
          room_hint: roomHint.trim() || null,
          tags: tags
        });

      if (error) throw error;

      toast({
        title: "Thing saved!",
        description: "Your item has been added to the family archive.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving thing:', error);
      toast({
        title: "Error",
        description: "Failed to save item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="title">Item Name *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Antique Family Bible"
            required
          />
        </div>
        <div>
          <Label htmlFor="object_type">Type</Label>
          <Select value={objectType} onValueChange={setObjectType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {objectTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="year">Year/Era</Label>
          <Input
            id="year"
            type="number"
            value={yearEstimated}
            onChange={(e) => setYearEstimated(e.target.value ? parseInt(e.target.value) : '')}
            placeholder="1890"
          />
        </div>
        <div>
          <Label htmlFor="maker">Made By</Label>
          <Input
            id="maker"
            value={maker}
            onChange={(e) => setMaker(e.target.value)}
            placeholder="Artist, manufacturer, etc."
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed description of the item..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="provenance">Provenance/History</Label>
        <Textarea
          id="provenance"
          value={provenance}
          onChange={(e) => setProvenance(e.target.value)}
          placeholder="How this item came to be in the family, its story..."
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="condition">Condition</Label>
          <Input
            id="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="Excellent, Good, Fair, etc."
          />
        </div>
        <div>
          <Label htmlFor="value">Estimated Value</Label>
          <Input
            id="value"
            value={valueEstimate}
            onChange={(e) => setValueEstimate(e.target.value)}
            placeholder="$500, Priceless, etc."
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="property">Current Location</Label>
          <Select value={currentPropertyId} onValueChange={setCurrentPropertyId}>
            <SelectTrigger>
              <SelectValue placeholder="Select property..." />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="room">Room/Location Detail</Label>
          <Input
            id="room"
            value={roomHint}
            onChange={(e) => setRoomHint(e.target.value)}
            placeholder="Living room - above fireplace"
          />
        </div>
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex items-center gap-2 mb-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="heirloom, fragile, valuable, etc."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" onClick={addTag} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading || !title.trim()}>
          {loading ? 'Saving...' : 'Save Item'}
        </Button>
      </div>
    </form>
  );
}