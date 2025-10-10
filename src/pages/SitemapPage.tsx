import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'

export default function SitemapPage() {
  useEffect(() => {
    const generateSitemap = async () => {
      try {
        // Call the edge function to generate sitemap
        const { data, error } = await supabase.functions.invoke('sitemap')
        
        if (error) throw error
        
        // Set content type and output XML
        const blob = new Blob([data], { type: 'application/xml' })
        const url = URL.createObjectURL(blob)
        window.location.href = url
      } catch (error) {
        console.error('Error generating sitemap:', error)
      }
    }
    
    generateSitemap()
  }, [])
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground">Generating sitemap...</p>
    </div>
  )
}
