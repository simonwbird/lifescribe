import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface RegionInferenceData {
  locale?: string
  timezone?: string  
  country?: string
  source: 'browser' | 'ip' | 'default'
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'GET') {
      // Dry run - get counts by inference source
      const { data: profiles, error } = await supabaseClient
        .from('profiles')
        .select('id, locale, timezone, country, region_inferred_source, region_confirmed_at')
        .or('locale.is.null,timezone.is.null,country.is.null,region_inferred_source.is.null')

      if (error) throw error

      const counts = {
        total: profiles.length,
        needsInference: profiles.filter(p => !p.region_inferred_source).length,
        alreadyInferred: profiles.filter(p => p.region_inferred_source).length,
        confirmed: profiles.filter(p => p.region_confirmed_at).length,
        pendingConfirmation: profiles.filter(p => p.region_inferred_source && !p.region_confirmed_at).length
      }

      return new Response(JSON.stringify({
        status: 'dry_run_complete',
        counts
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'POST') {
      const { dryRun = true } = await req.json()

      // Get profiles that need region inference  
      const { data: profiles, error: fetchError } = await supabaseClient
        .from('profiles')
        .select('id, locale, timezone, country, region_inferred_source, created_at')
        .is('region_inferred_source', null)
        .limit(100) // Process in batches

      if (fetchError) throw fetchError

      const updates = []

      for (const profile of profiles) {
        const inference = await inferRegionForUser(profile)
        
        if (!dryRun) {
          // Update the profile with inferred values
          const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({
              locale: inference.locale || profile.locale,
              timezone: inference.timezone || profile.timezone, 
              country: inference.country || profile.country,
              region_inferred_source: inference.source
            })
            .eq('id', profile.id)

          if (updateError) {
            console.error(`Failed to update profile ${profile.id}:`, updateError)
          }
        }

        updates.push({
          profileId: profile.id,
          inference
        })
      }

      return new Response(JSON.stringify({
        status: dryRun ? 'dry_run_complete' : 'backfill_complete',
        processed: updates.length,
        updates: dryRun ? updates : updates.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })

  } catch (error) {
    console.error('Region backfill error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function inferRegionForUser(profile: any): Promise<RegionInferenceData> {
  // Try to infer from various sources
  
  // 1. If user already has some preferences set, use those as hints
  if (profile.locale || profile.timezone || profile.country) {
    return {
      locale: profile.locale || inferLocaleFromTimezone(profile.timezone) || 'en-GB',
      timezone: profile.timezone || inferTimezoneFromCountry(profile.country) || 'Europe/London',
      country: profile.country || inferCountryFromTimezone(profile.timezone) || 'GB',
      source: 'browser'
    }
  }

  // 2. Try to infer from IP geolocation (placeholder - would need actual IP service)
  // const ipInference = await inferFromIP(request.ip)
  // if (ipInference) return { ...ipInference, source: 'ip' }

  // 3. Fallback to safe defaults (UK as requested)
  return {
    locale: 'en-GB',
    timezone: 'Europe/London', 
    country: 'GB',
    source: 'default'
  }
}

function inferLocaleFromTimezone(timezone?: string): string | null {
  if (!timezone) return null
  
  const mapping: Record<string, string> = {
    'America/New_York': 'en-US',
    'America/Chicago': 'en-US',
    'America/Denver': 'en-US', 
    'America/Los_Angeles': 'en-US',
    'America/Toronto': 'en-CA',
    'Europe/London': 'en-GB',
    'Europe/Paris': 'fr-FR',
    'Europe/Berlin': 'de-DE',
    'Australia/Sydney': 'en-AU',
    'Australia/Melbourne': 'en-AU'
  }
  
  return mapping[timezone] || null
}

function inferTimezoneFromCountry(country?: string): string | null {
  if (!country) return null
  
  const mapping: Record<string, string> = {
    'US': 'America/New_York',
    'CA': 'America/Toronto', 
    'GB': 'Europe/London',
    'FR': 'Europe/Paris',
    'DE': 'Europe/Berlin',
    'AU': 'Australia/Sydney'
  }
  
  return mapping[country] || null
}

function inferCountryFromTimezone(timezone?: string): string | null {
  if (!timezone) return null
  
  if (timezone.startsWith('America/')) {
    if (timezone.includes('Toronto') || timezone.includes('Montreal')) return 'CA'
    return 'US'
  }
  if (timezone.startsWith('Europe/')) {
    if (timezone.includes('London')) return 'GB'
    if (timezone.includes('Paris')) return 'FR' 
    if (timezone.includes('Berlin')) return 'DE'
  }
  if (timezone.startsWith('Australia/')) return 'AU'
  
  return null
}