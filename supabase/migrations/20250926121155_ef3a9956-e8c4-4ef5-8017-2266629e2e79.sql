-- Seed family-specific prompts (43 total)
INSERT INTO prompts (slug, category, scope, person_role, title, body, tags) VALUES
-- About spouse
('first-met-spouse', 'Family', 'person_specific', 'spouse', 'How You First Met', 'Tell us about how you first met your spouse.', ARRAY['love', 'meeting', 'spouse']),
('favorite-memory-spouse', 'Family', 'person_specific', 'spouse', 'Favorite Memory Together', 'What''s your favorite memory with your spouse?', ARRAY['memories', 'spouse']),
('what-makes-spouse-special', 'Family', 'person_specific', 'spouse', 'What Makes Them Special', 'Describe what makes your spouse special.', ARRAY['love', 'appreciation', 'spouse']),
('wedding-day', 'Family', 'person_specific', 'spouse', 'Your Wedding Day', 'Tell us about your wedding day.', ARRAY['wedding', 'celebration', 'spouse']),

-- About children
('funny-child-story', 'Family', 'person_specific', 'child', 'A Funny Childhood Story', 'Share a funny story about this child.', ARRAY['humor', 'childhood', 'children']),
('child-personality', 'Family', 'person_specific', 'child', 'Their Personality Growing Up', 'Tell us about their personality growing up.', ARRAY['personality', 'childhood', 'children']),
('special-moment-children', 'Family', 'person_specific', 'child', 'Special Moment Together', 'Describe a special moment with your children together.', ARRAY['bonding', 'children']),
('proud-of-child', 'Family', 'person_specific', 'child', 'What Makes You Proud', 'What are you most proud of about this child?', ARRAY['pride', 'achievement', 'children']),
('family-vacation-children', 'Family', 'person_specific', 'child', 'A Family Vacation Memory', 'Tell us about a family vacation with your children.', ARRAY['travel', 'family', 'children']),

-- About parents
('lesson-from-parent', 'Family', 'person_specific', 'parent', 'A Lesson They Taught You', 'Tell us about a lesson this parent taught you.', ARRAY['wisdom', 'parenting', 'lessons']),
('favorite-memory-parent', 'Family', 'person_specific', 'parent', 'Favorite Memory Together', 'Share a favorite memory of this parent.', ARRAY['memories', 'parents']),
('parent-characteristics', 'Family', 'person_specific', 'parent', 'What They Were Like as a Parent', 'Describe what they were like as a parent.', ARRAY['parenting', 'character', 'parents']),
('family-tradition-parent', 'Family', 'person_specific', 'parent', 'A Family Tradition', 'Tell us about a family tradition from this parent.', ARRAY['tradition', 'family', 'parents']),

-- About siblings
('growing-up-siblings', 'Family', 'person_specific', 'sibling', 'Growing Up Together', 'Share a story about growing up with your siblings.', ARRAY['siblings', 'childhood']),
('sibling-mischief', 'Family', 'person_specific', 'sibling', 'Getting Into Mischief', 'Tell us about something you and this sibling got up to as kids.', ARRAY['mischief', 'siblings', 'childhood']),
('sibling-memory', 'Family', 'person_specific', 'sibling', 'A Special Memory', 'Describe a memory with this sibling.', ARRAY['memories', 'siblings']),
('funny-sibling-story', 'Family', 'person_specific', 'sibling', 'A Funny Story', 'Share a funny story about this sibling.', ARRAY['humor', 'siblings']),
('sibling-dynamics', 'Family', 'person_specific', 'sibling', 'Your Relationship Dynamic', 'Tell us about what it was like being siblings.', ARRAY['relationships', 'siblings']),
('siblings-in-trouble', 'Family', 'person_specific', 'sibling', 'Getting Into Trouble Together', 'Describe a time when you and your siblings got into trouble.', ARRAY['mischief', 'siblings', 'childhood']),

