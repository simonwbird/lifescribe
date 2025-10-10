import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Beaker, Database, Trash2, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export default function AdminLabs() {
  const { toast } = useToast()
  const [isSeeding, setIsSeeding] = useState(false)
  const [isPurging, setIsPurging] = useState(false)
  const [lastSeedResult, setLastSeedResult] = useState<any>(null)
  const [currentStatus, setCurrentStatus] = useState<any>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)

  const fetchCurrentStatus = async () => {
    setIsLoadingStatus(true)
    try {
      // Get qa-tester profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'qa-tester@lifescribe.family')
        .single()

      if (!profile) {
        setCurrentStatus(null)
        return
      }

      // Get their family
      const { data: member } = await supabase
        .from('members')
        .select('family_id')
        .eq('profile_id', profile.id)
        .single()

      if (!member) {
        setCurrentStatus(null)
        return
      }

      // Count entities
      const [people, stories, recipes, properties, tributes, prompts, digestSettings, followPrefs] = await Promise.all([
        supabase.from('people').select('id', { count: 'exact', head: true }).eq('family_id', member.family_id),
        supabase.from('stories').select('id', { count: 'exact', head: true }).eq('family_id', member.family_id),
        supabase.from('recipes').select('id', { count: 'exact', head: true }).eq('family_id', member.family_id),
        supabase.from('properties').select('id', { count: 'exact', head: true }).eq('family_id', member.family_id),
        supabase.from('tributes').select('id', { count: 'exact', head: true }).eq('family_id', member.family_id),
        supabase.from('prompt_instances').select('id', { count: 'exact', head: true }).eq('family_id', member.family_id),
        supabase.from('weekly_digest_settings').select('id', { count: 'exact', head: true }).eq('family_id', member.family_id),
        supabase.from('digest_follow_preferences').select('id', { count: 'exact', head: true }).eq('family_id', member.family_id),
      ])

      setCurrentStatus({
        people: people.count || 0,
        stories: stories.count || 0,
        recipes: recipes.count || 0,
        properties: properties.count || 0,
        tributes: tributes.count || 0,
        prompts: prompts.count || 0,
        digest_settings: digestSettings.count || 0,
        follow_prefs: followPrefs.count || 0,
        total: (people.count || 0) + (stories.count || 0) + (recipes.count || 0) + 
               (properties.count || 0) + (tributes.count || 0) + (prompts.count || 0) +
               (digestSettings.count || 0) + (followPrefs.count || 0)
      })
    } catch (error: any) {
      console.error('Status fetch error:', error)
    } finally {
      setIsLoadingStatus(false)
    }
  }

  useEffect(() => {
    fetchCurrentStatus()
  }, [])

  const handleSeedData = async () => {
    setIsSeeding(true)
    setLastSeedResult(null)

    try {
      const { data, error } = await supabase.functions.invoke('seed-qa-data', {
        body: { action: 'seed' }
      })

      if (error) throw error

      setLastSeedResult(data)
      toast({
        title: 'QA Data Seeded Successfully',
        description: `Created ${data.summary.total_created} entities for qa-tester account`,
      })
      
      // Refresh status after seeding
      fetchCurrentStatus()
    } catch (error: any) {
      console.error('Seed error:', error)
      toast({
        title: 'Seed Failed',
        description: error.message || 'Failed to seed QA data',
        variant: 'destructive',
      })
    } finally {
      setIsSeeding(false)
    }
  }

  const handlePurgeData = async () => {
    if (!confirm('Are you sure you want to purge all seeded QA data? This cannot be undone.')) {
      return
    }

    setIsPurging(true)
    setLastSeedResult(null)

    try {
      const { data, error } = await supabase.functions.invoke('seed-qa-data', {
        body: { action: 'purge' }
      })

      if (error) throw error

      setLastSeedResult(data)
      toast({
        title: 'QA Data Purged Successfully',
        description: `Deleted ${data.summary.total_deleted} seeded entities`,
      })
      
      // Refresh status after purging
      fetchCurrentStatus()
    } catch (error: any) {
      console.error('Purge error:', error)
      toast({
        title: 'Purge Failed',
        description: error.message || 'Failed to purge QA data',
        variant: 'destructive',
      })
    } finally {
      setIsPurging(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Beaker className="h-8 w-8" />
          Admin Labs
        </h1>
        <p className="text-muted-foreground">
          Admin-only tools for testing and QA
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          These tools are for admin use only. They modify the qa-tester@lifescribe.family account.
        </AlertDescription>
      </Alert>

      {/* QA Data Seeder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            QA Data Seeder
            <Badge variant="secondary">Admin Only</Badge>
          </CardTitle>
          <CardDescription>
            Seed realistic demo data for the qa-tester account to test Simple Mode workflows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">What gets seeded:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
              <li>5 family members (Lucy, Jamie, Grandpa Joe, Aunt Sarah, Uncle Mike)</li>
              <li>8 stories (various types: text, photo, audio, video)</li>
              <li>3 recipes (Grandma's Apple Pie, Sunday Roast, Summer BBQ)</li>
              <li>2 heirlooms (Wedding Ring, Grandfather Clock)</li>
              <li>1 property (Family Cottage)</li>
              <li>1 event with invites (Family Reunion)</li>
              <li>1 tribute for Grandpa Joe</li>
              <li>Prompt instances (general + person-specific)</li>
              <li>Weekly digest enabled with follow preferences</li>
            </ul>
          </div>

          {/* Current Status */}
          {isLoadingStatus ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading current status...</span>
            </div>
          ) : currentStatus ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">Current QA Account Status:</p>
                  <ul className="text-sm space-y-0.5 ml-4 list-disc">
                    <li>People: {currentStatus.people}</li>
                    <li>Stories: {currentStatus.stories}</li>
                    <li>Recipes: {currentStatus.recipes}</li>
                    <li>Properties: {currentStatus.properties}</li>
                    <li>Tributes: {currentStatus.tributes}</li>
                    <li>Prompts: {currentStatus.prompts}</li>
                    <li>Digest settings: {currentStatus.digest_settings}</li>
                    <li>Follow prefs: {currentStatus.follow_prefs}</li>
                    <li className="font-semibold pt-1">Total entities: {currentStatus.total}</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                QA tester account not found. Please ensure qa-tester@lifescribe.family exists.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleSeedData} 
              disabled={isSeeding || isPurging}
              className="gap-2"
            >
              {isSeeding && <Loader2 className="h-4 w-4 animate-spin" />}
              <Database className="h-4 w-4" />
              Seed QA Data
            </Button>

            <Button 
              onClick={handlePurgeData} 
              disabled={isSeeding || isPurging}
              variant="destructive"
              className="gap-2"
            >
              {isPurging && <Loader2 className="h-4 w-4 animate-spin" />}
              <Trash2 className="h-4 w-4" />
              Purge QA Data
            </Button>
          </div>

          {lastSeedResult && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-semibold">Last operation results:</p>
                  <ul className="text-sm space-y-0.5 ml-4 list-disc">
                    <li>People: {lastSeedResult.summary.people || 0}</li>
                    <li>Stories: {lastSeedResult.summary.stories || 0}</li>
                    <li>Recipes: {lastSeedResult.summary.recipes || 0}</li>
                    <li>Objects: {lastSeedResult.summary.objects || 0}</li>
                    <li>Properties: {lastSeedResult.summary.properties || 0}</li>
                    <li>Tributes: {lastSeedResult.summary.tributes || 0}</li>
                    <li>Prompts: {lastSeedResult.summary.prompts || 0}</li>
                    <li>Digest settings: {lastSeedResult.summary.digest_settings || 0}</li>
                    <li>Follow prefs: {lastSeedResult.summary.follow_prefs || 0}</li>
                    <li className="font-semibold pt-1">Total: {lastSeedResult.summary.total_created || lastSeedResult.summary.total_deleted || 0}</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
