import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SetupRequest {
  reset?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { reset = false }: SetupRequest = await req.json().catch(() => ({}));

    console.log('Setting up QA Test Family', { reset });

    // Check if QA user exists
    const { data: qaProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'qa-tester@lifescribe.family')
      .single();

    if (!qaProfile) {
      return new Response(
        JSON.stringify({ 
          error: 'QA test user not found. Please create qa-tester@lifescribe.family account first in Supabase Auth.' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // If reset requested, clean up existing data first
    if (reset) {
      const { data: existingFamily } = await supabase
        .from('families')
        .select('id')
        .eq('name', 'QA Test Family')
        .single();

      if (existingFamily) {
        // Delete in order to respect foreign keys
        await supabase.from('comments').delete().eq('family_id', existingFamily.id);
        await supabase.from('answers').delete().eq('family_id', existingFamily.id);
        await supabase.from('questions').delete().eq('family_id', existingFamily.id);
        await supabase.from('stories').delete().eq('family_id', existingFamily.id);
        await supabase.from('relationships').delete().eq('family_id', existingFamily.id);
        await supabase.from('people').delete().eq('family_id', existingFamily.id);
        await supabase.from('members').delete().eq('family_id', existingFamily.id);
        await supabase.from('families').delete().eq('id', existingFamily.id);
      }
    }

    // Check if QA family already exists
    const { data: existingFamily } = await supabase
      .from('families')
      .select('*')
      .eq('name', 'QA Test Family')
      .single();

    if (existingFamily && !reset) {
      return new Response(
        JSON.stringify({ 
          message: 'QA Test Family already exists',
          family_id: existingFamily.id 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Create the QA Test Family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({
        name: 'QA Test Family',
        description: 'A test family for automated QA testing with realistic data',
        created_by: qaProfile.id,
        status: 'active',
        verified_at: new Date().toISOString()
      })
      .select()
      .single();

    if (familyError) {
      throw new Error(`Failed to create family: ${familyError.message}`);
    }

    // Add QA user as admin member
    await supabase
      .from('members')
      .insert({
        profile_id: qaProfile.id,
        family_id: family.id,
        role: 'admin'
      });

    // Create family tree people
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .insert([
        {
          family_id: family.id,
          full_name: 'Elder Test User',
          given_name: 'Elder',
          surname: 'User',
          birth_date: '1935-03-15',
          birth_year: 1935,
          gender: 'female',
          is_living: true,
          notes: 'Beloved family matriarch with many stories to share',
          created_by: qaProfile.id
        },
        {
          family_id: family.id,
          full_name: 'Parent Test User',
          given_name: 'Parent',
          surname: 'User',
          birth_date: '1965-08-22',
          birth_year: 1965,
          gender: 'male',
          is_living: true,
          notes: 'Family administrator and active story contributor',
          created_by: qaProfile.id
        },
        {
          family_id: family.id,
          full_name: 'Teen Test User',
          given_name: 'Teen',
          surname: 'User',
          birth_date: '2008-12-05',
          birth_year: 2008,
          gender: 'other',
          is_living: true,
          notes: 'Young family member learning about family history',
          created_by: qaProfile.id
        }
      ])
      .select();

    if (peopleError || !people) {
      throw new Error(`Failed to create people: ${peopleError?.message}`);
    }

    const [elder, parent, teen] = people;

    // Create family relationships
    await supabase
      .from('relationships')
      .insert([
        {
          family_id: family.id,
          from_person_id: elder.id,
          to_person_id: parent.id,
          relationship_type: 'parent',
          is_biological: true,
          created_by: qaProfile.id
        },
        {
          family_id: family.id,
          from_person_id: parent.id,
          to_person_id: teen.id,
          relationship_type: 'parent',
          is_biological: true,
          created_by: qaProfile.id
        }
      ]);

    // Create realistic stories
    const { data: stories, error: storiesError } = await supabase
      .from('stories')
      .insert([
        {
          family_id: family.id,
          profile_id: qaProfile.id,
          title: 'The Great Depression Kitchen',
          content: 'During the Great Depression, we had to be so creative with our meals. I remember my mother making the most delicious soup from just potato peels and bones. We never wasted anything, and somehow those simple meals tasted better than anything we have today.',
          story_type: 'audio',
          occurred_on: '1942-06-15',
          occurred_precision: 'month',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          family_id: family.id,
          profile_id: qaProfile.id,
          title: 'Meeting Your Grandfather',
          content: 'I met your grandfather at a church dance in 1954. He was so shy, he stood by the wall the entire evening. I finally had to ask him to dance myself! He was such a gentleman, and we danced to "Moon River" three times that night.',
          story_type: 'audio',
          occurred_on: '1954-09-12',
          occurred_precision: 'day',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          family_id: family.id,
          profile_id: qaProfile.id,
          title: 'First Day of School Adventures',
          content: 'I remember dropping you off for your first day of kindergarten. You were so brave, but I could see the little tear in your eye. By the time I picked you up, you had made three new friends and couldn\'t stop talking about the art class.',
          story_type: 'text',
          occurred_on: '2014-09-03',
          occurred_precision: 'day',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          family_id: family.id,
          profile_id: qaProfile.id,
          title: 'Building the Treehouse',
          content: 'That summer we spent building the treehouse in the backyard was one of the best. Every weekend, we\'d work on it together - measuring, sawing, hammering. You were such a good helper, always handing me the right tools.',
          story_type: 'photo',
          occurred_on: '2018-07-20',
          occurred_precision: 'month',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          family_id: family.id,
          profile_id: qaProfile.id,
          title: 'My First Concert',
          content: 'Going to my first concert was AMAZING! The music was so loud and everyone was singing along. I finally understood why music means so much to people. I can\'t wait to go to another one!',
          story_type: 'text',
          occurred_on: '2024-10-15',
          occurred_precision: 'day',
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        }
      ])
      .select();

    if (storiesError || !stories) {
      throw new Error(`Failed to create stories: ${storiesError?.message}`);
    }

    // Create some comments
    await supabase
      .from('comments')
      .insert([
        {
          family_id: family.id,
          story_id: stories[0].id,
          profile_id: qaProfile.id,
          content: 'Wow Grandma, I never knew you lived through the Great Depression! That soup recipe sounds interesting - maybe we could try making it sometime?',
          created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          family_id: family.id,
          story_id: stories[4].id,
          profile_id: qaProfile.id,
          content: 'So glad you had fun at your first concert! Music has always been important in our family. Your great-grandmother played piano beautifully.',
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ]);

    // Create some questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .insert([
        {
          family_id: family.id,
          profile_id: qaProfile.id,
          question_text: 'What was your favorite family tradition growing up?',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          family_id: family.id,
          profile_id: qaProfile.id,
          question_text: 'What advice would you give to future generations of our family?',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ])
      .select();

    if (questionsError || !questions) {
      throw new Error(`Failed to create questions: ${questionsError?.message}`);
    }

    // Create some answers
    await supabase
      .from('answers')
      .insert([
        {
          family_id: family.id,
          question_id: questions[0].id,
          profile_id: qaProfile.id,
          answer_text: 'Every Sunday, we would all gather for dinner after church. Three generations around one table, sharing stories and laughing together. Those meals were the heart of our family.',
          occurred_on: '1960-01-01',
          occurred_precision: 'year',
          created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
        },
        {
          family_id: family.id,
          question_id: questions[1].id,
          profile_id: qaProfile.id,
          answer_text: 'Always remember that family comes first, but don\'t forget to follow your dreams. The world will change in ways you can\'t imagine, but love and kindness never go out of style.',
          occurred_on: '2024-01-01',
          occurred_precision: 'year',
          created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
        }
      ]);

    console.log('QA Test Family setup completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'QA Test Family created successfully',
        family: {
          id: family.id,
          name: family.name,
          people_count: people.length,
          stories_count: stories.length,
          questions_count: questions.length
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error setting up QA family:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to setup QA family', 
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);