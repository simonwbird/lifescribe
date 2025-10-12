import { useEffect, useState } from 'react'

export default function SitemapPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        
        // Call the edge function directly
        const response = await fetch(`${supabaseUrl}/functions/v1/sitemap`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch sitemap: ${response.statusText}`)
        }
        
        const xmlContent = await response.text()
        
        // Replace the page content with the XML
        document.open()
        document.write(xmlContent)
        document.close()
      } catch (error) {
        console.error('Error fetching sitemap:', error)
        setError(error instanceof Error ? error.message : 'Unknown error')
      }
    }
    
    fetchSitemap()
  }, [])
  
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to generate sitemap</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Generating sitemap...</p>
    </div>
  )
}
