-- Restore guest_sessions for events by adding back the event fields
ALTER TABLE public.guest_sessions ADD COLUMN IF NOT EXISTS event_id UUID;
ALTER TABLE public.guest_sessions ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE public.guest_sessions ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE public.guest_sessions ADD COLUMN IF NOT EXISTS created_via_code TEXT;

-- Make magic_link_id nullable since events don't use it
ALTER TABLE public.guest_sessions ALTER COLUMN magic_link_id DROP NOT NULL;

-- Make session_token nullable for event guests
ALTER TABLE public.guest_sessions ALTER COLUMN session_token DROP NOT NULL;
ALTER TABLE public.guest_sessions ALTER COLUMN role_scope DROP NOT NULL;