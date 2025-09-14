-- Create story from the recent prompt answer about first work experience
INSERT INTO stories (family_id, profile_id, title, content, tags, created_at)
VALUES (
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  '1d3a4094-955f-487e-bfee-5534e609b724', 
  'What was your first full-time work experience?',
  'Working at SWA Recruitment in South Yarra Melbourne. It was a tough job doing recruitment. I didn''t like it. I tried to finish my degree from Monash at night and didn''t manage that. So I decided to pause my degree for the time-being before I finished my degree',
  ARRAY['prompt-answer', 'career', 'work'],
  '2025-09-14 22:08:15.822198+00'
);