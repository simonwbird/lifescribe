import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PreflightRequest {
  displayName: string
  city?: string
  region?: string
  inviteeEmails?: string[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function hashString(text: string): string {
  // Simple hash function for privacy (in production, use crypto.subtle)
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

function calculateRiskLevel(matches: number, totalChecks: number): 'none' | 'possible' | 'high' {
  const ratio = matches / Math.max(totalChecks, 1)
  if (ratio >= 0.7) return 'high'
  if (ratio >= 0.3) return 'possible'
  return 'none'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { displayName, city, region, inviteeEmails = [] }: PreflightRequest = await req.json()

    if (!displayName?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Display name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create hashed signals for privacy
    const nameSlug = slugify(displayName)
    const hashedSignals: Record<string, string> = {
      name_hash: hashString(nameSlug)
    }

    if (city) {
      hashedSignals.city_hash = hashString(slugify(city))
    }
    if (region) {
      hashedSignals.region_hash = hashString(slugify(region))
    }
    if (inviteeEmails.length > 0) {
      hashedSignals.emails_hash = hashString(
        inviteeEmails
          .map(email => email.toLowerCase().trim())
          .sort()
          .join(',')
      )
    }

    // Check against existing families (using hashed values)
    let matches = 0
    let totalChecks = 0

    // Check name similarity
    const { data: nameMatches } = await supabaseClient
      .from('families_preflight_log')
      .select('hashed_signals')
      .or(`hashed_signals->name_hash.eq.${hashedSignals.name_hash}`)
      .limit(10)

    if (nameMatches) {
      totalChecks++
      if (nameMatches.length > 0) matches++
    }

    // Check location if provided
    if (hashedSignals.city_hash || hashedSignals.region_hash) {
      const locationQuery = []
      if (hashedSignals.city_hash) locationQuery.push(`hashed_signals->city_hash.eq.${hashedSignals.city_hash}`)
      if (hashedSignals.region_hash) locationQuery.push(`hashed_signals->region_hash.eq.${hashedSignals.region_hash}`)
      
      const { data: locationMatches } = await supabaseClient
        .from('families_preflight_log')
        .select('hashed_signals')
        .or(locationQuery.join(','))
        .limit(10)

      if (locationMatches) {
        totalChecks++
        if (locationMatches.length > 0) matches++
      }
    }

    // Check email overlap if provided
    if (hashedSignals.emails_hash) {
      const { data: emailMatches } = await supabaseClient
        .from('families_preflight_log')
        .select('hashed_signals')
        .or(`hashed_signals->emails_hash.eq.${hashedSignals.emails_hash}`)
        .limit(10)

      if (emailMatches) {
        totalChecks++
        if (emailMatches.length > 0) matches++
      }
    }

    const riskLevel = calculateRiskLevel(matches, totalChecks)

    // Log this preflight check
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown'

    await supabaseClient
      .from('families_preflight_log')
      .insert({
        name_slug: nameSlug,
        hashed_signals: hashedSignals,
        risk_level: riskLevel,
        requester_ip: clientIP
      })

    console.log(`Preflight check: name="${nameSlug}", risk="${riskLevel}", matches=${matches}/${totalChecks}`)

    return new Response(
      JSON.stringify({ 
        risk: riskLevel,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in families-preflight function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})