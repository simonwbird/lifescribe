-- Add media records for recipe images (one at a time to debug)

-- First, let's add media for Grandma Mary's Cookies (using the first occurrence)
INSERT INTO media (
  recipe_id,
  family_id,
  profile_id,
  file_path,
  file_name,
  mime_type,
  file_size
) VALUES (
  '82e044d1-2673-4fd6-b2aa-69dca1f9757c',
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  '1d3a4094-955f-487e-bfee-5534e609b724',
  'recipes/grandma-cookies.jpg',
  'grandma-cookies.jpg',
  'image/jpeg',
  250000
);

-- Add media for Sunday Pot Roast
INSERT INTO media (
  recipe_id,
  family_id,
  profile_id,
  file_path,
  file_name,
  mime_type,
  file_size
) VALUES (
  '82521123-ecb1-4289-8337-7f02224febfc',
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  '1d3a4094-955f-487e-bfee-5534e609b724',
  'recipes/sunday-pot-roast.jpg',
  'sunday-pot-roast.jpg',
  'image/jpeg',
  250000
);

-- Add media for Mom's Apple Pie
INSERT INTO media (
  recipe_id,
  family_id,
  profile_id,
  file_path,
  file_name,
  mime_type,
  file_size
) VALUES (
  '7b2f9013-7bba-4075-827e-d72c4442d63c',
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  '1d3a4094-955f-487e-bfee-5534e609b724',
  'recipes/moms-apple-pie.jpg',
  'moms-apple-pie.jpg',
  'image/jpeg',
  250000
);

-- Add media for Uncle Robert's BBQ Ribs
INSERT INTO media (
  recipe_id,
  family_id,
  profile_id,
  file_path,
  file_name,
  mime_type,
  file_size
) VALUES (
  '967a85e2-8575-48f1-9e5d-83285c49bb57',
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  '1d3a4094-955f-487e-bfee-5534e609b724',
  'recipes/bbq-ribs.jpg',
  'bbq-ribs.jpg',
  'image/jpeg',
  250000
);