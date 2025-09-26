import { createContext, useContext, ReactNode } from 'react'
import { useABTesting } from '@/hooks/useABTesting'

interface ABTestContextType {
  getVariant: (testId: string) => Promise<string | null>
  getTestConfig: (testId: string) => Promise<Record<string, any> | null>
  assignments: Record<string, string>
  loading: boolean
}

const ABTestContext = createContext<ABTestContextType | undefined>(undefined)

export function ABTestProvider({ children }: { children: ReactNode }) {
  const abTesting = useABTesting()

  return (
    <ABTestContext.Provider value={abTesting}>
      {children}
    </ABTestContext.Provider>
  )
}

export function useABTest() {
  const context = useContext(ABTestContext)
  if (context === undefined) {
    throw new Error('useABTest must be used within an ABTestProvider')
  }
  return context
}