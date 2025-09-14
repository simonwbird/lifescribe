-- Link Shirley Lenore Thomas to her biological parents using full_name matches
with dad as (
  select id, family_id, created_by from people 
  where full_name ilike 'Leon Phillips' 
  limit 1
), mom as (
  select id, family_id, created_by from people 
  where full_name ilike 'Bertha Olive Stork' 
  limit 1
), child as (
  select id, family_id from people 
  where full_name ilike 'Shirley Lenore Thomas' 
  limit 1
)
-- Dad -> Child
insert into relationships (relationship_type, from_person_id, to_person_id, family_id, created_by, created_at)
select 'parent'::relationship_type, d.id, c.id, d.family_id, d.created_by, now()
from dad d, child c
where d.family_id = c.family_id
  and not exists (
    select 1 from relationships r 
    where r.relationship_type = 'parent'::relationship_type
      and r.from_person_id = d.id
      and r.to_person_id = c.id
  );

-- Mom -> Child
insert into relationships (relationship_type, from_person_id, to_person_id, family_id, created_by, created_at)
select 'parent'::relationship_type, m.id, c.id, m.family_id, m.created_by, now()
from mom m, child c
where m.family_id = c.family_id
  and not exists (
    select 1 from relationships r 
    where r.relationship_type = 'parent'::relationship_type
      and r.from_person_id = m.id
      and r.to_person_id = c.id
  );