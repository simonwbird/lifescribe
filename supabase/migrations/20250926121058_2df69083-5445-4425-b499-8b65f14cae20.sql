-- Seed the prompts table with base prompts
INSERT INTO prompts (slug, category, scope, title, body, tags) VALUES
-- General prompts (36 total)
('best-friend-growing-up', 'People', 'general', 'Your Best Friend Growing Up', 'Tell us about your best friend growing up.', ARRAY['friendship', 'childhood']),
('who-taught-you', 'People', 'general', 'Someone Who Taught You', 'Who taught you something important?', ARRAY['learning', 'mentorship']),
('made-you-laugh', 'People', 'general', 'Someone Who Made You Laugh', 'Describe someone who always made you laugh.', ARRAY['humor', 'joy']),
('impactful-teacher', 'People', 'general', 'A Teacher Who Made a Difference', 'Tell us about a teacher who made a difference.', ARRAY['education', 'influence']),

('childhood-home', 'Places', 'general', 'Your Childhood Home', 'Describe your childhood home.', ARRAY['home', 'childhood']),
('beloved-neighborhood', 'Places', 'general', 'A Neighborhood You Loved', 'Tell us about a neighborhood you loved.', ARRAY['community', 'neighborhood']),
('favorite-place-to-visit', 'Places', 'general', 'Your Favorite Place to Visit', 'Describe your favorite place to visit.', ARRAY['travel', 'favorite-places']),
('place-like-home', 'Places', 'general', 'A Place That Felt Like Home', 'Tell us about a place that felt like home.', ARRAY['comfort', 'belonging']),

('first-job', 'Firsts', 'general', 'Your First Job', 'Tell us about your first job.', ARRAY['work', 'career', 'firsts']),
('first-car-bike', 'Firsts', 'general', 'Your First Car or Bike', 'Describe your first car or bike.', ARRAY['transportation', 'firsts']),
('first-day-school', 'Firsts', 'general', 'Your First Day of School', 'Tell us about your first day of school.', ARRAY['education', 'firsts']),
('first-love', 'Firsts', 'general', 'The First Time You Fell in Love', 'Describe the first time you fell in love.', ARRAY['love', 'romance', 'firsts']),

('beloved-meal', 'Food & Music', 'general', 'A Meal You Loved', 'Describe a meal you loved and who made it.', ARRAY['food', 'family']),
('meaningful-song', 'Food & Music', 'general', 'A Song That Takes You Back', 'Tell us about a song that takes you back.', ARRAY['music', 'memories']),
('family-recipe', 'Food & Music', 'general', 'Your Family''s Favorite Recipe', 'What was your family''s favorite recipe?', ARRAY['cooking', 'tradition']),
('celebration-meal', 'Food & Music', 'general', 'A Celebration Meal You Remember', 'Describe a celebration meal you remember.', ARRAY['celebration', 'food']),

('advice-to-young-self', 'Advice & Wisdom', 'general', 'Advice to Your 20-Year-Old Self', 'What advice would you give your 20-year-old self?', ARRAY['wisdom', 'advice']),
('life-lesson', 'Advice & Wisdom', 'general', 'A Lesson Life Taught You', 'Tell us about a lesson life taught you.', ARRAY['wisdom', 'growth']),
('best-advice-received', 'Advice & Wisdom', 'general', 'The Best Advice You Ever Received', 'What''s the best advice you ever received?', ARRAY['wisdom', 'guidance']),
('wish-everyone-knew', 'Advice & Wisdom', 'general', 'Something You Wish Everyone Knew', 'Share something you wish everyone knew.', ARRAY['wisdom', 'insight']),

('felt-really-proud', 'Pride & Resilience', 'general', 'A Time You Felt Really Proud', 'Tell us about a time you felt really proud.', ARRAY['achievement', 'pride']),
('hard-time-overcome', 'Pride & Resilience', 'general', 'A Hard Time You Got Through', 'Describe a hard time you got through.', ARRAY['resilience', 'overcoming']),
('something-accomplished', 'Pride & Resilience', 'general', 'Something You Accomplished', 'Tell us about something you accomplished.', ARRAY['achievement', 'success']),
('helped-someone', 'Pride & Resilience', 'general', 'A Time You Helped Someone', 'Describe a time you helped someone.', ARRAY['kindness', 'helping']),

-- Additional general prompts to reach 36
('sunday-dinner', 'Food & Music', 'general', 'Sunday Dinners Growing Up', 'Tell us about Sunday dinners when you were growing up.', ARRAY['family', 'tradition']),
('favorite-holiday', 'Celebrations', 'general', 'Your Favorite Holiday', 'What was your favorite holiday and why?', ARRAY['holidays', 'celebration']),
('childhood-games', 'Recreation', 'general', 'Games You Played as a Child', 'What games did you love to play as a child?', ARRAY['childhood', 'play']),
('best-birthday', 'Celebrations', 'general', 'Your Best Birthday Memory', 'Tell us about your best birthday memory.', ARRAY['birthday', 'celebration']),
('favorite-book', 'Culture', 'general', 'A Book That Influenced You', 'Tell us about a book that influenced you.', ARRAY['reading', 'influence']),
('childhood-pet', 'Pets', 'general', 'A Childhood Pet', 'Tell us about a pet you had growing up.', ARRAY['pets', 'childhood']),
('summer-memories', 'Seasons', 'general', 'Your Favorite Summer Memory', 'What''s your favorite summer memory?', ARRAY['summer', 'seasons']),
('family-vacation', 'Travel', 'general', 'A Memorable Family Vacation', 'Tell us about a memorable family vacation.', ARRAY['travel', 'family']),
('winter-traditions', 'Seasons', 'general', 'Winter Traditions', 'What winter traditions did your family have?', ARRAY['winter', 'tradition']),
('school-memories', 'Education', 'general', 'Your Favorite School Memory', 'What''s your favorite memory from school?', ARRAY['school', 'education']),
('weekend-activities', 'Recreation', 'general', 'Weekend Activities Growing Up', 'What did your family do on weekends when you were young?', ARRAY['family', 'recreation']),
('bedtime-stories', 'Childhood', 'general', 'Bedtime Stories', 'Tell us about bedtime stories from your childhood.', ARRAY['childhood', 'stories'])

ON CONFLICT (slug) DO NOTHING;