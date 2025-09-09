import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Ingredient {
  qty: string;
  item: string;
  note: string;
}

interface Step {
  step: number;
  text: string;
}

interface RecipeFormProps {
  onSuccess: () => void;
}

export function RecipeForm({ onSuccess }: RecipeFormProps) {
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [serves, setServes] = useState('');
  const [prepMinutes, setPrepMinutes] = useState<number | ''>('');
  const [cookMinutes, setCookMinutes] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ qty: '', item: '', note: '' }]);
  const [steps, setSteps] = useState<Step[]>([{ step: 1, text: '' }]);
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addIngredient = () => {
    setIngredients([...ingredients, { qty: '', item: '', note: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const addStep = () => {
    setSteps([...steps, { step: steps.length + 1, text: '' }]);
  };

  const removeStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index);
    // Renumber steps
    updated.forEach((step, i) => {
      step.step = i + 1;
    });
    setSteps(updated);
  };

  const updateStep = (index: number, text: string) => {
    const updated = [...steps];
    updated[index].text = text;
    setSteps(updated);
  };

  const addTag = () => {
    if (newTag.trim() && !dietaryTags.includes(newTag.trim())) {
      setDietaryTags([...dietaryTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setDietaryTags(dietaryTags.filter(t => t !== tag));
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
        .from('recipes')
        .insert({
          family_id: memberData.family_id,
          created_by: (await supabase.auth.getUser()).data.user?.id!,
          title: title.trim(),
          source: source.trim() || null,
          serves: serves.trim() || null,
          time_prep_minutes: prepMinutes || null,
          time_cook_minutes: cookMinutes || null,
          dietary_tags: dietaryTags,
          ingredients: ingredients.filter(ing => ing.item.trim()) as any,
          steps: steps.filter(step => step.text.trim()) as any,
          notes: notes.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Recipe saved!",
        description: "Your recipe has been added to the family archive.",
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast({
        title: "Error",
        description: "Failed to save recipe. Please try again.",
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
          <Label htmlFor="title">Recipe Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Grandma's Chocolate Chip Cookies"
            required
          />
        </div>
        <div>
          <Label htmlFor="source">Source</Label>
          <Input
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Grandma Helen, Family cookbook, etc."
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="serves">Serves</Label>
          <Input
            id="serves"
            value={serves}
            onChange={(e) => setServes(e.target.value)}
            placeholder="4-6 people"
          />
        </div>
        <div>
          <Label htmlFor="prep">Prep Time (minutes)</Label>
          <Input
            id="prep"
            type="number"
            value={prepMinutes}
            onChange={(e) => setPrepMinutes(e.target.value ? parseInt(e.target.value) : '')}
            placeholder="15"
          />
        </div>
        <div>
          <Label htmlFor="cook">Cook Time (minutes)</Label>
          <Input
            id="cook"
            type="number"
            value={cookMinutes}
            onChange={(e) => setCookMinutes(e.target.value ? parseInt(e.target.value) : '')}
            placeholder="30"
          />
        </div>
      </div>

      <div>
        <Label>Dietary Tags</Label>
        <div className="flex items-center gap-2 mb-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="vegetarian, gluten-free, etc."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          />
          <Button type="button" onClick={addTag} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {dietaryTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {dietaryTags.map((tag) => (
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Ingredients</CardTitle>
          <Button type="button" onClick={addIngredient} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Ingredient
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="1 cup"
                value={ingredient.qty}
                onChange={(e) => updateIngredient(index, 'qty', e.target.value)}
                className="w-24"
              />
              <Input
                placeholder="flour"
                value={ingredient.item}
                onChange={(e) => updateIngredient(index, 'item', e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="sifted (optional)"
                value={ingredient.note}
                onChange={(e) => updateIngredient(index, 'note', e.target.value)}
                className="w-32"
              />
              {ingredients.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  size="sm"
                  variant="ghost"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Instructions</CardTitle>
          <Button type="button" onClick={addStep} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Step
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium mt-1">
                {step.step}
              </div>
              <Textarea
                placeholder="Describe this step..."
                value={step.text}
                onChange={(e) => updateStep(index, e.target.value)}
                className="flex-1"
                rows={2}
              />
              {steps.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeStep(index)}
                  size="sm"
                  variant="ghost"
                  className="mt-1"
                >
                  <Minus className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special tips, variations, or family stories about this recipe..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading || !title.trim()}>
          {loading ? 'Saving...' : 'Save Recipe'}
        </Button>
      </div>
    </form>
  );
}