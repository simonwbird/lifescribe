import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { formatForUser, getCurrentUserRegion } from '@/utils/date'

interface WelcomeHeaderProps {
  firstName?: string;
  lastSeen?: string;
  onCreateClick: () => void
}

const formatLastSeen = (timestamp?: string) => {
  if (!timestamp) return 'Welcome back!';
  
  return `Last seen ${formatForUser(timestamp, 'relative', getCurrentUserRegion())}`;
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
        className="bg-brand-700 hover:bg-brand-600 text-white px-8 font-serif"
      >
        <Plus className="w-5 h-5 mr-2" />
        Create
      </Button>
    </div>
  )
}