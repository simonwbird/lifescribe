import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AuditLogViewer from '@/components/admin/AuditLogViewer'
import QuarterlyAccessReview from '@/components/admin/QuarterlyAccessReview'
import { Shield, FileText, Users } from 'lucide-react'

export default function AdminAudit() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="audit-logs" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="audit-logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="access-review" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Access Review
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit-logs">
          <AuditLogViewer />
        </TabsContent>

        <TabsContent value="access-review">
          <QuarterlyAccessReview />
        </TabsContent>
      </Tabs>
    </div>
  )
}