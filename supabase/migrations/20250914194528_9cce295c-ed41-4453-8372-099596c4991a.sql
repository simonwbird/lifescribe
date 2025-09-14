-- Enable real-time updates for people and relationships tables
ALTER TABLE public.people REPLICA IDENTITY FULL;
ALTER TABLE public.relationships REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.people;
ALTER PUBLICATION supabase_realtime ADD TABLE public.relationships;