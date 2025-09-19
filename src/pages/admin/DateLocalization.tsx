/**
 * Admin page for date localization management
 */

import AdminAuthGuard from '@/components/admin/AdminAuthGuard'
import DateLocalizationPanel from '@/components/admin/DateLocalizationPanel'

export default function DateLocalization() {
  return (
    <AdminAuthGuard requiredRole="SUPER_ADMIN">
      <DateLocalizationPanel />
    </AdminAuthGuard>
  )
}