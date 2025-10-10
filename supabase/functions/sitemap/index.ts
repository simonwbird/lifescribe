import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all public indexable person pages
    const { data: pages, error } = await supabase
      .from('public_person_pages')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false })

    if (error) throw error

    // Generate sitemap XML
    const baseUrl = req.headers.get('origin') || supabaseUrl.replace('https://', 'https://www.')
    
    const urls = pages.map(page => {
      const lastmod = new Date(page.updated_at).toISOString().split('T')[0]
      return `
  <url>
    <loc>${baseUrl}/p/${page.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
    }).join('')

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${urls}
</urlset>`

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=60, s-maxage=60'
      }
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
