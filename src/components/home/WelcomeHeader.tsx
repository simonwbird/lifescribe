import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import type { LastVisit } from '@/lib/homeTypes'

interface WelcomeHeaderProps {
  firstName: string
  lastVisit: LastVisit
  isSimpleMode?: boolean
}

export default function WelcomeHeader({ firstName, lastVisit, isSimpleMode }: WelcomeHeaderProps) {
  const navigate = useNavigate()
  
  const lastSeenTime = formatDistanceToNow(new Date(lastVisit.lastLoginAt), { addSuffix: true })

  return (
    <header className="flex items-center justify-between mb-8">
      <div className="space-y-2">
        <h1 className={`font-bold text-foreground ${isSimpleMode ? 'text-4xl' : 'text-3xl'}`}>
          Welcome back, {firstName}
        </h1>
        <div className={`text-muted-foreground space-y-1 ${isSimpleMode ? 'text-lg' : 'text-base'}`}>
          <p>Last seen {lastSeenTime}</p>
          <p className="text-sm italic">Where your family stories live forever.</p>
        </div>
      </div>
      
      <Button 
        onClick={() => navigate('/stories/new')}
        size={isSimpleMode ? "lg" : "default"}
        className={`gap-2 ${isSimpleMode ? 'text-lg px-6 py-3' : ''}`}
      >
        <Plus className={`${isSimpleMode ? 'h-6 w-6' : 'h-5 w-5'}`} />
        Create
      </Button>
    </header>
  )
}