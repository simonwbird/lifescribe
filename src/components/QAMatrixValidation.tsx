/**
 * QA Matrix validation component - proves the rendering rules work correctly
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatForUser, REGION_PRESETS } from '@/utils/date'

export default function QAMatrixValidation() {
  // Test data matching QA Matrix requirements
  const testCases = [
    {
      label: 'Birthday (dateOnly)',
      stored: '1953-10-11',
      kind: 'dateOnly' as const,
      expectedGB: '11 Oct 1953',
      expectedUS: 'Oct 11, 1953'
    },
    {
      label: 'Upload time (datetime)',  
      stored: '2025-09-19T18:30:00Z',
      kind: 'datetime' as const,
      expectedGB: '19 Sept 2025, 19:30',
      expectedUS: 'Sep 19, 2025, 2:30 PM'
    },
    {
      label: 'Digest schedule (datetime)',
      stored: '2025-09-20T14:00:00Z', 
      kind: 'datetime' as const,
      expectedGB: 'Sends 3:00 PM Friday',
      expectedUS: 'Sends 10:00 AM Friday'
    }
  ]

  const viewerA = REGION_PRESETS.UK  // en-GB, Europe/London
  const viewerB = REGION_PRESETS.US  // en-US, America/New_York

  return (
    <Card>
      <CardHeader>
        <CardTitle>QA Matrix Validation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Case</th>
                <th className="text-left p-2 font-medium">Canonical Stored</th>
                <th className="text-left p-2 font-medium">Viewer A (en-GB, Europe/London)</th>
                <th className="text-left p-2 font-medium">Viewer B (en-US, America/New_York)</th>
                <th className="text-left p-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {testCases.map((testCase, index) => {
                const actualGB = testCase.kind === 'datetime' && testCase.label.includes('Digest') 
                  ? `Sends ${formatForUser(testCase.stored, testCase.kind, viewerA)}`
                  : formatForUser(testCase.stored, testCase.kind, viewerA)
                
                const actualUS = testCase.kind === 'datetime' && testCase.label.includes('Digest')
                  ? `Sends ${formatForUser(testCase.stored, testCase.kind, viewerB)}`  
                  : formatForUser(testCase.stored, testCase.kind, viewerB)

                const gbMatch = actualGB === testCase.expectedGB
                const usMatch = actualUS === testCase.expectedUS
                const allMatch = gbMatch && usMatch

                return (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-medium">{testCase.label}</td>
                    <td className="p-2 font-mono text-xs">{testCase.stored}</td>
                    <td className="p-2">
                      <div className="space-y-1">
                        <div className={gbMatch ? 'text-green-600' : 'text-red-600'}>
                          {actualGB}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Expected: {testCase.expectedGB}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="space-y-1">
                        <div className={usMatch ? 'text-green-600' : 'text-red-600'}>
                          {actualUS}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Expected: {testCase.expectedUS}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant={allMatch ? 'default' : 'destructive'}>
                        {allMatch ? '✓ Pass' : '✗ Fail'}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}