import { supabase } from '@/integrations/supabase/client'
import type { ExportAnalysis, RTBFAnalysis, RTBFCompletionReceipt } from './complianceTypes'

export class ComplianceService {
  static async requestEnhancedExport(includeMedia: boolean = true): Promise<ExportAnalysis> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No session')

    const response = await fetch(`https://imgtnixyralpdrmedwzi.supabase.co/functions/v1/export-enhanced`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ includeMedia })
    })

    if (!response.ok) {
      throw new Error('Export request failed')
    }

    return response.json()
  }

  static async analyzeRTBFImpact(): Promise<RTBFAnalysis> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No session')

    const response = await fetch(`https://imgtnixyralpdrmedwzi.supabase.co/functions/v1/rtbf-analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('RTBF analysis failed')
    }

    return response.json()
  }

  static async executeRTBF(
    confirmationCode: string,
    analysisId: string,
    dualControlVerified: boolean
  ): Promise<RTBFCompletionReceipt> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('No session')

    const response = await fetch(`https://imgtnixyralpdrmedwzi.supabase.co/functions/v1/rtbf-execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        confirmation_code: confirmationCode,
        analysis_id: analysisId,
        dual_control_verified: dualControlVerified
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'RTBF execution failed')
    }

    return response.json()
  }

  static downloadExportFile(exportData: ExportAnalysis, filename?: string) {
    if (!exportData.zip_contents) {
      throw new Error('No export data available')
    }

    // Create a simple archive (in production, would be a proper ZIP)
    const exportContent = JSON.stringify(exportData.zip_contents, null, 2)
    const blob = new Blob([exportContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `family-data-export-${exportData.export_id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}