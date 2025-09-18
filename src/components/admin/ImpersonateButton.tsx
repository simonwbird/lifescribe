import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import type { ImpersonationTarget } from '@/lib/impersonationTypes'

interface ImpersonateButtonProps {
  target: ImpersonationTarget
  size?: 'sm' | 'default'
  variant?: 'default' | 'outline' | 'ghost'
}

export default function ImpersonateButton({ 
  target, 
  size = 'sm', 
  variant = 'outline' 
}: ImpersonateButtonProps) {
  const { startImpersonation, impersonationState } = useImpersonation()

  const handleImpersonate = () => {
    startImpersonation(target)
  }

  // Disable if already impersonating
  const isDisabled = impersonationState.isImpersonating

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleImpersonate}
      disabled={isDisabled}
      className="gap-2"
    >
      <Eye className="h-3 w-3" />
      View as...
    </Button>
  )
}