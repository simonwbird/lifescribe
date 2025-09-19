/**
 * Toggle component to show UTC vs localized dates in admin views
 * Used throughout admin panels to debug date formatting issues
 */

import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Clock, Globe } from 'lucide-react'
import { formatForUser, RegionPrefs, REGION_PRESETS } from '@/utils/date'

interface AdminDateFieldToggleProps {
  utcValue: string
  dateKind: 'datetime' | 'dateOnly' | 'relative'
  className?: string
  showLabel?: boolean
  userRegion?: RegionPrefs
}

export default function AdminDateFieldToggle({
  utcValue,
  dateKind,
  className = "",
  showLabel = true,
  userRegion = REGION_PRESETS.UK
}: AdminDateFieldToggleProps) {
  const [showUTC, setShowUTC] = useState(false)

  const formattedLocal = formatForUser(utcValue, dateKind, userRegion)

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-2">
          <Switch
            id={`utc-toggle-${utcValue}`}
            checked={showUTC}
            onCheckedChange={setShowUTC}
            className="scale-75"
          />
          <label 
            htmlFor={`utc-toggle-${utcValue}`} 
            className="text-xs text-muted-foreground flex items-center gap-1"
          >
            {showUTC ? <Clock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
            {showUTC ? 'UTC' : 'Local'}
          </label>
        </div>
      )}
      
      <div className="space-y-1">
        <div className="font-mono text-sm">
          {showUTC ? utcValue : formattedLocal}
        </div>
        
        {showUTC && (
          <div className="text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              Local: {formattedLocal}
            </Badge>
          </div>
        )}
        
        {!showUTC && (
          <div className="text-xs text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              UTC: {utcValue}
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}