import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Cake, Heart, Play, Eye, Clock, CheckCircle, Circle } from 'lucide-react'

interface CategorySectionProps {
  title: string
  icon: React.ReactNode
  instances: any[]
  onPromptClick: (instanceId: string) => void
  showDueBadges?: boolean
  getDaysUntilBirthday?: (instance: any) => number | null
}

export default function CategorySection({ 
  title, 
  icon, 
  instances, 
  onPromptClick,
  showDueBadges = false,
  getDaysUntilBirthday
}: CategorySectionProps) {
  if (instances.length === 0) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
        <Badge variant="secondary" className="ml-2">
          {instances.length}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {instances.map((instance) => {
          const daysUntil = showDueBadges && getDaysUntilBirthday ? getDaysUntilBirthday(instance) : null
          
          return (
            <Card key={instance.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {instance.prompt?.title}
                  </CardTitle>
                  <div className="flex flex-col gap-1 items-end">
                    {getStatusIcon(instance.status)}
                    {daysUntil !== null && (
                      <Badge 
                        variant={daysUntil <= 1 ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {daysUntil === 0 ? 'Due today' : 
                         daysUntil === 1 ? 'Due tomorrow' :
                         `Due in ${daysUntil} days`}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {instance.prompt?.body}
                </p>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {instance.prompt?.category}
                  </Badge>
                </div>

                <Button 
                  onClick={() => onPromptClick(instance.id)}
                  className="w-full"
                  variant={instance.status === 'completed' ? 'outline' : 'default'}
                >
                  {instance.status === 'completed' ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      View Response
                    </>
                  ) : instance.status === 'in_progress' ? (
                    <>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Continue
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}