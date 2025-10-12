import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Trash2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface MigrationButtonProps {
  personId: string
  familyId: string
}

export function MigrationButton({ personId, familyId }: MigrationButtonProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<any>(null)
  const { toast } = useToast()

  const runMigration = async (dryRun: boolean) => {
    setIsRunning(true)
    setResults(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      const functionUrl = 'https://imgtnixyralpdrmedwzi.supabase.co/functions/v1/migrate-remove-duplicate-blocks'
      
      const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            personId,
            familyId,
            dryRun
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Migration failed: ${response.statusText}`)
      }

      const data = await response.json()
      setResults(data)

      if (data.success) {
        toast({
          title: dryRun ? 'Dry Run Complete' : 'Migration Complete',
          description: `Found ${data.summary.totalDuplicatesFound} duplicates. ${
            dryRun ? 'No changes made.' : `Hidden ${data.summary.totalBlocksHidden} blocks.`
          }`
        })
      } else {
        throw new Error(data.error || 'Migration failed')
      }
    } catch (error) {
      console.error('Migration error:', error)
      toast({
        title: 'Migration Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive'
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => runMigration(true)}
          disabled={isRunning}
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Preview Cleanup
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              disabled={isRunning || !results}
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remove Duplicates
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Duplicate Blocks?</AlertDialogTitle>
              <AlertDialogDescription>
                This will hide duplicate blocks from this page. Earlier created blocks
                will be kept, and later duplicates will be hidden. This action can be
                undone by manually re-enabling blocks in the database.
                {results && (
                  <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                    <p className="font-semibold mb-2">Preview Results:</p>
                    <ul className="space-y-1">
                      <li>Duplicates found: {results.summary.totalDuplicatesFound}</li>
                      <li>Blocks to hide: {results.summary.totalBlocksHidden}</li>
                      <li>Layouts to update: {results.summary.layoutsUpdated}</li>
                    </ul>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => runMigration(false)}>
                Remove Duplicates
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {results && (
        <div className="mt-4 p-4 bg-muted rounded-lg text-sm space-y-2">
          <h4 className="font-semibold">Migration Results</h4>
          <div className="space-y-1">
            <p>Mode: {results.dryRun ? 'Dry Run (Preview)' : 'Live Migration'}</p>
            <p>Persons scanned: {results.summary.personsScanned}</p>
            <p>Duplicates found: {results.summary.totalDuplicatesFound}</p>
            <p>Blocks hidden: {results.summary.totalBlocksHidden}</p>
            <p>Layouts updated: {results.summary.layoutsUpdated}</p>
            {results.summary.errors > 0 && (
              <p className="text-destructive">Errors: {results.summary.errors}</p>
            )}
          </div>
          
          {results.results.duplicatesFound.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer font-semibold">
                View Details ({results.results.duplicatesFound.length} issues)
              </summary>
              <ul className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {results.results.duplicatesFound.map((dup: any, idx: number) => (
                  <li key={idx} className="text-xs bg-background p-2 rounded">
                    <p className="font-mono">Type: {dup.blockType}</p>
                    <p>Duplicates: {dup.totalDuplicates || dup.totalInstances}</p>
                    {dup.reason && <p className="text-muted-foreground">{dup.reason}</p>}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
