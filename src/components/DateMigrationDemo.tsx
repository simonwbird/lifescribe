/**
 * Component showing before/after migration examples
 * Demonstrates the usage diff for converting existing components
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatForUser, REGION_PRESETS } from '@/utils/date'

export default function DateMigrationDemo() {
  // Sample data representing existing app usage
  const storyData = {
    created_at: '2023-12-25T09:30:00Z',
    occurred_on: '2020-06-12', // Wedding anniversary
    title: 'Our Wedding Day'
  }
  
  const personData = {  
    birth_date: '1985-07-15',
    full_name: 'Sarah Johnson'
  }

  const ukUser = REGION_PRESETS.UK
  const usUser = REGION_PRESETS.US

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Migration Usage Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Story Card Migration */}
          <div>
            <Badge className="mb-3">StoryCard Component</Badge>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded border">
                <h4 className="font-medium text-red-800 mb-2">❌ Before</h4>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`// StoryCard.tsx - Old approach
{new Date(story.created_at).toLocaleDateString()}
{story.occurred_precision === 'year' ? 
  new Date(story.occurred_on).getFullYear() : 
  new Date(story.occurred_on).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long' 
  })
}`}
                </pre>
                <div className="mt-2 text-sm">
                  <div>Created: {new Date(storyData.created_at).toLocaleDateString()}</div>
                  <div>Occurred: {new Date(storyData.occurred_on).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded border">
                <h4 className="font-medium text-green-800 mb-2">✅ After</h4>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`// StoryCard.tsx - New centralized approach
{formatForUser(story.created_at, 'datetime', userRegion)}
{formatForUser(story.occurred_on, 'dateOnly', userRegion)}`}
                </pre>
                <div className="mt-2 text-sm space-y-1">
                  <div>UK Created: {formatForUser(storyData.created_at, 'datetime', ukUser)}</div>
                  <div>US Created: {formatForUser(storyData.created_at, 'datetime', usUser)}</div>
                  <div>UK Occurred: {formatForUser(storyData.occurred_on, 'dateOnly', ukUser)}</div>
                  <div>US Occurred: {formatForUser(storyData.occurred_on, 'dateOnly', usUser)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* People Table Migration */}
          <div>
            <Badge className="mb-3">PeopleTable Component</Badge>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded border">
                <h4 className="font-medium text-red-800 mb-2">❌ Before</h4>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`// PeopleTable.tsx - Hardcoded formatting
const age = calculateAge(person.birth_date, person.death_date, person.is_living !== false)
const daysUntilBirthday = calculateDaysUntilBirthday(person.birth_date)

// Renders: "Age 38" and "July 15 • in 42d"`}
                </pre>
                <div className="mt-2 text-sm">
                  <div>Birthday: July 15, 1985 (hardcoded format)</div>
                </div>
              </div>
              
              <div className="p-4 bg-green-50 rounded border">
                <h4 className="font-medium text-green-800 mb-2">✅ After</h4>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`// PeopleTable.tsx - Locale-aware formatting
{formatForUser(person.birth_date, 'dateOnly', userRegion)}
{formatForUser(person.birth_date, 'relative', userRegion)} // Age

// Automatically adapts to user's locale/timezone`}
                </pre>
                <div className="mt-2 text-sm space-y-1">
                  <div>UK Birthday: {formatForUser(personData.birth_date, 'dateOnly', ukUser)}</div>
                  <div>US Birthday: {formatForUser(personData.birth_date, 'dateOnly', usUser)}</div>
                  <div>UK Age: {formatForUser(personData.birth_date, 'relative', ukUser)}</div>
                  <div>US Age: {formatForUser(personData.birth_date, 'relative', usUser)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Feed Migration */}
          <div>
            <Badge className="mb-3">ActivityFeed Component</Badge>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded border">
                <h4 className="font-medium text-red-800 mb-2">❌ Before</h4>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`// ActivityFeed.tsx - Mixed date libraries
{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}

// Inconsistent with different libraries and no locale awareness`}
                </pre>
              </div>
              
              <div className="p-4 bg-green-50 rounded border">
                <h4 className="font-medium text-green-800 mb-2">✅ After</h4>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`// ActivityFeed.tsx - Consistent relative formatting
{formatForUser(activity.created_at, 'relative', userRegion)}

// Uses native Intl.RelativeTimeFormat with user's locale`}
                </pre>
                <div className="mt-2 text-sm space-y-1">
                  <div>UK: {formatForUser(storyData.created_at, 'relative', ukUser)}</div>
                  <div>US: {formatForUser(storyData.created_at, 'relative', usUser)}</div>
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
      
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">Migration Benefits</h3>
          <ul className="text-sm space-y-1">
            <li>✅ Single source of truth for all date formatting</li>
            <li>✅ Automatic locale and timezone adaptation</li>
            <li>✅ Consistent behavior across all components</li>
            <li>✅ No more hardcoded 'en-US' assumptions</li>
            <li>✅ Birthday dates never shift across timezones</li>
            <li>✅ Easy testing with region presets</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}