-- Run in Supabase: SQL Editor
-- Creates collaboration_requests table for collaborator acceptance flow

CREATE TABLE IF NOT EXISTS public.collaboration_requests (
  id SERIAL PRIMARY KEY,
  thesis_id INTEGER NOT NULL REFERENCES public.theses(id) ON DELETE CASCADE,
  collaborator_user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requester_user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thesis_id, collaborator_user_id)
);
