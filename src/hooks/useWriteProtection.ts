import { useImpersonation } from '@/contexts/ImpersonationContext'
import { useAnalytics } from './useAnalytics'
import { toast } from '@/components/ui/use-toast'

export function useWriteProtection() {
  const { isWriteBlocked } = useImpersonation()
  const { track } = useAnalytics()

  const checkWritePermission = (operation: string): boolean => {
    if (isWriteBlocked) {
      track('ADMIN_IMPERSONATE_BLOCKED_WRITE', {
        operation,
        timestamp: new Date().toISOString()
      })

      toast({
        title: "Action Blocked",
        description: "Write operations are disabled during impersonation mode.",
        variant: "destructive"
      })

      return false
    }
    
    return true
  }

  const protectedOperation = async <T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T | null> => {
    if (!checkWritePermission(operation)) {
      return null
    }
    
    return await fn()
  }

  return {
    isWriteBlocked,
    checkWritePermission,
    protectedOperation
  }
}