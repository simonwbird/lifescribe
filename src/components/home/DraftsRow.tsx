import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FileText, Camera, Mic, Edit, Trash2 } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'

interface DraftItem {
  id: string
  type: 'story' | 'voice' | 'video' | 'photo' | 'property' | 'object'
  title: string
  progress: number
  lastEdited: string
}

interface DraftsRowProps {
  drafts: DraftItem[]
  onResume?: (draftId: string) => void
  onDelete?: (draftId: string) => void
}

export default function DraftsRow({ drafts, onResume, onDelete }: DraftsRowProps) {
  const { track } = useAnalytics()

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'story': return FileText
      case 'voice': return Mic
      case 'photo': case 'video': return Camera
      default: return FileText
    }
  }

  const getProgressLabel = (progress: number) => {
    if (progress < 25) return 'Just started'
    if (progress < 50) return 'In progress'
    if (progress < 75) return 'Almost done'
    return 'Ready to publish'
  }

  const handleResume = (draft: DraftItem) => {
    track('draft_resumed', { draftId: draft.id, type: draft.type })
    onResume?.(draft.id)
  }

  const handleDelete = (draft: DraftItem) => {
    track('draft_deleted', { draftId: draft.id, type: draft.type })
    onDelete?.(draft.id)
  }

  if (!drafts || drafts.length === 0) {
    return null
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Continue where you left off
          </div>
          <Link to="/stories/drafts">
            <Button variant="ghost" size="sm" className="text-xs">
              View All
            </Button>
          </Link>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drafts.slice(0, 3).map((draft) => {
            const Icon = getTypeIcon(draft.type)
            
            return (
              <div 
                key={draft.id}
                className="p-4 rounded-lg border bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground capitalize">
                        {draft.type}
                      </span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(draft)}
                      className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-medium text-sm text-foreground mb-1 line-clamp-2">
                      {draft.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {draft.lastEdited}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {getProgressLabel(draft.progress)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {draft.progress}%
                      </span>
                    </div>
                    <Progress value={draft.progress} className="h-1.5" />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResume(draft)}
                    className="w-full gap-2 text-xs h-8"
                  >
                    <Edit className="h-3 w-3" />
                    Continue editing
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}