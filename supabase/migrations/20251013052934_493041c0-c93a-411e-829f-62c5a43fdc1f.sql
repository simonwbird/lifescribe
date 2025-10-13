-- Create memories table for tribute memories
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  contributor_user uuid references auth.users(id) on delete set null,
  contributor_name text,
  relationship_to_person text,
  modality text check (modality in ('text','voice','photo')) not null,
  prompt_id uuid references public.tribute_sparks(id) on delete set null,
  title text,
  body text,
  audio_url text,
  photo_url text,
  year_approx int,
  place_id uuid references public.places(id) on delete set null,
  tags text[] default '{}',
  visibility text not null default 'family' check (visibility in ('only_me','inner_circle','family','public')),
  status text not null default 'pending' check (status in ('pending','approved','hidden','rejected')),
  moderated_by uuid references auth.users(id) on delete set null,
  moderated_at timestamptz,
  moderation_notes text,
  family_id uuid not null references public.families(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes for common queries
create index idx_memories_person_id on public.memories(person_id);
create index idx_memories_contributor_user on public.memories(contributor_user);
create index idx_memories_family_id on public.memories(family_id);
create index idx_memories_status on public.memories(status);
create index idx_memories_visibility on public.memories(visibility);
create index idx_memories_created_at on public.memories(created_at desc);

-- Enable RLS
alter table public.memories enable row level security;

-- Policy: Users can read their own memories (any status)
create policy "Contributors can view their own memories"
on public.memories
for select
using (auth.uid() = contributor_user);

-- Policy: Approved memories are readable based on visibility
create policy "Approved memories are publicly visible"
on public.memories
for select
using (
  status = 'approved' 
  and visibility = 'public'
);

create policy "Approved family memories visible to family members"
on public.memories
for select
using (
  status = 'approved' 
  and visibility = 'family'
  and family_id in (
    select family_id from public.members where profile_id = auth.uid()
  )
);

-- Policy: Anyone can insert memories (including guests via contributor_name)
create policy "Anyone can create memories"
on public.memories
for insert
with check (true);

-- Policy: Contributors can update their own pending memories
create policy "Contributors can update their own pending memories"
on public.memories
for update
using (
  auth.uid() = contributor_user 
  and status = 'pending'
);

-- Policy: Owners and stewards can moderate memories
create policy "Owners and stewards can moderate memories"
on public.memories
for update
using (
  exists (
    select 1 
    from public.person_roles pr
    where pr.person_id = memories.person_id
      and pr.profile_id = auth.uid()
      and pr.role in ('owner', 'steward', 'co_curator')
      and pr.revoked_at is null
  )
);

-- Policy: Family admins can moderate any family memories
create policy "Family admins can moderate family memories"
on public.memories
for update
using (
  exists (
    select 1 
    from public.members m
    where m.family_id = memories.family_id
      and m.profile_id = auth.uid()
      and m.role = 'admin'
  )
);

-- Policy: Owners and stewards can delete memories
create policy "Owners and stewards can delete memories"
on public.memories
for delete
using (
  exists (
    select 1 
    from public.person_roles pr
    where pr.person_id = memories.person_id
      and pr.profile_id = auth.uid()
      and pr.role in ('owner', 'steward')
      and pr.revoked_at is null
  )
);

-- Create function to update updated_at timestamp
create or replace function public.update_memories_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create trigger for automatic updated_at
create trigger update_memories_updated_at
before update on public.memories
for each row
execute function public.update_memories_updated_at();

-- Add comment for documentation
comment on table public.memories is 'Stores tribute memories submitted by family members and guests';
comment on column public.memories.modality is 'Type of memory: text, voice, or photo';
comment on column public.memories.visibility is 'Who can see this memory: only_me, inner_circle, family, or public';
comment on column public.memories.status is 'Moderation status: pending, approved, hidden, or rejected';