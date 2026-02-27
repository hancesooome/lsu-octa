-- Run in Supabase: SQL Editor
-- Ensures anon can UPDATE theses (needed when collaborator declines and is removed from thesis)

GRANT UPDATE ON public.theses TO anon;
