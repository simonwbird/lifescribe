import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Lightbulb, 
  FileText, 
  Camera, 
  Calendar, 
  UserPlus,
  ChevronRight
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface HeroStripProps {
  familyId: string
  userId: string
  isElderMode?: boolean
  onOpenVoiceCapture?: () => void
}

interface HeroTile {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  badge?: number
  action: () => void
  variant?: 'default' | 'primary'
}

export function HeroStrip({ familyId, userId, isElderMode = false, onOpenVoiceCapture }: HeroStripProps) {
  const navigate = useNavigate()
  const [draftCount, setDraftCount] = useState(0)
  const [todayPrompt, setTodayPrompt] = useState<any>(null)

  // Real-time draft count
  useEffect(() => {
    loadDraftCount()

    const channel = supabase
      .channel('draft-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stories',
        filter: `family_id=eq.${familyId}`,
      }, () => {
        loadDraftCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [familyId, userId])

  // Load today's prompt
  useEffect(() => {
    loadTodayPrompt()
  }, [familyId])

  async function loadDraftCount() {
    const { count } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', familyId)
      .eq('profile_id', userId)
      .eq('status', 'draft')

    setDraftCount(count || 0)
  }

  async function loadTodayPrompt() {
    const { data } = await supabase
      .from('prompt_instances')
      .select('id, prompts(title)')
      .eq('family_id', familyId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (data) setTodayPrompt(data)
  }

  const tiles: HeroTile[] = [
    {
      id: 'prompt',
      title: "Today's Prompt",
      subtitle: todayPrompt?.prompts?.title || 'What would you like to remember?',
      icon: <Lightbulb className="h-6 w-6" />,
      action: () => {
        // Elder Mode: open inline recorder on Home
        if (isElderMode && onOpenVoiceCapture) {
          onOpenVoiceCapture()
          return
        }
        
        // Regular mode: navigate to composer
        if (todayPrompt?.id) {
          navigate(`/stories/new-tabbed?tab=voice&promptId=${todayPrompt.id}&source=hero`)
        } else {
          navigate('/stories/new-tabbed?tab=voice&promptId=today&source=hero')
        }
      },
      variant: 'primary',
    },
    {
      id: 'drafts',
      title: 'Resume Drafts',
      subtitle: draftCount > 0 ? `${draftCount} draft${draftCount === 1 ? '' : 's'}` : 'No drafts',
      icon: <FileText className="h-6 w-6" />,
      badge: draftCount,
      action: () => navigate('/drafts'),
    },
    {
      id: 'photo',
      title: 'Add Photo',
      subtitle: 'Capture or scan',
      icon: <Camera className="h-6 w-6" />,
      action: () => navigate('/stories/new-tabbed?tab=photo&source=hero'),
    },
    {
      id: 'event',
      title: 'Create Event',
      subtitle: 'Plan together',
      icon: <Calendar className="h-6 w-6" />,
      action: () => navigate('/events/new?source=hero'),
    },
    {
      id: 'invite',
      title: 'Invite Family',
      subtitle: 'Grow your circle',
      icon: <UserPlus className="h-6 w-6" />,
      action: () => navigate('/invites/new?source=hero'),
    },
  ]

  return (
    <div className="w-full border-b bg-background">
      <div className="container px-4 py-6">
        {/* Mobile: Vertical Stack */}
        <div className="grid gap-3 sm:hidden">
          {tiles.map((tile) => (
            <HeroTileCard key={tile.id} tile={tile} />
          ))}
        </div>

        {/* Tablet/Desktop: Horizontal Scroll */}
        <div className="hidden sm:block">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {tiles.map((tile) => (
              <div key={tile.id} className="flex-shrink-0 w-64">
                <HeroTileCard tile={tile} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function HeroTileCard({ tile }: { tile: HeroTile }) {
  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5',
        tile.variant === 'primary' && 'border-primary/50 bg-primary/5'
      )}
      onClick={tile.action}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={cn(
                'flex-shrink-0 rounded-lg p-2',
                tile.variant === 'primary'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {tile.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-0.5 truncate">
                {tile.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {tile.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            {tile.badge !== undefined && tile.badge > 0 && (
              <Badge variant="secondary" className="h-6 min-w-6 px-2">
                {tile.badge}
              </Badge>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
