import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, Eye, EyeOff, Globe, Lock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface VisibilitySearchStatusProps {
  personId: string
  visibility: string
  indexability: string
  canEdit?: boolean
  lastIndexedAt?: Date | null
  onUpdate?: () => void
}

export function VisibilitySearchStatus({
  personId,
  visibility,
  indexability,
  canEdit = false,
  lastIndexedAt,
  onUpdate
}: VisibilitySearchStatusProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const handleVisibilityChange = async (newVisibility: string) => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('people')
        .update({ visibility: newVisibility })
        .eq('id', personId)

      if (error) throw error

      toast({
        title: "Visibility Updated",
        description: `Page is now ${newVisibility}`
      })
      
      onUpdate?.()
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update visibility settings",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleIndexabilityChange = async (newIndexability: string) => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('people')
        .update({ indexability: newIndexability })
        .eq('id', personId)

      if (error) throw error

      toast({
        title: "Search Status Updated",
        description: newIndexability === 'indexable' 
          ? "Page will be added to search engines within 60 seconds"
          : "Page will be excluded from search engines"
      })
      
      onUpdate?.()
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Could not update search settings",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'public': return <Globe className="h-3 w-3" />
      case 'unlisted': return <EyeOff className="h-3 w-3" />
      case 'private': return <Lock className="h-3 w-3" />
      default: return <Eye className="h-3 w-3" />
    }
  }

  const getVisibilityVariant = () => {
    switch (visibility) {
      case 'public': return 'default'
      case 'unlisted': return 'secondary'
      case 'private': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Search className="h-4 w-4" />
          Visibility & Discovery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Visibility</label>
          {canEdit ? (
            <Select
              value={visibility}
              onValueChange={handleVisibilityChange}
              disabled={isUpdating}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    Public
                  </div>
                </SelectItem>
                <SelectItem value="unlisted">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-3 w-3" />
                    Unlisted
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    Private
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant={getVisibilityVariant()} className="gap-1.5">
              {getVisibilityIcon()}
              {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
            </Badge>
          )}
          <p className="text-xs text-muted-foreground">
            {visibility === 'public' && 'Anyone can view this page'}
            {visibility === 'unlisted' && 'Only people with the link can view'}
            {visibility === 'private' && 'Only family members can view'}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Search Engines</label>
          {canEdit ? (
            <Select
              value={indexability}
              onValueChange={handleIndexabilityChange}
              disabled={isUpdating || (visibility !== 'public')}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="indexable">Indexable</SelectItem>
                <SelectItem value="noindex">No-index</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline">
              {indexability === 'indexable' ? 'Indexable' : 'No-index'}
            </Badge>
          )}
          <p className="text-xs text-muted-foreground">
            {indexability === 'indexable' 
              ? 'Appears in search results'
              : 'Hidden from search engines'}
          </p>
        </div>

        {indexability === 'indexable' && visibility === 'public' && lastIndexedAt && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Last indexed: {new Date(lastIndexedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
