import React, { createContext, useContext, ReactNode } from 'react'
import { useMode as useModeHook, UserMode, ModeFlags } from '@/hooks/useMode'

interface ModeContextType {
  mode: UserMode
  setMode: (mode: UserMode) => Promise<void>
  flags: ModeFlags
  loading: boolean
}

const ModeContext = createContext<ModeContextType | undefined>(undefined)

export function ModeProvider({ children }: { children: ReactNode }) {
  const modeData = useModeHook()

  return (
    <ModeContext.Provider value={modeData}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const context = useContext(ModeContext)
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider')
  }
  return context
}