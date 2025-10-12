import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Bell, Share2 } from 'lucide-react'
import { Person } from '@/utils/personUtils'
import { ShareAnniversaryModal } from './ShareAnniversaryModal'
import { useToast } from '@/hooks/use-toast'
import { differenceInDays, addYears, startOfDay, isBefore } from 'date-fns'

interface AnniversariesWidgetProps {
  person: Person
  preset: 'life' | 'tribute'
  canManageReminders?: boolean
}

interface Anniversary {
  type: 'birthday' | 'memorial'
  date: Date
  nextOccurrence: Date
  daysUntil: number
  yearsAgo?: number
}

export function AnniversariesWidget({ 
  person, 
  preset,
  canManageReminders = false 
}: AnniversariesWidgetProps) {
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedAnniversary, setSelectedAnniversary] = useState<Anniversary | null>(null)
  const { toast } = useToast()

  const calculateNextAnniversary = (originalDate: Date, type: 'birthday' | 'memorial'): Anniversary | null => {
    const today = startOfDay(new Date())
    const thisYear = today.getFullYear()
    
    // Create this year's anniversary
    let nextOccurrence = new Date(
      thisYear,
      originalDate.getMonth(),
      originalDate.getDate()
    )
    
    // If this year's anniversary has passed, use next year
    if (isBefore(nextOccurrence, today)) {
      nextOccurrence = addYears(nextOccurrence, 1)
    }
    
    const daysUntil = differenceInDays(nextOccurrence, today)
    const yearsAgo = thisYear - originalDate.getFullYear()
    
    return {
      type,
      date: originalDate,
      nextOccurrence,
      daysUntil,
      yearsAgo: type === 'memorial' ? yearsAgo : undefined
    }
  }

  const anniversaries: Anniversary[] = []
  
  if (person.birth_date) {
    const birthday = calculateNextAnniversary(new Date(person.birth_date), 'birthday')
    if (birthday) anniversaries.push(birthday)
  }
  
  if (person.death_date) {
    const memorial = calculateNextAnniversary(new Date(person.death_date), 'memorial')
    if (memorial) anniversaries.push(memorial)
  }

  // Sort by days until next occurrence
  anniversaries.sort((a, b) => a.daysUntil - b.daysUntil)

  const handleShareClick = (anniversary: Anniversary) => {
    setSelectedAnniversary(anniversary)
    setShareModalOpen(true)
  }

  const handleCreateReminder = (anniversary: Anniversary) => {
    toast({
      title: "Reminder Created",
      description: `You'll be notified before this ${anniversary.type === 'birthday' ? 'birthday' : 'memorial'}.`
    })
  }

  if (anniversaries.length === 0) {
    return null
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const getDaysText = (days: number) => {
    if (days === 0) return 'Today'
    if (days === 1) return 'Tomorrow'
    return `${days} days`
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {preset === 'tribute' ? 'Anniversaries' : 'Upcoming Dates'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {anniversaries.map((anniversary, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Badge 
                    variant="outline" 
                    className="mb-1"
                  >
                    {anniversary.type === 'birthday' ? 'Birthday' : 'Memorial'}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(anniversary.nextOccurrence)}
                    {anniversary.yearsAgo && (
                      <span className="ml-1">
                        ({anniversary.yearsAgo} {anniversary.yearsAgo === 1 ? 'year' : 'years'})
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {getDaysText(anniversary.daysUntil)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => handleShareClick(anniversary)}
                >
                  <Share2 className="h-3 w-3" />
                  Invite family
                </Button>
                
                {canManageReminders && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateReminder(anniversary)}
                  >
                    <Bell className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <ShareAnniversaryModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        anniversary={selectedAnniversary}
        personName={`${person.given_name} ${person.surname || ''}`.trim()}
      />
    </>
  )
}
