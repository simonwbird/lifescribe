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
import { Switch } from '@/components/ui/switch'

type DatePrecision = 'day' | 'month' | 'year'

export interface DatePrecisionValue {
  date: Date | null
  precision: DatePrecision
  approx: boolean
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

  function setDate(d: Date | null) {
    onChange({ ...value, date: d })
  }
  function setPrecision(p: DatePrecision) {
    onChange({ ...value, precision: p })
  }
  function setApprox(a: boolean) {
    onChange({ ...value, approx: a })
  }

  const buttonLabel = value.date
    ? `${value.approx ? '~ ' : ''}${format(value.date, value.precision === 'year' ? 'yyyy' : value.precision === 'month' ? 'MMM yyyy' : 'PP')}`
    : 'Set date (optional)'

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
            <Calendar
              mode="single"
              selected={value.date ?? undefined}
              onSelect={(d) => setDate(d ?? null)}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
            <div className="flex items-center gap-3">
              <div className="space-y-1">
                <Label>Precision</Label>
                <Select value={value.precision} onValueChange={(v) => setPrecision(v as DatePrecision)}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={value.approx} onCheckedChange={setApprox} id="approx" />
                <Label htmlFor="approx">Approximate</Label>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {value.date && (
        <Button variant="ghost" onClick={() => onChange({ date: null, precision: 'day', approx: false })}>
          Clear
        </Button>
      )}
    </div>
  )
}