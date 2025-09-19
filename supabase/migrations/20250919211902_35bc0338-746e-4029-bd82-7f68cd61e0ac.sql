-- Update Simon Bird's profile to have super admin role
UPDATE profiles 
SET settings = jsonb_set(settings, '{role}', '"super_admin"') 
WHERE id = '1d3a4094-955f-487e-bfee-5534e609b724';