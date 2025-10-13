import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Check, 
  EyeOff, 
  Pencil, 
  X, 
  Calendar,
  MapPin,
  User,
  Volume2,
  Image as ImageIcon
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useAnalytics } from '@/hooks/useAnalytics'
import { tributeCopy } from '@/copy/tribute'

interface Memory {
  id: string
  person_id: string
  contributor_user: string | null
  contributor_name: string | null
  relationship_to_person: string | null
  modality: 'text' | 'voice' | 'photo'
  prompt_id: string | null
  title: string | null
  body: string | null
  audio_url: string | null
  photo_url: string | null
  year_approx: number | null
  place_id: string | null
  tags: string[]
  visibility: string
  status: 'pending' | 'approved' | 'hidden' | 'rejected'
  created_at: string
  updated_at: string
  profiles?: {
    full_name: string
    avatar_url: string | null
  }
  tribute_sparks?: {
    text: string
  }
}

interface MemoryCardProps {
  memory: Memory
  canModerate?: boolean
  onUpdate?: () => void
}

export function MemoryCard({ memory, canModerate = false, onUpdate }: MemoryCardProps) {
  const { toast } = useToast()
  const { track } = useAnalytics()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(memory.title || '')
  const [editTags, setEditTags] = useState(memory.tags.join(', '))
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdateStatus = async (newStatus: 'approved' | 'hidden' | 'rejected') => {
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('memories')
        .update({
          status: newStatus,
          moderated_at: new Date().toISOString()
        })
        .eq('id', memory.id)

      if (error) throw error

      // Track memory approval
      if (newStatus === 'approved') {
        track('memory_approved', {
          memory_id: memory.id,
          person_id: memory.person_id,
          prompt_id: memory.prompt_id,
          modality: memory.modality
        })
      }

      toast({
        title: newStatus === 'approved' ? tributeCopy.moderation.approved : tributeCopy.moderation.hidden,
        description: newStatus === 'approved' ? tributeCopy.moderation.approvedDescription : tributeCopy.moderation.hiddenDescription
      })

      onUpdate?.()
    } catch (error) {
      console.error('Error updating memory status:', error)
      toast({
        title: 'Failed to update',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveEdits = async () => {
    setIsUpdating(true)
    try {
      const tagsArray = editTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const { error } = await supabase
        .from('memories')
        .update({
          title: editTitle.trim() || null,
          tags: tagsArray
        })
        .eq('id', memory.id)

      if (error) throw error

      toast({
        title: 'Memory updated',
        description: 'Title and tags have been saved.'
      })

      setIsEditing(false)
      onUpdate?.()
    } catch (error) {
      console.error('Error updating memory:', error)
      toast({
        title: 'Failed to save',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const contributorName = memory.profiles?.full_name || memory.contributor_name || 'Anonymous'
  const promptText = memory.tribute_sparks?.text

  return (
    <Card className={memory.status === 'pending' ? 'border-yellow-500' : ''}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={
                  memory.status === 'pending' ? 'secondary' :
                  memory.status === 'approved' ? 'default' :
                  'destructive'
                }>
                  {memory.status}
                </Badge>
                <Badge variant="outline">
                  {memory.modality === 'text' && 'Written'}
                  {memory.modality === 'voice' && <><Volume2 className="h-3 w-3 mr-1" /> Voice</>}
                  {memory.modality === 'photo' && <><ImageIcon className="h-3 w-3 mr-1" /> Photo</>}
                </Badge>
                {memory.visibility === 'public' && (
                  <Badge variant="outline">Public</Badge>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Memory title (optional)"
                    className="font-semibold"
                  />
                  <Input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="Tags (comma-separated)"
                    className="text-sm"
                  />
                </div>
              ) : (
                <>
                  {memory.title && (
                    <h3 className="text-lg font-semibold mb-1">{memory.title}</h3>
                  )}
                  {memory.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {memory.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {canModerate && memory.status === 'pending' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                disabled={isUpdating}
              >
                {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              </Button>
            )}
          </div>

          {/* Prompt context */}
          {promptText && (
            <div className="text-sm text-muted-foreground italic border-l-2 pl-3">
              {promptText}
            </div>
          )}

          {/* Media content */}
          {memory.photo_url && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={memory.photo_url}
                alt={memory.title || 'Memory photo'}
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}

          {memory.audio_url && (
            <audio controls className="w-full">
              <source src={memory.audio_url} type="audio/webm" />
              Your browser does not support audio playback.
            </audio>
          )}

          {/* Body text */}
          {memory.body && (
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{memory.body}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {contributorName}
              {memory.relationship_to_person && ` (${memory.relationship_to_person})`}
            </div>
            {memory.year_approx && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {memory.year_approx}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
            </div>
          </div>

          {/* Moderation actions */}
          {canModerate && memory.status === 'pending' && (
            <div className="flex gap-2 pt-4 border-t">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSaveEdits}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setEditTitle(memory.title || '')
                      setEditTags(memory.tags.join(', '))
                    }}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => handleUpdateStatus('approved')}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus('hidden')}
                    disabled={isUpdating}
                  >
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
