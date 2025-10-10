import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const QA_TESTER_EMAIL = 'qa-tester@lifescribe.family'
const QA_SEED_VERSION = 'v1'
const SEED_TAG = '__qa_seeded__'

// Demo data fixtures with stable slugs and QA seed markers
const PEOPLE_FIXTURES = [
  { 
    slug: 'lucy-morrison',
    full_name: 'Lucy Morrison', 
    birth_date: '1985-03-15', 
    relationship: 'daughter',
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
  },
  { 
    slug: 'jamie-morrison',
    full_name: 'Jamie Morrison', 
    birth_date: '1987-07-22', 
    relationship: 'son',
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
  },
  { 
    slug: 'grandpa-joe',
    full_name: 'Grandpa Joe', 
    birth_date: '1935-11-10', 
    relationship: 'grandfather', 
    is_deceased: true,
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
  },
  { 
    slug: 'aunt-sarah',
    full_name: 'Aunt Sarah', 
    birth_date: '1960-05-18', 
    relationship: 'aunt',
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
  },
  { 
    slug: 'uncle-mike',
    full_name: 'Uncle Mike', 
    birth_date: '1958-09-25', 
    relationship: 'uncle',
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
  },
]

const STORIES_FIXTURES = [
  {
    title: 'Summer Vacation at the Lake',
    content: 'We spent two weeks at the family lake house. The kids learned to water ski and we had bonfires every night.',
    tags: ['vacation', 'summer', SEED_TAG],
    occurred_on: '2024-07-15',
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
  },
  {
    title: 'Lucys Graduation Day',
    content: 'So proud of Lucy graduating with honors! The whole family came to celebrate.',
    tags: ['milestone', 'graduation', SEED_TAG],
    occurred_on: '2024-05-20',
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
  },
  {
    title: 'Thanksgiving Traditions',
    content: 'Our annual Thanksgiving gathering. Grandpa Joe told his famous stories and we all laughed until we cried.',
    tags: ['holiday', 'thanksgiving', SEED_TAG],
    occurred_on: '2023-11-23',
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
  },
  {
    title: 'First Day of School',
    content: 'Jamie started high school today. Time flies so fast! He was nervous but excited.',
    tags: ['school', 'milestone', SEED_TAG],
    occurred_on: '2024-09-05',
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
  },
  {
    title: 'Road Trip to Yellowstone',
    content: 'Epic road trip with the kids. We saw Old Faithful, hiked trails, and made memories that will last forever.',
    tags: ['travel', 'adventure', SEED_TAG],
    occurred_on: '2024-08-10',
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
  },
  {
    title: 'Birthday Celebration',
    content: 'Surprise birthday party for Sarah. She turned 64 and we had the whole family there!',
    tags: ['birthday', 'celebration', SEED_TAG],
    occurred_on: '2024-05-18',
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
  },
  {
    title: 'Weekend at Grandpas',
    content: 'The kids loved spending the weekend with Grandpa Joe. He taught them how to fish and told war stories.',
    tags: ['family', 'memories', SEED_TAG],
    occurred_on: '2023-06-15',
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
  },
  {
    title: 'Christmas Morning Magic',
    content: 'The look on the kids faces on Christmas morning never gets old. Hot cocoa, presents, and joy all around.',
    tags: ['christmas', 'holiday', SEED_TAG],
    occurred_on: '2023-12-25',
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
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
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
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
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
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
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
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
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
  },
  {
    title: 'Grandfather Clock',
    description: 'Antique grandfather clock that has been in the family for 100 years',
    category: 'furniture',
    acquisition_date: '1923-01-01',
    current_location: 'Living room',
    estimated_value: 8000,
    tags: [SEED_TAG],
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
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
    qa_seed: true,
    qa_seed_version: QA_SEED_VERSION
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

    // Get family ID for QA tester (use their default space)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('default_space_id')
      .eq('id', qaUser.id)
      .single()

    if (profileError) throw profileError
    if (!profileData?.default_space_id) {
      throw new Error('QA tester has no default family set')
    }
    const familyId = profileData.default_space_id

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
    digest_settings: 0,
    follow_prefs: 0,
    total_created: 0,
  }

  // Seed People (idempotent - upsert by slug)
  for (const person of PEOPLE_FIXTURES) {
    const { data: existing } = await supabase
      .from('people')
      .select('id')
      .eq('family_id', familyId)
      .eq('slug', person.slug)
      .limit(1)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase.from('people').insert({
        ...person,
        family_id: familyId,
        created_by: userId,
      })
      if (error) {
        console.error(`Failed to insert person ${person.full_name}:`, error)
      } else {
        summary.people++
      }
    }
  }

  // Get people IDs for linking (by slug)
  const { data: peopleData } = await supabase
    .from('people')
    .select('id, full_name, slug')
    .eq('family_id', familyId)
    .in('slug', PEOPLE_FIXTURES.map(p => p.slug))

  const peopleMap = new Map(peopleData?.map((p: any) => [p.full_name, p.id]) || [])

  // Seed Stories
  for (const story of STORIES_FIXTURES) {
    const { data: existing } = await supabase
      .from('stories')
      .select('id')
      .eq('family_id', familyId)
      .eq('qa_seed', true)
      .eq('title', story.title)
      .limit(1)
      .maybeSingle()

    if (!existing) {
      const { data: newStory, error } = await supabase.from('stories').insert({
        ...story,
        family_id: familyId,
        profile_id: userId,
      }).select().single()

      if (error) {
        console.error(`Failed to insert story ${story.title}:`, error)
      } else if (newStory) {
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
      .eq('qa_seed', true)
      .eq('title', recipe.title)
      .limit(1)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase.from('recipes').insert({
        ...recipe,
        family_id: familyId,
        profile_id: userId,
      })
      if (error) {
        console.error(`Failed to insert recipe ${recipe.title}:`, error)
      } else {
        summary.recipes++
      }
    }
  }

  // Seed Objects/Things
  for (const obj of OBJECTS_FIXTURES) {
    const { data: existing } = await supabase
      .from('things')
      .select('id')
      .eq('family_id', familyId)
      .eq('qa_seed', true)
      .eq('title', obj.title)
      .limit(1)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase.from('things').insert({
        ...obj,
        family_id: familyId,
        profile_id: userId,
      })
      if (error) {
        console.error(`Failed to insert thing ${obj.title}:`, error)
      } else {
        summary.objects++
      }
    }
  }

  // Seed Properties
  for (const property of PROPERTIES_FIXTURES) {
    const { data: existing } = await supabase
      .from('properties')
      .select('id')
      .eq('family_id', familyId)
      .eq('qa_seed', true)
      .eq('title', property.title)
      .limit(1)
      .maybeSingle()

    if (!existing) {
      const { error } = await supabase.from('properties').insert({
        ...property,
        family_id: familyId,
        profile_id: userId,
      })
      if (error) {
        console.error(`Failed to insert property ${property.title}:`, error)
      } else {
        summary.properties++
      }
    }
  }

  // Enable Weekly Digest
  const { data: existingDigest } = await supabase
    .from('weekly_digest_settings')
    .select('id')
    .eq('family_id', familyId)
    .eq('qa_seed', true)
    .limit(1)
    .maybeSingle()

  if (!existingDigest) {
    const { error } = await supabase.from('weekly_digest_settings').insert({
      family_id: familyId,
      is_enabled: true,
      digest_day: 'sunday',
      digest_time: '09:00',
      qa_seed: true,
      qa_seed_version: QA_SEED_VERSION
    })
    if (error) {
      console.error('Failed to insert digest settings:', error)
    } else {
      summary.digest_settings++
    }
  }

  // Set follow preferences for Lucy & Jamie
  if (peopleMap.has('Lucy Morrison') && peopleMap.has('Jamie Morrison')) {
    const lucyId = peopleMap.get('Lucy Morrison')
    const jamieId = peopleMap.get('Jamie Morrison')

    for (const personId of [lucyId, jamieId]) {
      const { data: existing } = await supabase
        .from('digest_follow_preferences')
        .select('id')
        .eq('user_id', userId)
        .eq('family_id', familyId)
        .eq('followed_member_id', personId)
        .eq('qa_seed', true)
        .limit(1)
        .maybeSingle()

      if (!existing) {
        await supabase.from('digest_follow_preferences').insert({
          user_id: userId,
          family_id: familyId,
          followed_member_id: personId,
          qa_seed: true,
          qa_seed_version: QA_SEED_VERSION
        })
        summary.follow_prefs++
      }
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
      .eq('qa_seed', true)
      .limit(1)
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
        qa_seed: true,
        qa_seed_version: QA_SEED_VERSION
      })
      if (!error) summary.tributes++
    }
  }

  summary.total_created = Object.values(summary).reduce((a, b) => typeof b === 'number' ? a + b : a, 0) - summary.total_created

  // Log the seed operation
  await supabase.from('qa_seed_log').insert({
    ran_by: userId,
    action: 'seed',
    seed_version: QA_SEED_VERSION,
    counts: summary,
    notes: 'QA data seeded successfully'
  })

  console.log('Seed complete:', summary)

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
    digest_settings: 0,
    follow_prefs: 0,
    total_deleted: 0,
  }

  // Delete stories with qa_seed=true
  const { data: stories } = await supabase
    .from('stories')
    .select('id')
    .eq('family_id', familyId)
    .eq('qa_seed', true)

  if (stories && stories.length > 0) {
    const { error } = await supabase
      .from('stories')
      .delete()
      .in('id', stories.map((s: any) => s.id))
    if (!error) summary.stories = stories.length
  }

  // Delete recipes with qa_seed=true
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id')
    .eq('family_id', familyId)
    .eq('qa_seed', true)

  if (recipes && recipes.length > 0) {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .in('id', recipes.map((r: any) => r.id))
    if (!error) summary.recipes = recipes.length
  }

  // Delete objects with qa_seed=true
  const { data: objects } = await supabase
    .from('things')
    .select('id')
    .eq('family_id', familyId)
    .eq('qa_seed', true)

  if (objects && objects.length > 0) {
    const { error } = await supabase
      .from('things')
      .delete()
      .in('id', objects.map((o: any) => o.id))
    if (!error) summary.objects = objects.length
  }

  // Delete properties with qa_seed=true
  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .eq('family_id', familyId)
    .eq('qa_seed', true)

  if (properties && properties.length > 0) {
    const { error } = await supabase
      .from('properties')
      .delete()
      .in('id', properties.map((p: any) => p.id))
    if (!error) summary.properties = properties.length
  }

  // Delete tributes with qa_seed=true
  const { data: tributes } = await supabase
    .from('tributes')
    .select('id')
    .eq('family_id', familyId)
    .eq('qa_seed', true)

  if (tributes && tributes.length > 0) {
    const { error } = await supabase
      .from('tributes')
      .delete()
      .in('id', tributes.map((t: any) => t.id))
    if (!error) summary.tributes = tributes.length
  }

  // Delete digest settings with qa_seed=true
  const { data: digestSettings } = await supabase
    .from('weekly_digest_settings')
    .select('id')
    .eq('family_id', familyId)
    .eq('qa_seed', true)

  if (digestSettings && digestSettings.length > 0) {
    const { error } = await supabase
      .from('weekly_digest_settings')
      .delete()
      .in('id', digestSettings.map((d: any) => d.id))
    if (!error) summary.digest_settings = digestSettings.length
  }

  // Delete follow preferences with qa_seed=true
  const { data: followPrefs } = await supabase
    .from('digest_follow_preferences')
    .select('id')
    .eq('family_id', familyId)
    .eq('qa_seed', true)

  if (followPrefs && followPrefs.length > 0) {
    const { error } = await supabase
      .from('digest_follow_preferences')
      .delete()
      .in('id', followPrefs.map((f: any) => f.id))
    if (!error) summary.follow_prefs = followPrefs.length
  }

  // Delete seeded people (only those with qa_seed=true)
  const { data: peopleToDelete } = await supabase
    .from('people')
    .select('id')
    .eq('family_id', familyId)
    .eq('qa_seed', true)

  if (peopleToDelete && peopleToDelete.length > 0) {
    const { error } = await supabase
      .from('people')
      .delete()
      .in('id', peopleToDelete.map((p: any) => p.id))
    if (!error) summary.people = peopleToDelete.length
  }

  summary.total_deleted = Object.values(summary).reduce((a, b) => typeof b === 'number' ? a + b : a, 0) - summary.total_deleted

  // Log the purge operation
  await supabase.from('qa_seed_log').insert({
    ran_by: userId,
    action: 'purge',
    seed_version: QA_SEED_VERSION,
    counts: summary,
    notes: 'QA data purged successfully'
  })

  console.log('Purge complete:', summary)

  return new Response(
    JSON.stringify({ success: true, summary }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
