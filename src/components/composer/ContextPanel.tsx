import { DatePrecisionPicker, DatePrecisionValue } from '@/components/DatePrecisionPicker'

interface ContextPanelProps {
  dateValue: DatePrecisionValue
  onDateChange: (value: DatePrecisionValue) => void
}

export function ContextPanel({ dateValue, onDateChange }: ContextPanelProps) {
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
        <p className="text-sm text-muted-foreground">
          Coming soon: Tag people in your stories
        </p>
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
