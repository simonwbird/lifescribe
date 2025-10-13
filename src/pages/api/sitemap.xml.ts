// API endpoint to generate sitemap.xml for public stories
import { supabase } from '@/lib/supabase'

export async function generateSitemap() {
  try {
    // Fetch all public stories
    const { data: stories } = await supabase
      .from('stories')
      .select('id, updated_at, created_at')
      .eq('privacy', 'public')
      .order('updated_at', { ascending: false })
      .limit(1000) // Limit for performance
    
    if (!stories) {
      return ''
    }
    
    const baseUrl = window.location.origin
    
    const storyUrls = stories.map(story => {
      const lastmod = story.updated_at || story.created_at
      return `
  <url>
    <loc>${baseUrl}/stories/${story.id}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`
    }).join('')
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/feed</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>${storyUrls}
</urlset>`
    
    return xml
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return ''
  }
}
