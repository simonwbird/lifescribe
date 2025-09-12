import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Eye, 
  Users, 
  Lock, 
  Calendar, 
  MapPin, 
  Hash, 
  Camera,
  Star,
  BookOpen,
  Package,
  Home,
  ChefHat
} from 'lucide-react'
import { type StoryFormData } from '../StoryWizardTypes'

interface StoryWizardStep4Props {
  formData: StoryFormData
  onChange: (updates: Partial<StoryFormData>) => void
  onPublish: () => void
  onSaveDraft: () => void
  onPreview: () => void
  onPrevious: () => void
  isLoading?: boolean
}

export default function StoryWizardStep4({ 
  formData, 
  onChange, 
  onPublish,
  onSaveDraft,
  onPreview,
  onPrevious,
  isLoading = false
}: StoryWizardStep4Props) {
  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'family': return <Users className="h-4 w-4" />
      case 'branch': return <Eye className="h-4 w-4" />
      case 'private': return <Lock className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getCollectionIcon = (collection: string) => {
    switch (collection) {
      case 'recipe': return <ChefHat className="h-4 w-4" />
      case 'object': return <Package className="h-4 w-4" />
      case 'property': return <Home className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const isValid = formData.title.trim().length > 0 && formData.content.trim().length > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-semibold mb-2">Review & Publish</h2>
        <p className="text-muted-foreground">
          Review your story and choose how to share it with your family.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Story Preview */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-start justify-between">
                <span className="text-xl font-serif">{formData.title || 'Untitled Story'}</span>
                {formData.media.find(m => m.isCover) && (
                  <Badge variant="secondary" className="gap-1 ml-2">
                    <Star className="h-3 w-3 fill-current" />
                    Cover
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cover Image */}
              {formData.media.find(m => m.isCover) && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={formData.media.find(m => m.isCover)?.preview}
                    alt="Cover image"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Story Content Preview */}
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {formData.content.length > 300 
                    ? `${formData.content.substring(0, 300)}...` 
                    : formData.content || 'No story content yet...'
                  }
                </p>
              </div>

              <Separator />

              {/* Metadata */}
              <div className="grid gap-3 text-sm">
                {formData.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.date}</span>
                    <Badge variant="outline">
                      {formData.dateType}
                    </Badge>
                  </div>
                )}

                {formData.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.location}</span>
                  </div>
                )}

                {formData.people.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {formData.people.map((person, index) => (
                        <Badge key={index} variant={typeof person === 'object' && person.isExisting ? "default" : "secondary"}>
                          {typeof person === 'string' ? person : person.name}
                          {typeof person === 'object' && !person.isExisting && (
                            <span className="ml-1 text-xs opacity-75">(new)</span>
                          )}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {formData.tags.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {formData.media.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <span>{formData.media.length} {formData.media.length === 1 ? 'file' : 'files'} attached</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Publishing Options */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Publishing Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Visibility */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  {getVisibilityIcon(formData.visibility)}
                  Who can see this?
                </Label>
                <Select 
                  value={formData.visibility} 
                  onValueChange={(value: 'family' | 'branch' | 'private') => 
                    onChange({ visibility: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Entire Family</div>
                          <div className="text-xs text-muted-foreground">Everyone in your family tree</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="branch">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <div>
                          <div className="font-medium">My Branch</div>
                          <div className="text-xs text-muted-foreground">Close family members only</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Only Me (Draft)</div>
                          <div className="text-xs text-muted-foreground">Private until you're ready</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Collection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  {getCollectionIcon(formData.collection)}
                  Add to Collection
                </Label>
                <Select 
                  value={formData.collection} 
                  onValueChange={(value: 'none' | 'recipe' | 'object' | 'property') => 
                    onChange({ collection: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span>No specific collection</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="recipe">
                      <div className="flex items-center gap-2">
                        <ChefHat className="h-4 w-4" />
                        <span>Family Recipes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="object">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>Family Objects</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="property">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        <span>Family Properties</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Publishing Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Before you publish</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Check that names are spelled correctly</li>
                <li>• Verify dates and locations if possible</li>
                <li>• Add captions to help identify people in photos</li>
                <li>• Consider who should have access to this story</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Back to Media
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onPreview}
            disabled={!isValid || isLoading}
          >
            Preview
          </Button>
          <Button 
            variant="outline" 
            onClick={onSaveDraft}
            disabled={!isValid || isLoading}
          >
            Save Draft
          </Button>
          <Button 
            onClick={onPublish}
            disabled={!isValid || isLoading}
            className="bg-brand-green hover:bg-brand-green/90 text-brand-green-foreground"
          >
            {isLoading ? 'Publishing...' : 'Publish Story'}
          </Button>
        </div>
      </div>
    </div>
  )
}