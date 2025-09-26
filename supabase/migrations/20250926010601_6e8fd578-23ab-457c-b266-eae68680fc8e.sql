-- Enhance the create_default_family_space function to seed demo content
CREATE OR REPLACE FUNCTION public.create_default_family_space()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  family_name text;
  new_family_id uuid;
  story1_id uuid;
  story2_id uuid;
  story3_id uuid;
  sample_person_id uuid;
BEGIN
  -- Determine family name from profile data
  family_name := COALESCE(
    split_part(NEW.full_name, ' ', -1) || ' Family',
    'My Family'
  );
  
  -- Create the family
  INSERT INTO public.families (name, description, created_by)
  VALUES (family_name, 'Default family space', NEW.id)
  RETURNING id INTO new_family_id;
  
  -- Update the profile with default_space_id
  UPDATE public.profiles 
  SET default_space_id = new_family_id 
  WHERE id = NEW.id;
  
  -- Add user as admin member of the family
  INSERT INTO public.members (profile_id, family_id, role)
  VALUES (NEW.id, new_family_id, 'admin');
  
  -- Create a sample family member for realistic content
  INSERT INTO public.people (
    family_id, full_name, given_name, surname, 
    birth_date, birth_year, gender, is_living, 
    notes, created_by
  ) VALUES (
    new_family_id, 'Grandma Rose', 'Rose', 'Smith', 
    '1935-05-15', 1935, 'female', true,
    'Family matriarch who loves sharing stories and cooking traditional recipes.',
    NEW.id
  ) RETURNING id INTO sample_person_id;
  
  -- Seed Story 1: Text story with family history
  INSERT INTO public.stories (
    family_id, profile_id, title, content, 
    occurred_on, is_approx, tags, created_by
  ) VALUES (
    new_family_id, NEW.id, 
    'Welcome to Your Family Story Collection!',
    'This is your family''s story space where memories come alive! 

Share everyday moments, special occasions, old family photos, and voice recordings. Every story you add becomes part of your family''s digital legacy.

Here are some ideas to get you started:
• Upload old family photos with stories behind them
• Record voice messages for future generations  
• Share favorite recipes with the stories behind them
• Document family traditions and how they started

Your family will love seeing these memories unfold! Don''t worry about making everything perfect - the most meaningful stories are often the simplest ones.',
    CURRENT_DATE - INTERVAL '2 days',
    false,
    ARRAY['welcome', 'family-history', 'getting-started'],
    NEW.id
  ) RETURNING id INTO story1_id;
  
  -- Seed Story 2: Recipe/tradition story
  INSERT INTO public.stories (
    family_id, profile_id, title, content,
    occurred_on, is_approx, tags, created_by
  ) VALUES (
    new_family_id, NEW.id,
    'Grandma Rose''s Famous Apple Pie Recipe',
    'Every Sunday, the whole house would fill with the warm smell of cinnamon and apples. Grandma Rose had this magical way of making the perfect apple pie - the crust was always golden and flaky, and the filling had just the right balance of sweet and tart.

The secret wasn''t just in the recipe (though she did use a special blend of apples), it was in the love she put into every pie. She''d let us kids help peel the apples and roll out the dough, making a wonderful mess in the kitchen.

"A pie made with love tastes better than any recipe," she used to say. And she was absolutely right.

🥧 Recipe highlights:
- Mix of Granny Smith and Honeycrisp apples
- A touch of lemon juice to brighten the flavor  
- Cinnamon, nutmeg, and her "secret spice" (cardamom!)
- Always served with vanilla ice cream

Some of my happiest childhood memories happened in that kitchen, learning from the best baker I ever knew.',
    CURRENT_DATE - INTERVAL '5 days',
    true,
    ARRAY['recipes', 'grandma-rose', 'traditions', 'cooking', 'childhood-memories'],
    NEW.id
  ) RETURNING id INTO story2_id;
  
  -- Seed Story 3: Photo memory story  
  INSERT INTO public.stories (
    family_id, profile_id, title, content,
    occurred_on, is_approx, tags, created_by
  ) VALUES (
    new_family_id, NEW.id,
    'Summer of ''85 - The Great Family Road Trip',
    'Found this gem while going through old photo albums! This was taken during our epic cross-country road trip in the summer of 1985. 

We packed everything into Dad''s old station wagon (yes, the one with the wood paneling!) and drove from coast to coast. It took us three weeks, and we saw the Grand Canyon, Yellowstone, and so many small towns along the way.

The best part wasn''t the famous landmarks though - it was the little moments. Playing license plate games, singing along to the radio, stopping at roadside diners, and sleeping under the stars at campgrounds.

We were all crammed together in that car for hours every day, but somehow it brought us closer together. These are the trips that made us who we are as a family.

📸 Everyone looks so young here! Can you spot yourself?',
    '1985-07-15',
    true,
    ARRAY['family-trip', 'vintage-photos', '1980s', 'road-trip', 'summer-memories'],
    NEW.id
  ) RETURNING id INTO story3_id;
  
  -- Add some realistic comments to make the feed feel alive
  INSERT INTO public.comments (family_id, profile_id, story_id, content) VALUES
  (new_family_id, NEW.id, story1_id, 'This is so exciting! I can''t wait to start sharing more family memories here. 📸✨'),
  (new_family_id, NEW.id, story2_id, 'I can almost smell that apple pie just reading this! We definitely need to make this recipe again soon. 🥧❤️'),
  (new_family_id, NEW.id, story3_id, 'Look how young everyone looks! I remember this trip like it was yesterday. Those were such special times. 🚗💙');
  
  -- Add some sample reactions to make content feel engaging
  INSERT INTO public.reactions (family_id, profile_id, story_id, reaction_type) VALUES
  (new_family_id, NEW.id, story1_id, 'heart'),
  (new_family_id, NEW.id, story2_id, 'heart'),
  (new_family_id, NEW.id, story2_id, 'thumbs_up'),
  (new_family_id, NEW.id, story3_id, 'heart'),
  (new_family_id, NEW.id, story3_id, 'smile');
  
  -- Link the stories with the sample person for more realistic content
  INSERT INTO public.story_people (story_id, person_id) VALUES
  (story2_id, sample_person_id),
  (story3_id, sample_person_id);
  
  RETURN NEW;
END;
$$;