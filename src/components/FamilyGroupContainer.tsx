import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar } from 'lucide-react'

interface FamilyGroupContainerProps {
  title: string
  subtitle?: string
  memberCount: number
  generation?: number
  x: number
  y: number
  width: number
  height: number
  children: React.ReactNode
}

export default function FamilyGroupContainer({
  title,
  subtitle,
  memberCount,
  generation,
  x,
  y,
  width,
  height,
  children
}: FamilyGroupContainerProps) {
  return (
    <div
      className="absolute pointer-events-none z-0"
      style={{
        left: x - 20,
        top: y - 60,
        width: width + 40,
        height: height + 80
      }}
    >
      {/* Background container */}
      <Card className="w-full h-full bg-background/30 border-2 border-dashed border-muted-foreground/20 backdrop-blur-sm">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-semibold text-sm text-foreground">{title}</h4>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {generation !== undefined && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  Gen {generation + 1}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {memberCount}
              </Badge>
            </div>
          </div>
          
          {/* Content area for nodes */}
          <div className="relative pointer-events-auto">
            {children}
          </div>
        </div>
      </Card>
    </div>
  )
}