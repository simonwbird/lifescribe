'use client'
import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface DatePrecisionValue {
  date: Date | null
  yearOnly: boolean
}

export function DatePrecisionPicker({
  value,
  onChange,
  className
}: {
  value: DatePrecisionValue
  onChange: (v: DatePrecisionValue) => void
  className?: string
}) {
  const [textInput, setTextInput] = React.useState('')

  // Update text input when value changes
  React.useEffect(() => {
    if (value.date) {
      if (value.yearOnly) {
        setTextInput(value.date.getFullYear().toString())
      } else {
        setTextInput(format(value.date, 'dd/MM/yyyy'))
      }
    } else {
      setTextInput('')
    }
  }, [value])

  function handleTextInput(text: string) {
    setTextInput(text)
    if (!text.trim()) {
      onChange({ date: null, yearOnly: false })
      return
    }

    // Try to parse various date formats
    const date = new Date(text)
    if (!isNaN(date.getTime())) {
      // Check if it looks like just a year (4 digits)
      const isYearOnly = /^\d{4}$/.test(text.trim())
      onChange({ date, yearOnly: isYearOnly })
    }
  }

  function handlePrecisionChange(precision: string) {
    if (precision === 'year' && value.date) {
      // Keep the year but mark as year only
      const yearDate = new Date(value.date.getFullYear(), 0, 1)
      onChange({ date: yearDate, yearOnly: true })
    } else if (precision === 'full' && value.date) {
      // Keep the date but mark as full precision
      onChange({ ...value, yearOnly: false })
    }
  }

  const precisionValue = value.yearOnly ? 'year' : 'full'

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Input
          placeholder="e.g. 21/04/2014 or 2014"
          value={textInput}
          onChange={(e) => handleTextInput(e.target.value)}
          className="pr-10"
        />
        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      
      <Select value={precisionValue} onValueChange={handlePrecisionChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="full">Year, Month, Day</SelectItem>
          <SelectItem value="year">Year Only</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}