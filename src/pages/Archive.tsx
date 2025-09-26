import { useState } from 'react';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecipesList } from '@/components/archive/RecipesList';
import { ThingsList } from '@/components/archive/ThingsList';
import { PropertiesList } from '@/components/archive/PropertiesList';
import { ChefHat, Package, Home } from 'lucide-react';

export default function Archive() {
  const [activeTab, setActiveTab] = useState('recipes');

  return (
    <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Family Archive</h1>
            <p className="text-muted-foreground">
              Preserve your family's recipes, heirlooms, and properties for future generations
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recipes" className="flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                Recipes
              </TabsTrigger>
              <TabsTrigger value="things" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Things
              </TabsTrigger>
              <TabsTrigger value="properties" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Properties
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recipes" className="space-y-6">
              <RecipesList />
            </TabsContent>

            <TabsContent value="things" className="space-y-6">
              <ThingsList />
            </TabsContent>

            <TabsContent value="properties" className="space-y-6">
              <PropertiesList />
            </TabsContent>
          </Tabs>
         </main>
       </div>
     );
   }