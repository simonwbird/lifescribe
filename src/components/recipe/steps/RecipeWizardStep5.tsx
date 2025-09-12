import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Upload, 
  Scan, 
  Clock, 
  Users, 
  ChefHat, 
  Tag, 
  Eye, 
  Lock, 
  Globe
} from 'lucide-react'
import type { RecipeFormData } from '@/lib/recipeTypes'

interface RecipeWizardStep5Props {
  data: RecipeFormData
  onChange: (data: Partial<RecipeFormData>) => void
  onPublish: () => void
  onSaveDraft: () => void
}

export default function RecipeWizardStep5({ 
  data, 
  onChange, 
  onPublish, 
  onSaveDraft 
}: RecipeWizardStep5Props) {
  const totalTime = (data.prepMin || 0) + (data.cookMin || 0)

  const getVisibilityIcon = () => {
    switch (data.visibility) {
      case 'family': return <Globe className="h-4 w-4" />
      case 'branch': return <Users className="h-4 w-4" />
      case 'private': return <Lock className="h-4 w-4" />
    }
  }

  const getVisibilityDescription = () => {
    switch (data.visibility) {
      case 'family': return 'Visible to all family members'
      case 'branch': return 'Visible to your branch only'
      case 'private': return 'Only visible to you'
    }
  }

  const isValid = data.title.trim() && data.ingredients.length > 0 && data.steps.length > 0

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Media & Publish</h2>
        <p className="text-muted-foreground">
          Add photos, choose who can see this recipe, and publish it to your family's collection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Media */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recipe Photos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cover photo */}
              <div className="space-y-2">
                <Label>Cover Photo</Label>
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Add a main photo for your recipe
                        </p>
                        <Button variant="outline" disabled>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Photo (Coming Soon)
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gallery */}
              <div className="space-y-2">
                <Label>Additional Photos</Label>
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="text-center space-y-3">
                      <div className="flex justify-center gap-4">
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
                          <p className="text-xs text-muted-foreground">Upload</p>
                        </div>
                        <div className="text-center">
                          <Scan className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
                          <p className="text-xs text-muted-foreground">Scan Recipe</p>
                        </div>
                      </div>
                      <Button variant="outline" disabled>
                        Add Photos & Scans (Coming Soon)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Who Can See This Recipe?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Select 
                  value={data.visibility} 
                  onValueChange={(value: 'family' | 'branch' | 'private') => onChange({ visibility: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Family</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="branch">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Branch Only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <span>Just Me</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getVisibilityIcon()}
                  <span>{getVisibilityDescription()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Preview & Actions */}
        <div className="space-y-6">
          {/* Recipe preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recipe Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{data.title || 'Untitled Recipe'}</h3>
                {data.subtitle && (
                  <p className="text-muted-foreground text-sm">{data.subtitle}</p>
                )}
                {data.source && (
                  <p className="text-xs text-muted-foreground mt-1">From: {data.source}</p>
                )}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {data.serves && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{data.serves}</span>
                  </div>
                )}
                {totalTime > 0 && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{totalTime}m</span>
                  </div>
                )}
                {data.difficulty && (
                  <div className="flex items-center gap-1">
                    <ChefHat className="h-3 w-3" />
                    <span className="capitalize">{data.difficulty}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  <span>{data.ingredients.length} ingredients</span>
                </div>
              </div>

              {/* Diet badges */}
              {Object.entries(data.diet).some(([_, value]) => value) && (
                <div className="flex flex-wrap gap-1">
                  {data.diet.veg && <Badge variant="outline" className="text-xs">Vegetarian</Badge>}
                  {data.diet.vegan && <Badge variant="outline" className="text-xs">Vegan</Badge>}
                  {data.diet.glutenFree && <Badge variant="outline" className="text-xs">Gluten Free</Badge>}
                  {data.diet.dairyFree && <Badge variant="outline" className="text-xs">Dairy Free</Badge>}
                </div>
              )}

              {/* Tags */}
              {data.tags.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {data.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {data.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{data.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ready to Publish?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className={`flex items-center gap-2 ${data.title.trim() ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <div className={`w-2 h-2 rounded-full ${data.title.trim() ? 'bg-green-600' : 'bg-muted-foreground'}`} />
                  Recipe title
                </div>
                <div className={`flex items-center gap-2 ${data.ingredients.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <div className={`w-2 h-2 rounded-full ${data.ingredients.length > 0 ? 'bg-green-600' : 'bg-muted-foreground'}`} />
                  At least one ingredient ({data.ingredients.length})
                </div>
                <div className={`flex items-center gap-2 ${data.steps.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <div className={`w-2 h-2 rounded-full ${data.steps.length > 0 ? 'bg-green-600' : 'bg-muted-foreground'}`} />
                  At least one step ({data.steps.length})
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button 
                onClick={onPublish}
                disabled={!isValid}
                className="w-full bg-brand-green hover:bg-brand-green/90"
              >
                <Eye className="h-4 w-4 mr-2" />
                Publish Recipe
              </Button>
              <Button 
                variant="outline"
                onClick={onSaveDraft}
                className="w-full"
              >
                Save as Draft
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}