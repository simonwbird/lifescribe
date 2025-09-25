-- Fix stuck onboarding state for users who have completed setup but status wasn't updated
UPDATE profiles 
SET 
    onboarding_step = 'completed',
    onboarding_completed_at = now()
WHERE id = '1d3a4094-955f-487e-bfee-5534e609b724'
  AND onboarding_completed_at IS NULL
  AND full_name IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM members 
    WHERE profile_id = profiles.id
  );