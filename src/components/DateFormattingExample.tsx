/**
 * Example component demonstrating the new centralized date formatting utilities
 * Shows before/after comparison and different locale rendering
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatForUser, REGION_PRESETS, type RegionPrefs } from '@/utils/date'
import DateMigrationDemo from './DateMigrationDemo'

export default function DateFormattingExample() {
  const [selectedRegion, setSelectedRegion] = useState<RegionPrefs>(REGION_PRESETS.US)

  // Example data representing common app scenarios
  const examples = {
    birthday: '1985-07-15',
    anniversary: '2020-06-12', 
    storyCreated: '2023-12-25T09:30:00Z',
    commentAdded: '2024-01-15T14:45:32Z',
    recentActivity: '2024-01-18T16:20:00Z'
  }

  const regionOptions = [
    { key: 'US', label: 'United States (en-US, Eastern)', preset: REGION_PRESETS.US },
    { key: 'UK', label: 'United Kingdom (en-GB, London)', preset: REGION_PRESETS.UK },
    { key: 'CA', label: 'Canada (en-CA, Toronto)', preset: REGION_PRESETS.CA },
    { key: 'AU', label: 'Australia (en-AU, Sydney)', preset: REGION_PRESETS.AU },
    { key: 'FR', label: 'France (fr-FR, Paris)', preset: REGION_PRESETS.FR },
    { key: 'DE', label: 'Germany (de-DE, Berlin)', preset: REGION_PRESETS.DE },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phase 1A: Centralized Date Formatting</CardTitle>
          <CardDescription>
            Demonstrating locale-aware date formatting with the new utilities.
            Select different regions to see how dates adapt while maintaining canonical truth.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">User Region:</label>
            <Select 
              value={regionOptions.find(r => r.preset === selectedRegion)?.key} 
              onValueChange={(key) => {
                const option = regionOptions.find(r => r.key === key)
                if (option) setSelectedRegion(option.preset)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regionOptions.map(option => (
                  <SelectItem key={option.key} value={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Birthday & Anniversary (Date-Only) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Date-Only Values</CardTitle>
            <CardDescription>
              Birthdays & anniversaries - no timezone conversion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge variant="outline" className="mb-2">Birthday</Badge>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Raw: {examples.birthday}</div>
                <div className="font-medium">
                  {formatForUser(examples.birthday, 'dateOnly', selectedRegion)}
                </div>
                <div className="text-xs text-green-600">
                  ✓ Same calendar date globally
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Badge variant="outline" className="mb-2">Anniversary</Badge>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Raw: {examples.anniversary}</div>
                <div className="font-medium">
                  {formatForUser(examples.anniversary, 'dateOnly', selectedRegion)}
                </div>
                <div className="text-xs text-green-600">
                  ✓ Consistent across all users
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timestamps (DateTime) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timestamp Values</CardTitle>
            <CardDescription>
              Created/updated times - timezone converted
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge variant="outline" className="mb-2">Story Created</Badge>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">UTC: {examples.storyCreated}</div>
                <div className="font-medium">
                  {formatForUser(examples.storyCreated, 'datetime', selectedRegion)}
                </div>
                <div className="text-xs text-blue-600">
                  ↻ Converted to user timezone
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Badge variant="outline" className="mb-2">Comment Added</Badge>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">UTC: {examples.commentAdded}</div>
                <div className="font-medium">
                  {formatForUser(examples.commentAdded, 'datetime', selectedRegion, { withSeconds: true })}
                </div>
                <div className="text-xs text-blue-600">
                  ↻ With seconds precision
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relative Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Relative Time</CardTitle>
          <CardDescription>
            Activity feed timestamps - relative to user's current time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Badge variant="outline" className="mb-2">Recent Activity</Badge>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">UTC: {examples.recentActivity}</div>
                <div className="font-medium">
                  {formatForUser(examples.recentActivity, 'relative', selectedRegion)}
                </div>
                <div className="text-xs text-purple-600">
                  ⏱ Relative to user's "now"
                </div>
              </div>
            </div>
            
            <div>
              <Badge variant="outline" className="mb-2">Birthday (Relative)</Badge>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Date: {examples.birthday}</div>
                <div className="font-medium">
                  {formatForUser(examples.birthday, 'relative', selectedRegion)}
                </div>
                <div className="text-xs text-purple-600">
                  ⏱ Years since birth
                </div>
              </div>
            </div>

            <div>
              <Badge variant="outline" className="mb-2">Story Date (Relative)</Badge>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Date: {examples.anniversary}</div>
                <div className="font-medium">
                  {formatForUser(examples.anniversary, 'relative', selectedRegion)}
                </div>
                <div className="text-xs text-purple-600">
                  ⏱ Time since event
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Before/After Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Before vs After</CardTitle>
          <CardDescription>
            Comparison of old ad-hoc formatting vs new centralized utilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">❌ Before (Ad-hoc)</h4>
                <div className="text-sm space-y-1">
                  <div><code>new Date(story.created_at).toLocaleDateString()</code></div>
                  <div><code>birthday.toLocaleDateString('en-US')</code></div>
                  <div><code>formatDistanceToNow(comment.created_at)</code></div>
                </div>
                <div className="text-xs text-red-600 mt-2">
                  • Hardcoded locales<br/>
                  • Timezone inconsistencies<br/>
                  • Scattered throughout codebase
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-800 mb-2">✅ After (Centralized)</h4>
                <div className="text-sm space-y-1">
                  <div><code>formatForUser(story.created_at, 'datetime', user)</code></div>
                  <div><code>formatForUser(birthday, 'dateOnly', user)</code></div>
                  <div><code>formatForUser(comment.created_at, 'relative', user)</code></div>
                </div>
                <div className="text-xs text-green-600 mt-2">
                  • User's locale/timezone<br/>
                  • Consistent behavior<br/>  
                  • Single source of truth
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-sm">
            <strong>Current Region Settings:</strong><br/>
            Locale: <code>{selectedRegion.locale}</code><br/>
            Timezone: <code>{selectedRegion.timezone}</code><br/>
            {selectedRegion.dateFormatPreference && (
              <>Custom Format: <code>{selectedRegion.dateFormatPreference}</code><br/></>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Migration Demo */}
      <DateMigrationDemo />
    </div>
  )
}