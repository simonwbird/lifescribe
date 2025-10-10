import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportRequest {
  personId: string
  exportType: 'json' | 'pdf'
  includePrivate?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { personId, exportType, includePrivate = false }: ExportRequest = await req.json()

    // Check user has permission to export
    const { data: personRole } = await supabaseClient
      .from('person_roles')
      .select('role')
      .eq('person_id', personId)
      .eq('profile_id', user.id)
      .is('revoked_at', null)
      .single()

    if (!personRole) {
      return new Response(JSON.stringify({ error: 'No permission to export this person' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if user can include private items (owner/steward only)
    if (includePrivate && !['owner', 'steward'].includes(personRole.role)) {
      return new Response(JSON.stringify({ error: 'Only owners and stewards can export private items' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get person data
    const { data: person, error: personError } = await supabaseClient
      .from('people')
      .select('*')
      .eq('id', personId)
      .single()

    if (personError || !person) {
      return new Response(JSON.stringify({ error: 'Person not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create export job
    const { data: exportJob, error: jobError } = await supabaseClient
      .from('export_jobs')
      .insert({
        person_id: personId,
        family_id: person.family_id,
        created_by: user.id,
        export_type: exportType,
        include_private: includePrivate,
        status: 'processing'
      })
      .select()
      .single()

    if (jobError || !exportJob) {
      console.error('Error creating export job:', jobError)
      return new Response(JSON.stringify({ error: 'Failed to create export job' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get person page blocks
    let blocksQuery = supabaseClient
      .from('person_page_blocks')
      .select('*')
      .eq('person_id', personId)
      .order('position', { ascending: true })

    if (!includePrivate) {
      blocksQuery = blocksQuery.in('visibility', ['public', 'family'])
    }

    const { data: blocks } = await blocksQuery

    // Get related content based on block types
    const storyIds = blocks?.filter(b => b.block_type === 'story').map(b => b.content_id) || []
    const mediaIds = blocks?.filter(b => b.block_type === 'gallery').map(b => b.content_id) || []

    let storiesQuery = supabaseClient
      .from('stories')
      .select('*')
      .in('id', storyIds)

    if (!includePrivate) {
      storiesQuery = storiesQuery.in('visibility', ['public', 'family'])
    }

    const { data: stories } = await storiesQuery

    let mediaQuery = supabaseClient
      .from('media')
      .select('*')
      .in('id', mediaIds)

    if (!includePrivate) {
      mediaQuery = mediaQuery.in('visibility', ['public', 'family'])
    }

    const { data: media } = await mediaQuery

    // Get theme
    const { data: theme } = await supabaseClient
      .from('person_page_themes')
      .select('*')
      .eq('person_id', personId)
      .single()

    const exportData = {
      person,
      blocks: blocks || [],
      stories: stories || [],
      media: media || [],
      theme,
      exported_at: new Date().toISOString(),
      export_type: exportType,
      included_private: includePrivate
    }

    if (exportType === 'json') {
      const jsonContent = JSON.stringify(exportData, null, 2)
      const filename = `${person.given_name}_${person.surname}_export_${Date.now()}.json`

      // Update job as completed
      await supabaseClient
        .from('export_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          file_size_bytes: new Blob([jsonContent]).size,
          metadata: { filename, items_count: blocks?.length || 0 }
        })
        .eq('id', exportJob.id)

      return new Response(jsonContent, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        },
      })
    } else if (exportType === 'pdf') {
      // Generate HTML for PDF
      const html = generatePDFHTML(exportData)
      const filename = `${person.given_name}_${person.surname}_minibook_${Date.now()}.html`

      // Update job as completed
      await supabaseClient
        .from('export_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          file_size_bytes: new Blob([html]).size,
          metadata: { 
            filename, 
            items_count: blocks?.length || 0,
            note: 'HTML generated for client-side PDF conversion'
          }
        })
        .eq('id', exportJob.id)

      return new Response(JSON.stringify({ 
        html, 
        exportData,
        jobId: exportJob.id 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error) {
    console.error('Export error:', error)
    return new Response(JSON.stringify({ error: 'Export failed', details: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function generatePDFHTML(data: any): string {
  const { person, blocks, stories, media } = data
  
  // Get hero image
  const heroBlock = blocks.find((b: any) => b.block_type === 'hero')
  const heroMedia = media.find((m: any) => m.id === heroBlock?.content_id)
  
  // Get timeline items (limit to top 10)
  const timelineBlocks = blocks
    .filter((b: any) => b.block_type === 'timeline')
    .slice(0, 10)
  
  // Get gallery images (limit to 20)
  const galleryMedia = media.slice(0, 20)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${person.given_name} ${person.surname} - Mini Book</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Georgia', serif;
      line-height: 1.6;
      color: #333;
      background: white;
    }
    .cover {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 40px;
    }
    .cover-image {
      width: 200px;
      height: 200px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 30px;
      border: 4px solid #ddd;
    }
    .cover h1 {
      font-size: 48px;
      margin-bottom: 10px;
      color: #2c3e50;
    }
    .cover .dates {
      font-size: 20px;
      color: #7f8c8d;
      margin-bottom: 20px;
    }
    .section {
      page-break-inside: avoid;
      margin-bottom: 40px;
      padding: 20px 0;
    }
    .section-title {
      font-size: 28px;
      margin-bottom: 20px;
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }
    .timeline-item {
      margin-bottom: 30px;
      padding-left: 20px;
      border-left: 3px solid #3498db;
    }
    .timeline-date {
      font-weight: bold;
      color: #3498db;
      margin-bottom: 5px;
    }
    .timeline-content {
      color: #555;
    }
    .gallery {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-top: 20px;
    }
    .gallery img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      border-radius: 8px;
    }
    .story {
      margin-bottom: 25px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .story-title {
      font-size: 20px;
      margin-bottom: 10px;
      color: #2c3e50;
    }
    .story-content {
      color: #555;
      line-height: 1.8;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #7f8c8d;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover">
    ${heroMedia?.url ? `<img src="${heroMedia.url}" alt="${person.given_name}" class="cover-image">` : ''}
    <h1>${person.given_name} ${person.surname || ''}</h1>
    ${person.birth_date ? `
      <div class="dates">
        ${new Date(person.birth_date).getFullYear()}${person.death_date ? ` - ${new Date(person.death_date).getFullYear()}` : ''}
      </div>
    ` : ''}
  </div>

  <!-- Timeline Section -->
  ${timelineBlocks.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Life Timeline</h2>
    ${timelineBlocks.map((block: any) => {
      const story = stories.find((s: any) => s.id === block.content_id)
      return story ? `
        <div class="timeline-item">
          <div class="timeline-date">${story.occurred_on ? new Date(story.occurred_on).toLocaleDateString() : 'Date Unknown'}</div>
          <div class="timeline-content">
            <strong>${story.title || 'Untitled'}</strong>
            ${story.body ? `<p>${story.body.substring(0, 200)}${story.body.length > 200 ? '...' : ''}</p>` : ''}
          </div>
        </div>
      ` : ''
    }).join('')}
  </div>
  ` : ''}

  <!-- Gallery Section -->
  ${galleryMedia.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Photo Gallery</h2>
    <div class="gallery">
      ${galleryMedia.map((m: any) => `
        <img src="${m.url}" alt="${m.caption || 'Photo'}" loading="lazy">
      `).join('')}
    </div>
  </div>
  ` : ''}

  <!-- Footer -->
  <div class="footer">
    Generated on ${new Date().toLocaleDateString()} | Family Archive
  </div>
</body>
</html>
  `
}
