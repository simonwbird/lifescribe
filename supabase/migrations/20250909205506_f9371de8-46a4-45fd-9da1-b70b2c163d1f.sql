-- Add is_active column to questions table
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 100 starter prompts for LifeScribe
INSERT INTO public.questions (category, question_text, is_active) VALUES
-- childhood (10)
('childhood','What is your earliest memory?', true),
('childhood','Who was your childhood best friend?', true),
('childhood','What games did you love to play as a kid?', true),
('childhood','What was your favourite toy growing up?', true),
('childhood','Did you have a nickname as a child?', true),
('childhood','What did you want to be when you grew up?', true),
('childhood','What was your favourite subject in school?', true),
('childhood','What foods did you love (or hate) as a kid?', true),
('childhood','What cartoons or shows did you watch the most?', true),
('childhood','What was a typical birthday like for you?', true),

-- family (10)
('family','Who were you named after?', true),
('family','Do you know the story of how your parents met?', true),
('family','What family traditions did you grow up with?', true),
('family','Did your family have a favourite meal together?', true),
('family','What chores did you have as a child?', true),
('family','Who in your family influenced you the most?', true),
('family','What was a holiday tradition in your home?', true),
('family','What pets did your family have?', true),
('family','What is a funny story about your siblings?', true),
('family','What is your favourite family recipe?', true),

-- teenage (10)
('teenage','What music did you love as a teenager?', true),
('teenage','What was your first concert?', true),
('teenage','Did you have a part-time job in high school?', true),
('teenage','Who was your teenage crush?', true),
('teenage','What sports or clubs were you part of?', true),
('teenage','What was your first big purchase?', true),
('teenage','How did you celebrate finishing school exams?', true),
('teenage','What fashion styles were you into as a teen?', true),
('teenage','What slang words did you use growing up?', true),
('teenage','What was your proudest teenage moment?', true),

-- adulthood (10)
('adulthood','What was your first full-time job?', true),
('adulthood','How did you meet your partner?', true),
('adulthood','What was your first car?', true),
('adulthood','What was your wedding like?', true),
('adulthood','Where was your first home as an adult?', true),
('adulthood','What is the best advice you received about work?', true),
('adulthood','What big risks did you take in your 20s or 30s?', true),
('adulthood','What hobbies did you take up as an adult?', true),
('adulthood','What''s the hardest decision you ever had to make?', true),
('adulthood','What did you learn about money growing up?', true),

-- travel (10)
('travel','Where was your first holiday abroad?', true),
('travel','What is the most beautiful place you''ve visited?', true),
('travel','What was your favourite family holiday?', true),
('travel','Did you ever go on a road trip?', true),
('travel','What is your funniest travel story?', true),
('travel','What trip changed your perspective the most?', true),
('travel','Where would you love to visit but haven''t yet?', true),
('travel','What was your favourite childhood holiday spot?', true),
('travel','Who do you love to travel with?', true),
('travel','What is the longest journey you''ve taken?', true),

-- love (10)
('love','How did you meet your partner?', true),
('love','What was your first date like?', true),
('love','What did you find most attractive about them?', true),
('love','What advice would you give about love?', true),
('love','What is your favourite romantic memory?', true),
('love','What challenges did you overcome together?', true),
('love','What song reminds you of your relationship?', true),
('love','Who was your first love?', true),
('love','How did you propose (or get proposed to)?', true),
('love','What is the secret to a long relationship?', true),

-- food (10)
('food','What is your favourite comfort food?', true),
('food','What meal reminds you of your childhood?', true),
('food','What family recipes do you cherish?', true),
('food','Did you have a favourite sweet or treat?', true),
('food','What''s the best meal you''ve ever eaten?', true),
('food','What was mealtime like growing up?', true),
('food','Who taught you how to cook?', true),
('food','What food did you dislike as a child but love now?', true),
('food','What food do you always eat on special occasions?', true),
('food','What is your guilty pleasure food?', true),

-- work (10)
('work','What was your very first job?', true),
('work','Who was your best boss or mentor?', true),
('work','What is the funniest thing that happened at work?', true),
('work','What was your most stressful job?', true),
('work','What achievement at work are you most proud of?', true),
('work','What is the most valuable career lesson you learned?', true),
('work','Did you ever quit a job dramatically?', true),
('work','What was your longest job?', true),
('work','What was your dream job growing up?', true),
('work','What job would you never want to do?', true),

-- life_lessons (10)
('life_lessons','What advice would you give your younger self?', true),
('life_lessons','What mistake taught you the biggest lesson?', true),
('life_lessons','What values do you try to live by?', true),
('life_lessons','What book changed your perspective?', true),
('life_lessons','What''s the best piece of advice you ever received?', true),
('life_lessons','What''s something you wish you learned earlier?', true),
('life_lessons','What do you hope people remember about you?', true),
('life_lessons','What does happiness mean to you?', true),
('life_lessons','What is the most important life skill you learned?', true),
('life_lessons','What do you consider your biggest accomplishment?', true),

-- funny (10)
('funny','What''s the funniest thing you ever did as a kid?', true),
('funny','What is a story your family always laughs about?', true),
('funny','What prank did you play on someone?', true),
('funny','What embarrassing moment do you laugh about now?', true),
('funny','What is the silliest argument you''ve had?', true),
('funny','What is your funniest memory from school?', true),
('funny','What joke always makes you laugh?', true),
('funny','What funny tradition does your family have?', true),
('funny','Who in your family is the funniest?', true),
('funny','What is your go-to funny story?', true);