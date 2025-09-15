import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Eye, Lock, Users } from 'lucide-react'

interface PrivacySelectorProps {
  value: 'family' | 'private'
  onValueChange: (value: 'family' | 'private') => void
  className?: string
}

export default function PrivacySelector({ value, onValueChange, className = '' }: PrivacySelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium flex items-center gap-2">
        <Eye className="h-4 w-4" />
        Visible to:
      </Label>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Select value={value} onValueChange={onValueChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="family" className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>Family</span>
                  </div>
                </SelectItem>
                <SelectItem value="private" className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-orange-600" />
                    <span>Private</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="text-sm">
              <div className="font-medium mb-1">Privacy Options:</div>
              <div className="space-y-1 text-xs">
                <div><strong>Family:</strong> Visible to all family members</div>
                <div><strong>Private:</strong> Only visible to you</div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}