-- About grandparents
('grandfather-memories', 'Family', 'person_specific', 'grandparent', 'Memories of Grandfather', 'Tell us about your grandfather.', ARRAY['grandparents', 'memories']),
('grandmother-memories', 'Family', 'person_specific', 'grandparent', 'Memories of Grandmother', 'Share a memory of your grandmother.', ARRAY['grandparents', 'memories']),
('grandparent-role', 'Family', 'person_specific', 'grandparent', 'Their Role in the Family', 'Describe their role in the family.', ARRAY['family-roles', 'grandparents']),
('visiting-grandparents', 'Family', 'person_specific', 'grandparent', 'Visiting Grandparents', 'Share a story about visiting your grandparents.', ARRAY['visits', 'grandparents']),
('family-gathering-grandparents', 'Family', 'person_specific', 'grandparent', 'Family Gatherings', 'Describe a family gathering with the grandparents.', ARRAY['gatherings', 'grandparents']),
('grandparent-lessons', 'Family', 'person_specific', 'grandparent', 'Something They Taught You', 'Tell us about something a grandparent taught you.', ARRAY['wisdom', 'grandparents']),

-- General family moments
('special-christmas', 'Family', 'person_specific', null, 'A Special Christmas', 'Tell us about a special Christmas with the family.', ARRAY['christmas', 'holidays', 'family']),
('memorable-gathering', 'Family', 'person_specific', null, 'A Memorable Family Gathering', 'Describe a family gathering that was memorable.', ARRAY['gatherings', 'family']),
('becoming-parent', 'Family', 'person_specific', null, 'Becoming a Parent', 'Share a story about when you became a parent.', ARRAY['parenting', 'milestones']),
('family-tradition-all', 'Family', 'person_specific', null, 'A Family Tradition', 'Tell us about a family tradition that involved everyone.', ARRAY['tradition', 'family']),

-- Extended family and community
('family-friend', 'Family', 'person_specific', 'family-friend', 'A Special Family Friend', 'Tell us about a family friend who was important to you.', ARRAY['friendship', 'extended-family']),
('family-pet-story', 'Family', 'person_specific', 'pet', 'A Beloved Family Pet', 'Share a story about a family pet that everyone loved.', ARRAY['pets', 'family']),
('family-home-memories', 'Family', 'person_specific', null, 'Memories of the Family Home', 'Tell us about your favorite memories in the family home.', ARRAY['home', 'family-memories']),
('family-meals', 'Family', 'person_specific', null, 'Family Meal Times', 'Describe what family meals were like growing up.', ARRAY['meals', 'family', 'tradition']),
('family-celebrations', 'Family', 'person_specific', null, 'How Your Family Celebrated', 'Tell us how your family celebrated special occasions.', ARRAY['celebration', 'family', 'tradition']),
('family-values', 'Family', 'person_specific', null, 'Family Values', 'What values were important in your family growing up?', ARRAY['values', 'family', 'upbringing']),
('family-stories-passed-down', 'Family', 'person_specific', null, 'Stories Passed Down', 'Share a story that was passed down in your family.', ARRAY['stories', 'family-history', 'tradition']),
('family-sayings', 'Family', 'person_specific', null, 'Family Sayings or Jokes', 'Tell us about sayings or inside jokes your family had.', ARRAY['humor', 'family', 'sayings']),
('family-challenges', 'Family', 'person_specific', null, 'How Your Family Faced Challenges', 'Describe how your family dealt with difficult times.', ARRAY['resilience', 'family', 'challenges']),
('family-reunion', 'Family', 'person_specific', null, 'A Family Reunion', 'Tell us about a memorable family reunion.', ARRAY['reunion', 'extended-family']),
('family-road-trip', 'Family', 'person_specific', null, 'A Family Road Trip', 'Share a story about a family road trip.', ARRAY['travel', 'family', 'adventure']),
('family-game-night', 'Family', 'person_specific', null, 'Family Game Night', 'Tell us about family game nights or activities you did together.', ARRAY['games', 'family', 'fun']),
('family-support', 'Family', 'person_specific', null, 'When Family Supported You', 'Describe a time when your family really supported you.', ARRAY['support', 'family', 'love'])

ON CONFLICT (slug) DO NOTHING;