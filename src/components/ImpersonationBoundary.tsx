import { ReactNode } from 'react'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import ImpersonationBanner from './admin/ImpersonationBanner'

interface ImpersonationBoundaryProps {
  children: ReactNode
}

export default function ImpersonationBoundary({ children }: ImpersonationBoundaryProps) {
  const { impersonationState } = useImpersonation()

  return (
    <>
      {impersonationState.isImpersonating && <ImpersonationBanner />}
      {children}
    </>
  )
}