import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Gift, FileText, Camera } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'

interface Birthday {
  id: string
  person: string
  date: string
  daysUntil: number
  age?: number
}

const mockBirthdays: Birthday[] = [
  {
    id: '1',
    person: 'Grandma Rose',
    date: 'Sept 28',
    daysUntil: 13,
    age: 84
  },
  {
    id: '2', 
    person: 'Uncle Jim',
    date: 'Oct 5',
    daysUntil: 20,
    age: 67
  },
  {
    id: '3',
    person: 'Cousin Sarah',
    date: 'Oct 12', 
    daysUntil: 27,
    age: 32
  }
]

export default function UpcomingBirthdays() {
  const { track } = useAnalytics()

  const handleQuickAction = (action: string, person: string) => {
    track('birthday_quick_action', { action, person })
    // In real app, would navigate to appropriate create flow
    console.log(`Quick action: ${action} for ${person}`)
  }

  const getDaysText = (days: number) => {
    if (days === 0) return 'Today!'
    if (days === 1) return 'Tomorrow'
    if (days < 7) return `${days} days`
    if (days < 14) return `${Math.floor(days / 7)} week`
    return `${Math.floor(days / 7)} weeks`
  }

  const getUrgencyColor = (days: number) => {
    if (days <= 7) return 'bg-red-100 text-red-700 border-red-200'
    if (days <= 14) return 'bg-orange-100 text-orange-700 border-orange-200'
    return 'bg-blue-100 text-blue-700 border-blue-200'
  }

  if (mockBirthdays.length === 0) {
    return null
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Upcoming
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {mockBirthdays.slice(0, 3).map((birthday) => (
          <div 
            key={birthday.id}
            className="p-3 rounded-lg border bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-pink-200 dark:border-pink-800"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {birthday.person}
                    {birthday.age && (
                      <span className="text-muted-foreground"> turns {birthday.age}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{birthday.date}</span>
                  </div>
                </div>
                
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getUrgencyColor(birthday.daysUntil)}`}
                >
                  {getDaysText(birthday.daysUntil)}
                </Badge>
              </div>

              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction('write_note', birthday.person)}
                  className="flex-1 gap-1 text-xs h-7 bg-white dark:bg-gray-900"
                >
                  <FileText className="h-3 w-3" />
                  Write note
                </Button>
                
                <Button
                  variant="outline"
                  size="sm" 
                  onClick={() => handleQuickAction('add_photo', birthday.person)}
                  className="flex-1 gap-1 text-xs h-7 bg-white dark:bg-gray-900"
                >
                  <Camera className="h-3 w-3" />
                  Add photo
                </Button>
              </div>
            </div>
          </div>
        ))}

        <div className="pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => track('view_all_birthdays_clicked')}
          >
            View all upcoming events
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}