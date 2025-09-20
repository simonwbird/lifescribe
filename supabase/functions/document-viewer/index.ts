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

    // Get file path and family ID from URL query parameters
    const url = new URL(req.url)
    const filePath = url.searchParams.get('filePath')
    const familyId = url.searchParams.get('familyId')
    const tokenParam = url.searchParams.get('token')

    if (!filePath || !familyId) {
      return new Response('Missing filePath or familyId parameters', { 
        status: 400, 
        headers: corsHeaders 
      })
    }

    // Use token from auth header or query param
    const authHeader = req.headers.get('Authorization')
    let token = authHeader?.replace('Bearer ', '')
    if (!token && tokenParam) {
      token = tokenParam
    }

    if (!token) {
      return new Response('Missing authentication', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

    // Verify the user's JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      })
    }

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