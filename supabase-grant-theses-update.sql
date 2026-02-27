-- Run in Supabase: SQL Editor
-- Ensures anon can UPDATE and DELETE theses (collaborator decline, librarian delete)

GRANT UPDATE ON public.theses TO anon;
GRANT DELETE ON public.theses TO anon;
