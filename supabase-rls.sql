-- Run this in Supabase: SQL Editor → New query → paste → Run
-- Your Vercel API uses the anon key; Supabase needs to allow that role to access data.

-- OPTION A: Disable RLS (simplest – anon can do everything)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.theses DISABLE ROW LEVEL SECURITY;

-- OPTION B: Keep RLS on and add policies (more secure)
-- Uncomment and run if you prefer policies instead of disabling RLS:
/*
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon read users" ON public.users;
CREATE POLICY "Allow anon read users" ON public.users FOR SELECT TO anon USING (true);

ALTER TABLE public.theses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all theses" ON public.theses;
CREATE POLICY "Allow anon all theses" ON public.theses FOR ALL TO anon USING (true) WITH CHECK (true);
*/
