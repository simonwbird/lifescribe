import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Cake, Calendar } from 'lucide-react'
import { usePrompts } from '@/hooks/usePrompts'
import { useLabs } from '@/hooks/useLabs'

interface BirthdayRailProps {
  familyId: string
  onPromptClick: (instanceId: string) => void
}

export default function BirthdayRail({ familyId, onPromptClick }: BirthdayRailProps) {
  const { flags } = useLabs()
  const { getUpcomingBirthdaysThisMonth, getDaysUntilBirthday, people } = usePrompts(familyId)

  const isBirthdaysEnabled = flags['prompts.birthdays']
  
  if (!isBirthdaysEnabled) return null

  const upcomingBirthdays = getUpcomingBirthdaysThisMonth()

  if (upcomingBirthdays.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Cake className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Moments to celebrate this month</h3>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-2">
        {upcomingBirthdays.map((instance) => {
          const personId = instance.person_ids?.[0]
          const person = personId ? people[personId] : null
          const daysUntil = getDaysUntilBirthday(instance)
          
          return (
            <Button 
              key={instance.id}
              variant="outline"
              size="lg"
              onClick={() => onPromptClick(instance.id)}
              className="flex-shrink-0 h-auto p-4 min-w-[200px] border-2 hover:border-primary/50 bg-gradient-to-r from-primary/5 to-accent/5"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="p-2 rounded-full bg-primary/10">
                  <Cake className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {person?.name || 'Someone special'}
                  </div>
                  {daysUntil !== null && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {daysUntil === 0 ? 'Today!' : 
                       daysUntil === 1 ? 'Tomorrow' :
                       `${daysUntil} days`}
                    </Badge>
                  )}
                </div>
              </div>
            </Button>
          )
        })}
      </div>
    </div>
  )
}