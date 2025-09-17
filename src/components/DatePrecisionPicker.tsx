'use client'
import * as React from 'react'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

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
  const [open, setOpen] = React.useState(false)
  const [currentYear, setCurrentYear] = React.useState(new Date().getFullYear())
  const [textInput, setTextInput] = React.useState('')

  function handleTextInput(text: string) {
    setTextInput(text)
    if (!text.trim()) {
      onChange({ date: null, yearOnly: false })
      return
    }

    // Try to parse various date formats
    const date = new Date(text)
    if (!isNaN(date.getTime())) {
      onChange({ date, yearOnly: false })
    }
  }

  function setDate(d: Date | null) {
    onChange({ ...value, date: d, yearOnly: false })
  }

  function setYearOnly(year: number) {
    // Set to January 1st of the selected year
    const yearDate = new Date(year, 0, 1)
    onChange({ date: yearDate, yearOnly: true })
  }

  const buttonLabel = value.date
    ? value.yearOnly 
      ? `${value.date.getFullYear()} (year only)`
      : format(value.date, 'MMMM d, yyyy')
    : 'Set date (optional)'

  const years = Array.from({length: 120}, (_, i) => new Date().getFullYear() - i)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-start w-56">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {buttonLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch 
                checked={value.yearOnly} 
                onCheckedChange={(checked) => {
                  if (checked) {
                    setYearOnly(currentYear)
                  } else {
                    onChange({ date: null, yearOnly: false })
                  }
                }} 
                id="yearOnly" 
              />
              <Label htmlFor="yearOnly" className="text-sm">Year only (exact date unknown)</Label>
            </div>
            
            {value.yearOnly ? (
              <div className="space-y-2">
                <Label className="text-sm">Select Year</Label>
                <Select 
                  value={value.date?.getFullYear().toString()} 
                  onValueChange={(year) => setYearOnly(parseInt(year))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm">Type or Select Date</Label>
                <Input
                  placeholder="e.g. 1985, Jan 15 1985, 1/15/1985"
                  value={textInput}
                  onChange={(e) => handleTextInput(e.target.value)}
                  className="text-sm"
                />
                <Calendar
                  mode="single"
                  selected={value.date ?? undefined}
                  onSelect={(d) => setDate(d ?? null)}
                  className={cn("p-1 pointer-events-auto text-sm")}
                />
              </div>
            )}
            
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {value.date && (
        <Button variant="ghost" onClick={() => onChange({ date: null, yearOnly: false })}>
          Clear
        </Button>
      )}
    </div>
  )
}