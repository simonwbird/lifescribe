-- Add 5 dummy family members to Bird Family
-- First create profiles for the dummy users
INSERT INTO profiles (id, email, full_name, avatar_url) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'john.bird@example.com', 'John Bird', NULL),
  ('22222222-2222-2222-2222-222222222222', 'mary.bird@example.com', 'Mary Bird', NULL),
  ('33333333-3333-3333-3333-333333333333', 'sarah.bird@example.com', 'Sarah Bird', NULL),
  ('44444444-4444-4444-4444-444444444444', 'michael.bird@example.com', 'Michael Bird', NULL),
  ('55555555-5555-5555-5555-555555555555', 'emily.bird@example.com', 'Emily Bird', NULL);

-- Then add them as members to the Bird Family
INSERT INTO members (family_id, profile_id, role) VALUES
  ('a235280e-6110-4a83-a69b-a5ba34f676ba', '11111111-1111-1111-1111-111111111111', 'admin'),
  ('a235280e-6110-4a83-a69b-a5ba34f676ba', '22222222-2222-2222-2222-222222222222', 'member'),
  ('a235280e-6110-4a83-a69b-a5ba34f676ba', '33333333-3333-3333-3333-333333333333', 'member'),
  ('a235280e-6110-4a83-a69b-a5ba34f676ba', '44444444-4444-4444-4444-444444444444', 'member'),
  ('a235280e-6110-4a83-a69b-a5ba34f676ba', '55555555-5555-5555-5555-555555555555', 'guest');