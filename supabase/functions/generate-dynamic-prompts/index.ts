import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BirthdayPromptData {
  personId: string
  personName: string
  familyId: string
  birthDate: string
  thisYearBirthday: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting dynamic prompts generation...')

    const today = new Date()
    const windowStart = new Date(today)
    const windowEnd = new Date(today)
    windowEnd.setDate(windowEnd.getDate() + 14) // 14-day window

    console.log(`Birthday window: ${windowStart.toISOString()} to ${windowEnd.toISOString()}`)

    // Get people with birthdays in the next 14 days
    const { data: people, error: peopleError } = await supabaseClient
      .from('people')
      .select(`
        id,
        full_name,
        family_id,
        birth_date,
        birth_year
      `)
      .not('birth_date', 'is', null)

    if (peopleError) {
      console.error('Error fetching people:', peopleError)
      throw peopleError
    }

    console.log(`Found ${people?.length || 0} people with birth dates`)

    const birthdayPrompts: BirthdayPromptData[] = []

    for (const person of people || []) {
      if (!person.birth_date) continue

      const birthDate = new Date(person.birth_date)
      
      // Calculate this year's birthday
      const thisYear = today.getFullYear()
      const thisYearBirthday = new Date(thisYear, birthDate.getMonth(), birthDate.getDate())
      
      // If birthday already passed this year, calculate next year's
      let targetBirthday = thisYearBirthday
      if (thisYearBirthday < today) {
        targetBirthday = new Date(thisYear + 1, birthDate.getMonth(), birthDate.getDate())
      }

      // Check if birthday is within our 14-day window
      if (targetBirthday >= windowStart && targetBirthday <= windowEnd) {
        birthdayPrompts.push({
          personId: person.id,
          personName: person.full_name,
          familyId: person.family_id,
          birthDate: person.birth_date,
          thisYearBirthday: targetBirthday.toISOString()
        })
      }
    }

    console.log(`Found ${birthdayPrompts.length} people with upcoming birthdays`)

    // Get birthday prompts template
    const { data: birthdayPromptTemplates, error: templatesError } = await supabaseClient
      .from('prompts')
      .select('*')
      .eq('scope', 'general')
      .like('slug', '%birthday%')
      .eq('enabled', true)

    if (templatesError) {
      console.error('Error fetching birthday prompt templates:', templatesError)
      throw templatesError
    }

    if (!birthdayPromptTemplates || birthdayPromptTemplates.length === 0) {
      console.log('No birthday prompt templates found, creating default one...')
      
      // Create a default birthday prompt template
      const { data: newTemplate, error: createError } = await supabaseClient
        .from('prompts')
        .insert({
          slug: 'birthday-celebration',
          title: 'Birthday Celebration for {name}',
          body: 'Tell us about a favorite memory or what makes {name} special as we celebrate their birthday!',
          category: 'Birthdays',
          scope: 'general',
          enabled: true,
          tags: ['birthday', 'celebration', 'memories'],
          version: 1
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating birthday prompt template:', createError)
        throw createError
      }

      birthdayPromptTemplates.push(newTemplate)
    }

    const birthdayTemplate = birthdayPromptTemplates[0]
    let createdCount = 0

    // Create birthday prompt instances
    for (const birthday of birthdayPrompts) {
      const currentYear = new Date(birthday.thisYearBirthday).getFullYear()
      const dynamicKey = `birthday:${birthday.personId}:${currentYear}`
      
      const dueAt = new Date(birthday.thisYearBirthday)
      const expiresAt = new Date(dueAt)
      expiresAt.setDate(expiresAt.getDate() + 1) // Expires 1 day after birthday

      // Check if instance already exists
      const { data: existingInstance } = await supabaseClient
        .from('prompt_instances')
        .select('id')
        .eq('dynamic_key', dynamicKey)
        .single()

      if (!existingInstance) {
        // Create new birthday prompt instance
        const { error: insertError } = await supabaseClient
          .from('prompt_instances')
          .insert({
            prompt_id: birthdayTemplate.id,
            family_id: birthday.familyId,
            person_ids: [birthday.personId],
            status: 'open',
            source: 'birthday',
            dynamic_key: dynamicKey,
            due_at: dueAt.toISOString(),
            expires_at: expiresAt.toISOString()
          })

        if (insertError) {
          console.error(`Error creating birthday instance for ${birthday.personName}:`, insertError)
        } else {
          createdCount++
          console.log(`Created birthday prompt for ${birthday.personName} (due: ${dueAt.toDateString()})`)
        }
      } else {
        console.log(`Birthday prompt already exists for ${birthday.personName} (${currentYear})`)
      }
    }

    // Clean up expired birthday prompts
    const { error: cleanupError } = await supabaseClient
      .from('prompt_instances')
      .delete()
      .eq('source', 'birthday')
      .lt('expires_at', today.toISOString())

    if (cleanupError) {
      console.error('Error cleaning up expired birthday prompts:', cleanupError)
    } else {
      console.log('Cleaned up expired birthday prompts')
    }

    const result = {
      success: true,
      birthdayPromptsCreated: createdCount,
      totalUpcomingBirthdays: birthdayPrompts.length,
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString()
    }

    console.log('Dynamic prompts generation completed:', result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Error in generate-dynamic-prompts:', error)
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})