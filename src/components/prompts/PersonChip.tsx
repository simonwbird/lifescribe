import React from 'react'
import { Badge } from '@/components/ui/badge'
import { User } from 'lucide-react'

interface PersonChipProps {
  name: string
  className?: string
}

export default function PersonChip({ name, className }: PersonChipProps) {
  return (
    <Badge variant="secondary" className={`flex items-center gap-1 text-xs ${className}`}>
      <User className="h-3 w-3" />
      {name}
    </Badge>
  )
}