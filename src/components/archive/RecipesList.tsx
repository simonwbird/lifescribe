import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChefHat, Package, Home, Plus, Search, Clock, Users, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RecipeForm } from './RecipeForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Recipe {
  id: string;
  title: string;
  source: string;
  serves: string;
  time_prep_minutes: number;
  time_cook_minutes: number;
  dietary_tags: string[];
  created_at: string;
  media_count?: number;
  story_count?: number;
}

export function RecipesList() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecipes();
  }, []);

  async function fetchRecipes() {
    try {
      const { data: memberData } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!memberData) return;

      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          media!inner(id),
          recipe_story_links!inner(id)
        `)
        .eq('family_id', memberData.family_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const recipesWithCounts = data?.map(recipe => ({
        ...recipe,
        media_count: Array.isArray(recipe.media) ? recipe.media.length : 0,
        story_count: Array.isArray(recipe.recipe_story_links) ? recipe.recipe_story_links.length : 0
      })) || [];

      setRecipes(recipesWithCounts);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.dietary_tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRecipeCreated = () => {
    setShowForm(false);
    fetchRecipes();
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading recipes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Recipe
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Recipe</DialogTitle>
            </DialogHeader>
            <RecipeForm onSuccess={handleRecipeCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12">
          <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No recipes yet</h3>
          <p className="text-muted-foreground mb-4">Start building your family recipe collection</p>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Recipe
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Recipe</DialogTitle>
              </DialogHeader>
              <RecipeForm onSuccess={handleRecipeCreated} />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <Card 
              key={recipe.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/recipes/${recipe.id}`)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{recipe.title}</CardTitle>
                {recipe.source && (
                  <p className="text-sm text-muted-foreground">From: {recipe.source}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {recipe.serves && (
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {recipe.serves}
                    </div>
                  )}
                  {(recipe.time_prep_minutes || recipe.time_cook_minutes) && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {(recipe.time_prep_minutes || 0) + (recipe.time_cook_minutes || 0)}m
                    </div>
                  )}
                </div>

                {recipe.dietary_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {recipe.dietary_tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {recipe.dietary_tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{recipe.dietary_tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    {recipe.media_count > 0 && (
                      <span>{recipe.media_count} photo{recipe.media_count !== 1 ? 's' : ''}</span>
                    )}
                    {recipe.story_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {recipe.story_count} memor{recipe.story_count !== 1 ? 'ies' : 'y'}
                      </div>
                    )}
                  </div>
                  <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}