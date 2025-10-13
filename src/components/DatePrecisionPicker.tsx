'use client'
import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type DatePrecision = 'exact' | 'month' | 'year' | 'circa' | 'unknown'

export interface DatePrecisionValue {
  date: Date | null
  precision: DatePrecision
  yearOnly: boolean // Legacy support
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

  // Initialize with today's date on mount if no value
  React.useEffect(() => {
    if (!value.date && value.precision === 'exact') {
      const today = new Date()
      onChange({ date: today, precision: 'exact', yearOnly: false })
    }
  }, [])

  // Update text input when value changes
  React.useEffect(() => {
    if (value.date) {
      const precision = value.precision || (value.yearOnly ? 'year' : 'exact')
      
      switch (precision) {
        case 'exact':
          setTextInput(format(value.date, 'dd/MM/yyyy'))
          break
        case 'month':
          setTextInput(format(value.date, 'MM/yyyy'))
          break
        case 'year':
        case 'circa':
          setTextInput(value.date.getFullYear().toString())
          break
        case 'unknown':
          setTextInput('')
          break
      }
    } else {
      setTextInput('')
    }
  }, [value])

  function handleTextInput(text: string) {
    setTextInput(text)
    if (!text.trim()) {
      onChange({ date: null, precision: 'unknown', yearOnly: false })
      return
    }

    // Try to parse various date formats
    const date = new Date(text)
    if (!isNaN(date.getTime())) {
      // Detect precision from input format
      if (/^\d{4}$/.test(text.trim())) {
        // Just year
        onChange({ date, precision: 'year', yearOnly: true })
      } else if (/^\d{2}\/\d{4}$/.test(text.trim())) {
        // Month/Year
        onChange({ date, precision: 'month', yearOnly: false })
      } else {
        // Full date
        onChange({ date, precision: 'exact', yearOnly: false })
      }
    }
  }

  function handlePrecisionChange(precision: DatePrecision) {
    if (precision === 'unknown') {
      onChange({ date: null, precision: 'unknown', yearOnly: false })
      return
    }

    if (!value.date) {
      // If no date set, create one for current year
      const now = new Date()
      onChange({ 
        date: new Date(now.getFullYear(), 0, 1), 
        precision, 
        yearOnly: precision === 'year' || precision === 'circa'
      })
      return
    }

    onChange({ 
      ...value, 
      precision,
      yearOnly: precision === 'year' || precision === 'circa'
    })
  }

  const precisionValue = value.precision || (value.yearOnly ? 'year' : 'exact')

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Input
          placeholder="e.g. 21/04/2014, 04/2014, or 2014"
          value={textInput}
          onChange={(e) => handleTextInput(e.target.value)}
          className="pr-10"
          disabled={precisionValue === 'unknown'}
        />
        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      
      <Select value={precisionValue} onValueChange={handlePrecisionChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="exact">Exact Date</SelectItem>
          <SelectItem value="month">Month & Year</SelectItem>
          <SelectItem value="year">Year Only</SelectItem>
          <SelectItem value="circa">Circa (Approximate Year)</SelectItem>
          <SelectItem value="unknown">Unknown</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}