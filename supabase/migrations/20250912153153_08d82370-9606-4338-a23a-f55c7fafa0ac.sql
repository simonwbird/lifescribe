-- Add sample family recipes
INSERT INTO recipes (
  title, 
  family_id, 
  created_by,
  ingredients,
  steps,
  serves,
  time_prep_minutes,
  time_cook_minutes,
  notes,
  source,
  dietary_tags
) VALUES 
(
  'Grandma Mary''s Chocolate Chip Cookies',
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  '1d3a4094-955f-487e-bfee-5534e609b724',
  '["2 cups all-purpose flour", "1 tsp baking soda", "1 tsp salt", "1 cup butter, softened", "3/4 cup granulated sugar", "3/4 cup brown sugar", "2 large eggs", "2 tsp vanilla extract", "2 cups chocolate chips", "1 pinch sea salt (secret ingredient)"]'::jsonb,
  '["Preheat oven to 375°F", "Mix flour, baking soda, and salt in bowl", "Cream butter and sugars until fluffy", "Beat in eggs and vanilla", "Gradually mix in flour mixture", "Stir in chocolate chips", "Drop spoonfuls on ungreased cookie sheet", "Bake 9-11 minutes until golden", "Cool on baking sheet 2 minutes", "Sprinkle with pinch of sea salt while warm"]'::jsonb,
  '48 cookies',
  15,
  10,
  'Grandma''s secret was the pinch of sea salt and room temperature butter. Never wrote it down, but I watched her make these hundreds of times.',
  'Family recipe from Grandma Mary',
  ARRAY['vegetarian']
),
(
  'Sunday Pot Roast',
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  '1d3a4094-955f-487e-bfee-5534e609b724',
  '["3-4 lb chuck roast", "2 tbsp olive oil", "1 onion, sliced", "4 carrots, chunked", "4 potatoes, quartered", "3 celery stalks, chopped", "2 cups beef broth", "1 packet onion soup mix", "2 tbsp Worcestershire sauce", "2 bay leaves", "Salt and pepper to taste"]'::jsonb,
  '["Season roast with salt and pepper", "Heat oil in Dutch oven, brown roast on all sides", "Remove roast, sauté onions until soft", "Return roast to pot", "Add vegetables around roast", "Mix broth, soup mix, and Worcestershire", "Pour over roast", "Add bay leaves", "Cover and cook at 325°F for 3-4 hours", "Remove bay leaves before serving"]'::jsonb,
  '6-8 people',
  20,
  240,
  'Dad''s favorite Sunday dinner. The smell would fill the whole house and bring everyone to the kitchen.',
  'Family tradition',
  ARRAY[]::text[]
),
(
  'Mom''s Apple Pie',
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  '1d3a4094-955f-487e-bfee-5534e609b724',
  '["2 pie crusts", "6-8 Granny Smith apples", "3/4 cup sugar", "2 tbsp flour", "1 tsp cinnamon", "1/4 tsp nutmeg", "1/4 tsp salt", "2 tbsp butter", "1 egg for wash", "1 tbsp sugar for topping"]'::jsonb,
  '["Preheat oven to 425°F", "Peel and slice apples thin", "Mix apples with sugar, flour, and spices", "Roll out bottom crust, place in pie pan", "Fill with apple mixture", "Dot with butter pieces", "Cover with top crust, seal edges", "Cut steam vents", "Brush with beaten egg, sprinkle with sugar", "Bake 15 min at 425°F, then 35-45 min at 350°F", "Cool before serving"]'::jsonb,
  '8 slices',
  30,
  60,
  'Won first prize at the county fair three years running. The secret is using only Granny Smith apples and not too much sugar.',
  'Mom''s prize-winning recipe',
  ARRAY['vegetarian']
),
(
  'Uncle Robert''s BBQ Ribs',
  'a235280e-6110-4a83-a69b-a5ba34f676ba',
  '1d3a4094-955f-487e-bfee-5534e609b724',
  '["2 racks baby back ribs", "2 tbsp brown sugar", "1 tbsp paprika", "1 tsp garlic powder", "1 tsp onion powder", "1 tsp chili powder", "1 tsp cumin", "1 tsp salt", "1/2 tsp black pepper", "1 cup BBQ sauce"]'::jsonb,
  '["Remove membrane from back of ribs", "Mix all dry ingredients for rub", "Coat ribs generously with rub", "Wrap in foil, refrigerate 2+ hours", "Preheat grill to medium-low", "Grill wrapped ribs 2 hours", "Unwrap, brush with BBQ sauce", "Grill 15-20 minutes, turning and basting", "Let rest 10 minutes before cutting"]'::jsonb,
  '4-6 people',
  15,
  150,
  'Uncle Robert''s famous ribs from our Maine visit. He''d never share the exact rub recipe, but I finally figured it out!',
  'Uncle Robert''s secret recipe',
  ARRAY['gluten-free']
);