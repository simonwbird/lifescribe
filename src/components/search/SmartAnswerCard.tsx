import { ArrowRight, MapPin, Calendar, Users, ChefHat } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import type { SmartAnswer } from '@/lib/searchService'

interface SmartAnswerCardProps {
  smartAnswer: SmartAnswer
  onRefinement?: (refinement: { type: string; label: string; filter: any }) => void
}

export default function SmartAnswerCard({ smartAnswer, onRefinement }: SmartAnswerCardProps) {
  const renderContent = () => {
    switch (smartAnswer.type) {
      case 'recipe_list':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {smartAnswer.data.slice(0, 4).map((recipe: any) => (
              <Link 
                key={recipe.id} 
                to={recipe.url}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <ChefHat className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">{recipe.title}</h4>
                  <p className="text-sm text-muted-foreground">{recipe.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        )

      case 'occupancy':
        return (
          <div className="space-y-3">
            {smartAnswer.data.map((occupant: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="font-medium">{occupant.name}</span>
                    {occupant.relationship && (
                      <span className="text-sm text-muted-foreground ml-2">({occupant.relationship})</span>
                    )}
                  </div>
                </div>
                {occupant.dateRange && (
                  <Badge variant="outline">{occupant.dateRange}</Badge>
                )}
              </div>
            ))}
          </div>
        )

      case 'media_slice':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {smartAnswer.data.slice(0, 8).map((item: any) => (
              <Link key={item.id} to={item.url} className="aspect-square">
                <img
                  src={item.image || '/placeholder.svg'}
                  alt={item.title}
                  className="w-full h-full object-cover rounded-lg hover:scale-105 transition-transform"
                />
              </Link>
            ))}
          </div>
        )

      case 'occasion':
        return (
          <div className="space-y-4">
            {smartAnswer.data.stories && (
              <div>
                <h4 className="font-medium mb-2">Stories</h4>
                <div className="space-y-2">
                  {smartAnswer.data.stories.map((story: any) => (
                    <Link 
                      key={story.id}
                      to={story.url}
                      className="block p-3 rounded-lg border hover:bg-accent"
                    >
                      <h5 className="font-medium">{story.title}</h5>
                      <p className="text-sm text-muted-foreground">{story.snippet}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
            {smartAnswer.data.photos && smartAnswer.data.photos.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Photos</h4>
                <div className="grid grid-cols-3 gap-2">
                  {smartAnswer.data.photos.slice(0, 6).map((photo: any) => (
                    <img
                      key={photo.id}
                      src={photo.image}
                      alt={photo.title}
                      className="aspect-square object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return (
          <p className="text-muted-foreground">
            {JSON.stringify(smartAnswer.data)}
          </p>
        )
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{smartAnswer.title}</CardTitle>
          <Button variant="outline" size="sm" className="gap-2">
            Open full results
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {renderContent()}
        
        {/* Refinement Chips */}
        {smartAnswer.refinements && smartAnswer.refinements.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground mr-2">Refine:</span>
              {smartAnswer.refinements.map((refinement, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onRefinement?.(refinement)}
                  className="h-7 text-xs"
                >
                  {refinement.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}