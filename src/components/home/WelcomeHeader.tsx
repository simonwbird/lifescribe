import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface WelcomeHeaderProps {
  firstName?: string;
  lastSeen?: string;
  onCreateClick: () => void
}

const formatLastSeen = (timestamp?: string) => {
  if (!timestamp) return 'Welcome back!';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 7) {
    return `Last seen ${date.toLocaleDateString()}`;
  } else if (diffDays > 0) {
    return `Last seen ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `Last seen ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else {
    return 'Last seen recently';
  }
};

export default function WelcomeHeader({ firstName = 'Emily', lastSeen, onCreateClick }: WelcomeHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-h1 font-serif font-semibold text-foreground mb-1">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground mb-1">
          {formatLastSeen(lastSeen)}
        </p>
        <p className="text-body text-muted-foreground italic">
          Where your family stories live forever.
        </p>
      </div>
      <Button 
        onClick={onCreateClick}
        size="lg"
        className="bg-sage hover:bg-sage/90 text-cream px-8 font-serif"
      >
        <Plus className="w-5 h-5 mr-2" />
        Create
      </Button>
    </div>
  )
}