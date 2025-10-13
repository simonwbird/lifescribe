import { DatePrecisionPicker, DatePrecisionValue } from '@/components/DatePrecisionPicker'
import { PeopleTagger, PersonTag } from './PeopleTagger'

interface ContextPanelProps {
  familyId: string
  dateValue: DatePrecisionValue
  peopleTags: PersonTag[]
  currentUserId?: string
  onDateChange: (value: DatePrecisionValue) => void
  onPeopleTagsChange: (tags: PersonTag[]) => void
}

export function ContextPanel({ 
  familyId, 
  dateValue, 
  peopleTags,
  currentUserId,
  onDateChange,
  onPeopleTagsChange 
}: ContextPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Context & Tags</h3>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          When was this?
        </label>
        <DatePrecisionPicker value={dateValue} onChange={onDateChange} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Tags
        </label>
        <p className="text-sm text-muted-foreground">
          Coming soon: Add tags to organize your stories
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          People
        </label>
        <PeopleTagger
          familyId={familyId}
          tags={peopleTags}
          onChange={onPeopleTagsChange}
          currentUserId={currentUserId}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Places
        </label>
        <p className="text-sm text-muted-foreground">
          Coming soon: Add location to your stories
        </p>
      </div>
    </div>
  )
}
