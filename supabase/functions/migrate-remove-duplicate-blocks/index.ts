import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import { corsHeaders } from '../_shared/cors.ts'

interface BlockDuplicate {
  id: string
  person_id: string
  type: string
  created_at: string
  content_hash: string
}

interface LayoutMap {
  desktop: { main: string[], rail: string[] }
  tablet: { main: string[], rail: string[] }
  mobile: { main: string[], rail: string[] }
}

// Singleton block types
const SINGLETON_BLOCKS = [
  'quick_facts',
  'toc', 
  'visibility_search',
  'media_counters',
  'pinned_highlights',
  'contribute_cta',
  'anniversaries',
  'mini_map',
  'favorites_quirks',
  'causes',
  'share_export'
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { familyId, personId, dryRun = true } = await req.json()

    console.log(`Starting migration${dryRun ? ' (DRY RUN)' : ''} for family: ${familyId || 'all'}, person: ${personId || 'all'}`)

    // Build query for blocks
    let blocksQuery = supabaseClient
      .from('person_page_blocks')
      .select('*')
      .order('created_at', { ascending: true })

    if (familyId) {
      // Join with people to filter by family
      blocksQuery = supabaseClient
        .from('person_page_blocks')
        .select('*, people!inner(family_id)')
        .eq('people.family_id', familyId)
        .order('created_at', { ascending: true })
    }

    if (personId) {
      blocksQuery = blocksQuery.eq('person_id', personId)
    }

    const { data: blocks, error: blocksError } = await blocksQuery

    if (blocksError) throw blocksError

    console.log(`Found ${blocks?.length || 0} total blocks`)

    // Group blocks by person_id and type
    const blocksByPerson = new Map<string, Map<string, BlockDuplicate[]>>()
    
    for (const block of blocks || []) {
      const personId = block.person_id
      if (!blocksByPerson.has(personId)) {
        blocksByPerson.set(personId, new Map())
      }
      
      const personBlocks = blocksByPerson.get(personId)!
      const blockType = block.type
      
      if (!personBlocks.has(blockType)) {
        personBlocks.set(blockType, [])
      }
      
      // Create content hash from content_json
      const contentHash = JSON.stringify(block.content_json)
      
      personBlocks.get(blockType)!.push({
        id: block.id,
        person_id: block.person_id,
        type: block.type,
        created_at: block.created_at,
        content_hash: contentHash
      })
    }

    const results = {
      personsScanned: blocksByPerson.size,
      duplicatesFound: [] as any[],
      blocksHidden: [] as string[],
      layoutsUpdated: [] as string[],
      errors: [] as any[]
    }

    // Process each person
    for (const [personId, personBlocks] of blocksByPerson.entries()) {
      try {
        const blocksToHide: string[] = []
        
        // Check for duplicates in each block type
        for (const [blockType, typeBlocks] of personBlocks.entries()) {
          // Group by content hash
          const contentGroups = new Map<string, BlockDuplicate[]>()
          
          for (const block of typeBlocks) {
            if (!contentGroups.has(block.content_hash)) {
              contentGroups.set(block.content_hash, [])
            }
            contentGroups.get(block.content_hash)!.push(block)
          }
          
          // Find duplicates (groups with > 1 block)
          for (const [contentHash, duplicates] of contentGroups.entries()) {
            if (duplicates.length > 1) {
              // Keep the first (earliest created_at), hide the rest
              const [keep, ...hide] = duplicates
              
              results.duplicatesFound.push({
                personId,
                blockType,
                totalDuplicates: duplicates.length,
                kept: keep.id,
                hidden: hide.map(b => b.id)
              })
              
              blocksToHide.push(...hide.map(b => b.id))
            }
            
            // For singleton blocks, ensure only one exists even if content differs
            if (SINGLETON_BLOCKS.includes(blockType) && typeBlocks.length > 1) {
              const [keep, ...hide] = typeBlocks
              
              results.duplicatesFound.push({
                personId,
                blockType,
                reason: 'singleton_enforcement',
                totalInstances: typeBlocks.length,
                kept: keep.id,
                hidden: hide.map(b => b.id)
              })
              
              blocksToHide.push(...hide.map(b => b.id))
            }
          }
        }
        
        // Hide duplicate blocks
        if (blocksToHide.length > 0 && !dryRun) {
          const { error: hideError } = await supabaseClient
            .from('person_page_blocks')
            .update({ is_enabled: false })
            .in('id', blocksToHide)
          
          if (hideError) {
            results.errors.push({ personId, error: hideError.message })
          } else {
            results.blocksHidden.push(...blocksToHide)
          }
        }
        
        // Update layout_map to remove hidden blocks
        if (blocksToHide.length > 0) {
          const { data: layoutData, error: layoutError } = await supabaseClient
            .from('person_page_layouts')
            .select('layout_map')
            .eq('person_id', personId)
            .maybeSingle()
          
          if (layoutError) {
            results.errors.push({ personId, error: `Layout fetch: ${layoutError.message}` })
            continue
          }
          
          if (layoutData?.layout_map) {
            const layoutMap = layoutData.layout_map as LayoutMap
            const hiddenBlockIds = new Set(blocksToHide)
            
            // Remove hidden blocks from all layout positions
            const cleanLayout = (arr: string[]) => 
              arr.filter(blockId => {
                // Check if this block ID corresponds to a hidden block
                const block = blocks?.find(b => b.id === blockId)
                return block ? !hiddenBlockIds.has(block.id) : true
              })
            
            const updatedLayout: LayoutMap = {
              desktop: {
                main: cleanLayout(layoutMap.desktop?.main || []),
                rail: cleanLayout(layoutMap.desktop?.rail || [])
              },
              tablet: {
                main: cleanLayout(layoutMap.tablet?.main || []),
                rail: cleanLayout(layoutMap.tablet?.rail || [])
              },
              mobile: {
                main: cleanLayout(layoutMap.mobile?.main || []),
                rail: cleanLayout(layoutMap.mobile?.rail || [])
              }
            }
            
            if (!dryRun) {
              const { error: updateError } = await supabaseClient
                .from('person_page_layouts')
                .update({ layout_map: updatedLayout })
                .eq('person_id', personId)
              
              if (updateError) {
                results.errors.push({ personId, error: `Layout update: ${updateError.message}` })
              } else {
                results.layoutsUpdated.push(personId)
              }
            }
          }
        }
      } catch (personError) {
        results.errors.push({ 
          personId, 
          error: personError instanceof Error ? personError.message : String(personError)
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dryRun,
        results,
        summary: {
          personsScanned: results.personsScanned,
          totalDuplicatesFound: results.duplicatesFound.length,
          totalBlocksHidden: results.blocksHidden.length,
          layoutsUpdated: results.layoutsUpdated.length,
          errors: results.errors.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Migration error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

