-- Run in Supabase: SQL Editor → New query → paste → Run
-- Adds id_number to students (for collaborator lookup) and collaborators to theses

-- 1. Add id_number to users (students only need it; librarians can be null)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS id_number VARCHAR(50) UNIQUE;

-- 2. Add collaborators to theses (array of {id_number, name} for co-researchers)
ALTER TABLE public.theses ADD COLUMN IF NOT EXISTS collaborators JSONB DEFAULT '[]';

-- Optional: create index for id_number lookups
CREATE INDEX IF NOT EXISTS idx_users_id_number ON public.users(id_number);
