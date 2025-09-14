-- Remove the direct parent-child relationship between Leon and Shirley
-- Now Shirley's parent connection will only come from Leon and Bertha's unmarried partnership
DELETE FROM relationships WHERE id = 'faa5ec2b-6c33-4162-99d8-075a0df78c4b';