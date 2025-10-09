import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const QA_TESTER_EMAIL = 'qa-tester@lifescribe.family'
const SEED_TAG = '__qa_seeded__'

// Demo data fixtures
const PEOPLE_FIXTURES = [
  { full_name: 'Lucy Morrison', birth_date: '1985-03-15', relationship: 'daughter' },
  { full_name: 'Jamie Morrison', birth_date: '1987-07-22', relationship: 'son' },
  { full_name: 'Grandpa Joe', birth_date: '1935-11-10', relationship: 'grandfather', is_deceased: true },
  { full_name: 'Aunt Sarah', birth_date: '1960-05-18', relationship: 'aunt' },
  { full_name: 'Uncle Mike', birth_date: '1958-09-25', relationship: 'uncle' },
]

const STORIES_FIXTURES = [
  {
    title: 'Summer Vacation at the Lake',
    content: 'We spent two weeks at the family lake house. The kids learned to water ski and we had bonfires every night.',
    tags: ['vacation', 'summer', SEED_TAG],
    occurred_on: '2024-07-15',
  },
  {
    title: 'Lucys Graduation Day',
    content: 'So proud of Lucy graduating with honors! The whole family came to celebrate.',
    tags: ['milestone', 'graduation', SEED_TAG],
    occurred_on: '2024-05-20',
  },
  {
    title: 'Thanksgiving Traditions',
    content: 'Our annual Thanksgiving gathering. Grandpa Joe told his famous stories and we all laughed until we cried.',
    tags: ['holiday', 'thanksgiving', SEED_TAG],
    occurred_on: '2023-11-23',
  },
  {
    title: 'First Day of School',
    content: 'Jamie started high school today. Time flies so fast! He was nervous but excited.',
    tags: ['school', 'milestone', SEED_TAG],
    occurred_on: '2024-09-05',
  },
  {
    title: 'Road Trip to Yellowstone',
    content: 'Epic road trip with the kids. We saw Old Faithful, hiked trails, and made memories that will last forever.',
    tags: ['travel', 'adventure', SEED_TAG],
    occurred_on: '2024-08-10',
  },
  {
    title: 'Birthday Celebration',
    content: 'Surprise birthday party for Sarah. She turned 64 and we had the whole family there!',
    tags: ['birthday', 'celebration', SEED_TAG],
    occurred_on: '2024-05-18',
  },
  {
    title: 'Weekend at Grandpas',
    content: 'The kids loved spending the weekend with Grandpa Joe. He taught them how to fish and told war stories.',
    tags: ['family', 'memories', SEED_TAG],
    occurred_on: '2023-06-15',
  },
  {
    title: 'Christmas Morning Magic',
    content: 'The look on the kids faces on Christmas morning never gets old. Hot cocoa, presents, and joy all around.',
    tags: ['christmas', 'holiday', SEED_TAG],
    occurred_on: '2023-12-25',
  },
]

const RECIPES_FIXTURES = [
  {
    title: 'Grandmas Apple Pie',
    description: 'The secret family recipe passed down for generations',
    ingredients: ['6 apples', '1 cup sugar', '2 tsp cinnamon', 'pie crust', 'butter'],
    instructions: 'Peel and slice apples. Mix with sugar and cinnamon. Pour into crust. Bake at 350°F for 45 minutes.',
    prep_time: 30,
    cook_time: 45,
    servings: 8,
    tags: [SEED_TAG],
  },
  {
    title: 'Sunday Roast Dinner',
    description: 'Traditional Sunday family dinner',
    ingredients: ['beef roast', 'potatoes', 'carrots', 'onions', 'gravy'],
    instructions: 'Season roast. Roast at 325°F for 3 hours. Add vegetables in last hour. Make gravy from drippings.',
    prep_time: 20,
    cook_time: 180,
    servings: 6,
    tags: [SEED_TAG],
  },
  {
    title: 'Summer BBQ Ribs',
    description: 'Uncle Mikes famous BBQ ribs recipe',
    ingredients: ['pork ribs', 'BBQ sauce', 'dry rub', 'apple cider vinegar'],
    instructions: 'Apply dry rub. Smoke low and slow for 4 hours. Baste with sauce in last 30 minutes.',
    prep_time: 15,
    cook_time: 240,
    servings: 4,
    tags: [SEED_TAG],
  },
]

const OBJECTS_FIXTURES = [
  {
    title: 'Wedding Ring',
    description: 'Great-grandmothers wedding ring from 1920',
    category: 'jewelry',
    acquisition_date: '1920-06-15',
    current_location: 'Safe deposit box',
    estimated_value: 5000,
    tags: [SEED_TAG],
  },
  {
    title: 'Grandfather Clock',
    description: 'Antique grandfather clock that has been in the family for 100 years',
    category: 'furniture',
    acquisition_date: '1923-01-01',
    current_location: 'Living room',
    estimated_value: 8000,
    tags: [SEED_TAG],
  },
]

