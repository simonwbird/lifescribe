import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Image, MessageCircle, Mic, UserPlus, Plus } from 'lucide-react'
import { QuickAction } from '@/lib/homeTypes'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useIsMobile } from '@/hooks/use-mobile'

interface QuickStartProps {
  simpleMode?: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: 'story',
    title: 'Share a Story',
    description: 'Tell a memory',
    icon: 'FileText',
    shortcut: 'S',
    action: () => console.log('Share story')
  },
  {
    id: 'photos',
    title: 'Upload Photos',
    description: 'Add from camera roll',
    icon: 'Image',
    shortcut: 'U',
    action: () => console.log('Upload photos')
  },
  {
    id: 'question',
    title: 'Ask the Family',
    description: 'Start a question',
    icon: 'MessageCircle',
    shortcut: 'Q',
    action: () => console.log('Ask family')
  },
  {
    id: 'audio',
    title: 'Record Audio',
    description: 'Capture a voice note',
    icon: 'Mic',
    shortcut: 'R',
    action: () => console.log('Record audio')
  },
  {
    id: 'invite',
    title: 'Invite a Family Member',
    description: 'Grow your circle',
    icon: 'UserPlus',
    shortcut: 'I',
    action: () => console.log('Invite member')
  }
]

const getIcon = (iconName: string) => {
  const iconProps = { className: "w-6 h-6" };
  switch (iconName) {
    case 'FileText': return <FileText {...iconProps} />;
    case 'Image': return <Image {...iconProps} />;
    case 'MessageCircle': return <MessageCircle {...iconProps} />;
    case 'Mic': return <Mic {...iconProps} />;
    case 'UserPlus': return <UserPlus {...iconProps} />;
    default: return <FileText {...iconProps} />;
  }
};

export default function QuickStart({ simpleMode = false }: QuickStartProps) {
  const { track } = useAnalytics();
  const isMobile = useIsMobile();

  const handleActionClick = (action: QuickAction) => {
    track(`quickstart_selected_${action.shortcut.toLowerCase()}` as any);
    action.action();
  }

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    s: quickActions[0].action,
    u: quickActions[1].action,
    q: quickActions[2].action,
    r: quickActions[3].action,
    i: quickActions[4].action,
  });

  // In simple mode, show only essential actions as large buttons
  if (simpleMode) {
    const essentialActions = quickActions.slice(0, 2); // Share Story, Upload Photos
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {essentialActions.map((action) => (
          <Button
            key={action.id}
            size="lg"
            variant={action.id === 'story' ? 'default' : 'outline'}
            className={`h-20 text-h3 font-serif ${
              action.id === 'story' 
                ? 'bg-sage hover:bg-sage/90 text-cream' 
                : 'border-sage/30 hover:bg-sage/5 text-sage'
            }`}
            onClick={() => handleActionClick(action)}
          >
            {action.title}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-h3 font-serif">Quick Start</CardTitle>
              <CardDescription>What would you like to do today?</CardDescription>
            </div>
            {!isMobile && (
              <Badge variant="outline" className="text-xs">
                Press S, U, Q, R, or I
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-3 hover:bg-muted/50 transition-colors group"
                onClick={() => handleActionClick(action)}
              >
                <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {getIcon(action.icon)}
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm mb-1 flex items-center gap-1">
                    {action.title}
                    {!isMobile && (
                      <Badge variant="secondary" className="text-xs h-4 px-1">
                        {action.shortcut}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mobile floating action button */}
      {isMobile && (
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50"
          onClick={() => handleActionClick(quickActions[0])} // Default to Share Story
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </>
  )
}