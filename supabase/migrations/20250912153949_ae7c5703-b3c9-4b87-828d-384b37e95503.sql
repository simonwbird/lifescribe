-- Upload recipe images and create media records

-- Insert media records for recipe images (linking to existing recipes)
WITH recipe_images AS (
  SELECT 
    r.id as recipe_id,
    r.family_id,
    r.created_by,
    CASE 
      WHEN r.title = 'Grandma Mary''s Chocolate Chip Cookies' THEN 'recipes/grandma-cookies.jpg'
      WHEN r.title = 'Sunday Pot Roast' THEN 'recipes/sunday-pot-roast.jpg'
      WHEN r.title = 'Mom''s Apple Pie' THEN 'recipes/moms-apple-pie.jpg'
      WHEN r.title = 'Uncle Robert''s BBQ Ribs' THEN 'recipes/bbq-ribs.jpg'
    END as file_path,
    CASE 
      WHEN r.title = 'Grandma Mary''s Chocolate Chip Cookies' THEN 'grandma-cookies.jpg'
      WHEN r.title = 'Sunday Pot Roast' THEN 'sunday-pot-roast.jpg'
      WHEN r.title = 'Mom''s Apple Pie' THEN 'moms-apple-pie.jpg'
      WHEN r.title = 'Uncle Robert''s BBQ Ribs' THEN 'bbq-ribs.jpg'
    END as file_name
  FROM recipes r 
  WHERE r.title IN (
    'Grandma Mary''s Chocolate Chip Cookies',
    'Sunday Pot Roast', 
    'Mom''s Apple Pie',
    'Uncle Robert''s BBQ Ribs'
  )
  AND r.family_id = 'a235280e-6110-4a83-a69b-a5ba34f676ba'
)
INSERT INTO media (
  recipe_id,
  family_id,
  profile_id,
  file_path,
  file_name,
  mime_type,
  file_size
)
SELECT 
  recipe_id,
  family_id,
  created_by,
  file_path,
  file_name,
  'image/jpeg',
  250000 -- Approximate file size for generated images
FROM recipe_images
WHERE file_path IS NOT NULL;