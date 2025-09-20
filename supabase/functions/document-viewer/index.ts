import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocumentRequest {
  filePath: string
  familyId: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let filePath: string
    let familyId: string
    let token: string | null = null

    // Handle both GET (with query params) and POST (with body) requests
    if (req.method === 'GET') {
      const url = new URL(req.url)
      filePath = url.searchParams.get('filePath') ?? ''
      familyId = url.searchParams.get('familyId') ?? ''
      const tokenParam = url.searchParams.get('token')
      
      // Get token from auth header or query param
      const authHeader = req.headers.get('Authorization')
      token = authHeader?.replace('Bearer ', '') || tokenParam
    } else if (req.method === 'POST') {
      const body = await req.json()
      filePath = body.filePath
      familyId = body.familyId
      
      // Get token from auth header
      const authHeader = req.headers.get('Authorization')
      token = authHeader?.replace('Bearer ', '')
    } else {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      })
    }

    if (!filePath || !familyId) {
      return new Response('Missing filePath or familyId parameters', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    if (!token) {
      console.log('No token found in header or body')
      return new Response('Missing authentication', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    console.log('Authenticating with token:', token.substring(0, 20) + '...')

    // Verify the user's JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(JSON.stringify({ 
        error: 'Unauthorized', 
        details: authError?.message 
      }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('User authenticated:', user.id)

    // Verify user has access to this family
    const { data: membership, error: memberError } = await supabase
      .from('members')
      .select('role')
      .eq('family_id', familyId)
      .eq('profile_id', user.id)
      .single()

    if (memberError || !membership) {
      console.error('Membership error:', memberError)
      return new Response('Access denied to family content', { 
        status: 403, 
        headers: corsHeaders 
      })
    }

    // Get the file data directly from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('media')
      .download(filePath)

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError)
      return new Response('File not found', { 
        status: 404, 
        headers: corsHeaders 
      })
    }

    // Get file info to determine content type
    const { data: fileInfo, error: infoError } = await supabase
      .from('media')
      .select('mime_type, file_name')
      .eq('file_path', filePath)
      .eq('family_id', familyId)
      .single()

    if (infoError || !fileInfo) {
      console.error('File info error:', infoError)
      return new Response('File info not found', { 
        status: 404, 
        headers: corsHeaders 
      })
    }

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer()

    // Set appropriate headers for file viewing
    const headers = {
      ...corsHeaders,
      'Content-Type': fileInfo.mime_type || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${fileInfo.file_name}"`,
      'Content-Length': arrayBuffer.byteLength.toString(),
      'Cache-Control': 'private, max-age=3600', // 1 hour cache
    }

    return new Response(arrayBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Document viewer error:', error)
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})