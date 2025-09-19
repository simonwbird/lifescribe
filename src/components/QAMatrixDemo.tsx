/**
 * QA Matrix Demo - Demonstrates locale-specific date formatting
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatForUser, REGION_PRESETS } from '@/utils/date'

export default function QAMatrixDemo() {
  // Sample data matching the QA Matrix requirements
  const sampleData = {
    birthday: '1953-10-11',           // Date-only
    uploadTime: '2025-09-19T18:30:00Z', // UTC timestamp
    digestSchedule: '2025-09-20T14:00:00Z' // UTC timestamp for Friday 2PM UTC
  }

  const viewerA = REGION_PRESETS.UK  // en-GB, Europe/London
  const viewerB = REGION_PRESETS.US  // en-US, America/New_York

  return (
    <Card>
      <CardHeader>
        <CardTitle>QA Matrix - Locale Formatting Demonstration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Case</h3>
            <div className="space-y-2">
              <div>Birthday (dateOnly)</div>
              <div>Upload time (datetime)</div>
              <div>Digest schedule (datetime)</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Viewer A (en-GB, Europe/London)</h3>
            <div className="space-y-2">
              <div>{formatForUser(sampleData.birthday, 'dateOnly', viewerA)}</div>
              <div>{formatForUser(sampleData.uploadTime, 'datetime', viewerA)}</div>
              <div>Sends {formatForUser(sampleData.digestSchedule, 'datetime', viewerA)}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Viewer B (en-US, America/New_York)</h3>
            <div className="space-y-2">
              <div>{formatForUser(sampleData.birthday, 'dateOnly', viewerB)}</div>
              <div>{formatForUser(sampleData.uploadTime, 'datetime', viewerB)}</div>
              <div>Sends {formatForUser(sampleData.digestSchedule, 'datetime', viewerB)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}