/**
 * Script to run region preferences backfill for existing users
 * Usage: npx tsx scripts/region-backfill-runner.ts [--dry-run] [--execute]
 */

const EDGE_FUNCTION_URL = 'https://imgtnixyralpdrmedwzi.supabase.co/functions/v1/region-backfill'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZ3RuaXh5cmFscGRybWVkd3ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0NDUwMDcsImV4cCI6MjA3MzAyMTAwN30.225nrhTEXlH1rwuwTDvjCivC5TWzm0yZV-47l8T099U'

async function runRegionBackfill() {
  const args = process.argv.slice(2)
  const isDryRun = !args.includes('--execute')

  console.log('🌍 Region Preferences Backfill')
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'EXECUTION'}`)
  console.log('─'.repeat(50))

  try {
    // Get current status
    console.log('📊 Checking current status...')
    const statusResponse = await fetch(EDGE_FUNCTION_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY,
        'Content-Type': 'application/json'
      }
    })

    if (!statusResponse.ok) {
      throw new Error(`Status check failed: ${statusResponse.statusText}`)
    }

    const statusData = await statusResponse.json()
    console.log('Current Status:')
    console.log(`  Total profiles: ${statusData.counts.total}`)
    console.log(`  Need inference: ${statusData.counts.needsInference}`)
    console.log(`  Already inferred: ${statusData.counts.alreadyInferred}`) 
    console.log(`  Confirmed by user: ${statusData.counts.confirmed}`)
    console.log(`  Pending confirmation: ${statusData.counts.pendingConfirmation}`)
    console.log('')

    if (statusData.counts.needsInference === 0) {
      console.log('✅ No profiles need region inference. Backfill complete!')
      return
    }

    if (isDryRun) {
      console.log('🧪 DRY RUN - No changes will be made')
      
      const dryRunResponse = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dryRun: true })
      })

      if (!dryRunResponse.ok) {
        throw new Error(`Dry run failed: ${dryRunResponse.statusText}`)
      }

      const dryRunData = await dryRunResponse.json()
      console.log(`Would process ${dryRunData.processed} profiles`)
      
      // Show sample of what would be updated
      if (dryRunData.updates?.length > 0) {
        console.log('\n📋 Sample of inferences:')
        dryRunData.updates.slice(0, 5).forEach((update: any, index: number) => {
          console.log(`  ${index + 1}. Profile ${update.profileId.substring(0, 8)}... → ${update.inference.locale}, ${update.inference.timezone} (${update.inference.source})`)
        })
        
        if (dryRunData.updates.length > 5) {
          console.log(`  ... and ${dryRunData.updates.length - 5} more`)
        }
      }

      console.log('\n🚀 To execute the backfill, run: npx tsx scripts/region-backfill-runner.ts --execute')
      
    } else {
      console.log('🚀 EXECUTING backfill...')
      console.log('This will update user profiles with inferred region settings')
      
      let totalProcessed = 0
      let batchCount = 0
      
      // Process in batches until no more profiles need processing
      while (true) {
        batchCount++
        console.log(`\nProcessing batch ${batchCount}...`)
        
        const response = await fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ANON_KEY}`,
            'apikey': ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ dryRun: false })
        })

        if (!response.ok) {
          throw new Error(`Batch ${batchCount} failed: ${response.statusText}`)
        }

        const batchData = await response.json()
        console.log(`  Processed: ${batchData.processed} profiles`)
        
        totalProcessed += batchData.processed
        
        // If we processed fewer than the batch size, we're done
        if (batchData.processed < 100) {
          break
        }
        
        // Add a small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      console.log(`\n✅ Backfill complete! Processed ${totalProcessed} profiles total`)
      
      // Get final status
      const finalStatusResponse = await fetch(EDGE_FUNCTION_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
        }
      })
      
      if (finalStatusResponse.ok) {
        const finalStatus = await finalStatusResponse.json()
        console.log('\nFinal Status:')
        console.log(`  Need inference: ${finalStatus.counts.needsInference}`)
        console.log(`  Pending confirmation: ${finalStatus.counts.pendingConfirmation}`)
      }
    }

  } catch (error) {
    console.error('❌ Backfill failed:', error)
    process.exit(1)
  }
}

// Run the backfill
runRegionBackfill().catch(console.error)