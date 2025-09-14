-- Storage policies for private 'media' bucket using familyId/profileId pathing
-- Allows family members to read, and users to write within their own subfolder under their family

-- View objects in media bucket if you are a member of the family in the first path segment
create policy if not exists "Family members can view media objects"
on storage.objects
for select
using (
  bucket_id = 'media'
  and exists (
    select 1 from public.members m
    where m.profile_id = auth.uid()
      and m.family_id::text = (storage.foldername(name))[1]
  )
);

-- Upload objects only into paths: familyId/auth.uid()/...
create policy if not exists "Users can upload to their folder under family"
on storage.objects
for insert
with check (
  bucket_id = 'media'
  and exists (
    select 1 from public.members m
    where m.profile_id = auth.uid()
      and m.family_id::text = (storage.foldername(name))[1]
  )
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Update own objects
create policy if not exists "Object owner can update media"
on storage.objects
for update
using (
  bucket_id = 'media'
  and (storage.foldername(name))[2] = auth.uid()::text
);

-- Delete own objects
create policy if not exists "Object owner can delete media"
on storage.objects
for delete
using (
  bucket_id = 'media'
  and (storage.foldername(name))[2] = auth.uid()::text
);
