import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AuthGate from '@/components/AuthGate';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Users, ChefHat, ArrowLeft } from 'lucide-react';

interface Recipe {
  id: string;
  title: string;
  source: string;
  serves: string;
  time_prep_minutes: number;
  time_cook_minutes: number;
  dietary_tags: string[];
  ingredients: any;
  steps: any;
  notes: string;
  created_at: string;
}

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRecipe(id);
    }
  }, [id]);

  async function fetchRecipe(recipeId: string) {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', recipeId)
        .single();

      if (error) throw error;
      setRecipe(data);
    } catch (error) {
      console.error('Error fetching recipe:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="flex justify-center p-8">Loading recipe...</div>
          </main>
        </div>
      </AuthGate>
    );
  }

  if (!recipe) {
    return (
      <AuthGate>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">Recipe not found</h3>
              <Button onClick={() => navigate('/archive')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Archive
              </Button>
            </div>
          </main>
        </div>
      </AuthGate>
    );
  }

  const totalTime = (recipe.time_prep_minutes || 0) + (recipe.time_cook_minutes || 0);

  return (
    <AuthGate>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/archive')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Archive
            </Button>
            
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <ChefHat className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">{recipe.title}</h1>
                {recipe.source && (
                  <p className="text-lg text-muted-foreground">From: {recipe.source}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 mb-4">
              {recipe.serves && (
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>Serves {recipe.serves}</span>
                </div>
              )}
              {totalTime > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span>{totalTime} minutes total</span>
                  {recipe.time_prep_minutes && recipe.time_cook_minutes && (
                    <span className="text-muted-foreground">
                      ({recipe.time_prep_minutes}m prep + {recipe.time_cook_minutes}m cook)
                    </span>
                  )}
                </div>
              )}
            </div>

            {recipe.dietary_tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {recipe.dietary_tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Ingredients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recipe.ingredients?.map((ingredient, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{ingredient.qty}</span>{' '}
                    <span>{ingredient.item}</span>
                    {ingredient.note && (
                      <span className="text-muted-foreground"> ({ingredient.note})</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recipe.steps?.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {step.step}
                    </div>
                    <p className="text-sm leading-relaxed pt-1">{step.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {recipe.notes && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{recipe.notes}</p>
              </CardContent>
            </Card>
          )}

          <Separator className="my-8" />

          <div className="text-center text-sm text-muted-foreground">
            Added on {new Date(recipe.created_at).toLocaleDateString()}
          </div>
        </main>
      </div>
    </AuthGate>
  );
}