const PROPERTIES_FIXTURES = [
  {
    title: 'Family Cottage at Lake Michigan',
    description: 'Summer cottage where the family has vacationed for 50 years',
    property_type: 'vacation_home',
    address: '123 Lakeshore Drive, Holland, MI 49423',
    acquisition_date: '1974-06-01',
    current_value: 450000,
    tags: [SEED_TAG],
  },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action } = await req.json()

    // Get QA tester user
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()
    if (userError) throw userError

    const qaUser = userData.users.find(u => u.email === QA_TESTER_EMAIL)
    if (!qaUser) {
      throw new Error('QA tester account not found')
    }

    // Get family ID for QA tester
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('family_id')
      .eq('profile_id', qaUser.id)
      .single()

    if (memberError) throw memberError
    const familyId = memberData.family_id

    if (action === 'purge') {
      return await purgeQAData(supabase, familyId, qaUser.id)
    } else {
      return await seedQAData(supabase, familyId, qaUser.id)
    }
  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function seedQAData(supabase: any, familyId: string, userId: string) {
  const summary = {
    people: 0,
    stories: 0,
    recipes: 0,
    objects: 0,
    properties: 0,
    events: 0,
    tributes: 0,
    total_created: 0,
  }

  // Seed People (idempotent - upsert)
  for (const person of PEOPLE_FIXTURES) {
    const { data: existing } = await supabase
      .from('people')
      .select('id')
      .eq('family_id', familyId)
      .eq('full_name', person.full_name)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase.from('people').insert({
        ...person,
        family_id: familyId,
        created_by: userId,
      })
      if (!error) summary.people++
    }
  }

  // Get people IDs for linking
  const { data: peopleData } = await supabase
    .from('people')
    .select('id, full_name')
    .eq('family_id', familyId)
    .in('full_name', PEOPLE_FIXTURES.map(p => p.full_name))

  const peopleMap = new Map(peopleData?.map((p: any) => [p.full_name, p.id]) || [])

  // Seed Stories
  for (const story of STORIES_FIXTURES) {
    const { data: existing } = await supabase
      .from('stories')
      .select('id')
      .eq('family_id', familyId)
      .eq('title', story.title)
      .maybeSingle()

    if (!existing) {
      const { data: newStory, error } = await supabase.from('stories').insert({
        ...story,
        family_id: familyId,
        profile_id: userId,
      }).select().single()

      if (!error && newStory) {
        summary.stories++
        
        // Link Lucy to graduation story
        if (story.title.includes('Lucy') && peopleMap.has('Lucy Morrison')) {
          await supabase.from('person_story_links').insert({
            person_id: peopleMap.get('Lucy Morrison'),
            story_id: newStory.id,
            family_id: familyId,
          })
        }
        
        // Link Grandpa Joe to Thanksgiving story
        if (story.title.includes('Thanksgiving') && peopleMap.has('Grandpa Joe')) {
          await supabase.from('person_story_links').insert({
            person_id: peopleMap.get('Grandpa Joe'),
            story_id: newStory.id,
            family_id: familyId,
          })
        }
      }
    }
  }

  // Seed Recipes
  for (const recipe of RECIPES_FIXTURES) {
    const { data: existing } = await supabase
      .from('recipes')
      .select('id')
      .eq('family_id', familyId)
      .eq('title', recipe.title)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase.from('recipes').insert({
        ...recipe,
        family_id: familyId,
        profile_id: userId,
      })
      if (!error) summary.recipes++
    }
  }

  // Seed Objects/Things
  for (const obj of OBJECTS_FIXTURES) {
    const { data: existing } = await supabase
      .from('things')
      .select('id')
      .eq('family_id', familyId)
      .eq('title', obj.title)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase.from('things').insert({
        ...obj,
        family_id: familyId,
        profile_id: userId,
      })
      if (!error) summary.objects++
    }
  }

  // Seed Properties
  for (const property of PROPERTIES_FIXTURES) {
    const { data: existing } = await supabase
      .from('properties')
      .select('id')
      .eq('family_id', familyId)
      .eq('title', property.title)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase.from('properties').insert({
        ...property,
        family_id: familyId,
        profile_id: userId,
      })
      if (!error) summary.properties++
    }
  }

  // Seed Event (Family Reunion)
  const { data: existingEvent } = await supabase
    .from('events')
    .select('id')
    .eq('family_id', familyId)
    .eq('title', 'Annual Family Reunion')
    .maybeSingle()

  if (!existingEvent) {
    const { data: newEvent, error: eventError } = await supabase.from('events').insert({
      family_id: familyId,
      profile_id: userId,
      title: 'Annual Family Reunion',
      description: 'Join us for our annual family reunion at the lake cottage!',
      event_date: '2025-07-15',
      location: 'Family Cottage at Lake Michigan',
      tags: [SEED_TAG],
    }).select().single()

    if (!eventError && newEvent) {
      summary.events++
      
      // Create event invite
      const { data: invite } = await supabase.from('event_join_codes').insert({
        event_id: newEvent.id,
        family_id: familyId,
        created_by: userId,
        join_code: 'REUNION2025',
        qr_data: `https://lifescribe.family/join/REUNION2025`,
        expires_at: '2025-07-20',
      }).select().single()
    }
  }

  // Seed Tribute for Grandpa Joe
  if (peopleMap.has('Grandpa Joe')) {
    const grandpaId = peopleMap.get('Grandpa Joe')
    const { data: existingTribute } = await supabase
      .from('tributes')
      .select('id')
      .eq('family_id', familyId)
      .eq('person_id', grandpaId)
      .maybeSingle()

    if (!existingTribute) {
      const { error } = await supabase.from('tributes').insert({
        family_id: familyId,
        person_id: grandpaId,
        profile_id: userId,
        title: 'In Loving Memory of Grandpa Joe',
        description: 'A celebration of Grandpa Joes life and the wonderful memories he left us.',
        privacy_level: 'family',
        tags: [SEED_TAG],
      })
      if (!error) summary.tributes++
    }
  }

  // Enable Weekly Digest
  await supabase.from('weekly_digest_settings').upsert({
    family_id: familyId,
    is_enabled: true,
    digest_day: 'sunday',
    digest_time: '09:00',
  }, { onConflict: 'family_id' })

  // Set follow preferences for Lucy & Jamie
  if (peopleMap.has('Lucy Morrison') && peopleMap.has('Jamie Morrison')) {
    const lucyId = peopleMap.get('Lucy Morrison')
    const jamieId = peopleMap.get('Jamie Morrison')

    await supabase.from('digest_follow_preferences').upsert([
      {
        user_id: userId,
        family_id: familyId,
        followed_member_id: lucyId,
      },
      {
        user_id: userId,
        family_id: familyId,
        followed_member_id: jamieId,
      },
    ], { onConflict: 'user_id,followed_member_id' })
  }

  summary.total_created = Object.values(summary).reduce((a, b) => typeof b === 'number' ? a + b : a, 0)

  return new Response(
    JSON.stringify({ success: true, summary }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function purgeQAData(supabase: any, familyId: string, userId: string) {
  const summary = {
    people: 0,
    stories: 0,
    recipes: 0,
    objects: 0,
    properties: 0,
    events: 0,
    tributes: 0,
    total_deleted: 0,
  }

  // Delete stories with SEED_TAG
  const { data: stories } = await supabase
    .from('stories')
    .select('id')
    .eq('family_id', familyId)
    .contains('tags', [SEED_TAG])

  if (stories) {
    const { error } = await supabase
      .from('stories')
      .delete()
      .in('id', stories.map((s: any) => s.id))
    if (!error) summary.stories = stories.length
  }

  // Delete recipes with SEED_TAG
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id')
    .eq('family_id', familyId)
    .contains('tags', [SEED_TAG])

  if (recipes) {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .in('id', recipes.map((r: any) => r.id))
    if (!error) summary.recipes = recipes.length
  }

  // Delete objects with SEED_TAG
  const { data: objects } = await supabase
    .from('things')
    .select('id')
    .eq('family_id', familyId)
    .contains('tags', [SEED_TAG])

  if (objects) {
    const { error } = await supabase
      .from('things')
      .delete()
      .in('id', objects.map((o: any) => o.id))
    if (!error) summary.objects = objects.length
  }

  // Delete properties with SEED_TAG
  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .eq('family_id', familyId)
    .contains('tags', [SEED_TAG])

  if (properties) {
    const { error } = await supabase
      .from('properties')
      .delete()
      .in('id', properties.map((p: any) => p.id))
    if (!error) summary.properties = properties.length
  }

  // Delete events with SEED_TAG
  const { data: events } = await supabase
    .from('events')
    .select('id')
    .eq('family_id', familyId)
    .contains('tags', [SEED_TAG])

  if (events) {
    const { error } = await supabase
      .from('events')
      .delete()
      .in('id', events.map((e: any) => e.id))
    if (!error) summary.events = events.length
  }

  // Delete tributes with SEED_TAG
  const { data: tributes } = await supabase
    .from('tributes')
    .select('id')
    .eq('family_id', familyId)
    .contains('tags', [SEED_TAG])

  if (tributes) {
    const { error } = await supabase
      .from('tributes')
      .delete()
      .in('id', tributes.map((t: any) => t.id))
    if (!error) summary.tributes = tributes.length
  }

  // Delete seeded people (be careful - only delete if they have no non-seeded stories)
  const peopleNames = PEOPLE_FIXTURES.map(p => p.full_name)
  const { data: peopleToDelete } = await supabase
    .from('people')
    .select('id, full_name')
    .eq('family_id', familyId)
    .in('full_name', peopleNames)

  if (peopleToDelete) {
    for (const person of peopleToDelete) {
      // Check if person has any non-seeded stories
      const { data: links } = await supabase
        .from('person_story_links')
        .select('story_id')
        .eq('person_id', person.id)

      const hasNonSeededStories = links && links.length > 0

      if (!hasNonSeededStories) {
        await supabase.from('people').delete().eq('id', person.id)
        summary.people++
      }
    }
  }

  summary.total_deleted = Object.values(summary).reduce((a, b) => typeof b === 'number' ? a + b : a, 0)

  return new Response(
    JSON.stringify({ success: true, summary }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
