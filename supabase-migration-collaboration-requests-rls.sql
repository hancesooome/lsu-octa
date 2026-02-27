-- Run in Supabase: SQL Editor
-- Allows API (anon key) to insert, select, update collaboration_requests

-- Grant table permissions (required even with RLS policies)
GRANT SELECT, INSERT, UPDATE ON public.collaboration_requests TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.collaboration_requests_id_seq TO anon;

-- Enable RLS if not already (required to add policies)
ALTER TABLE public.collaboration_requests ENABLE ROW LEVEL SECURITY;

-- Allow anon to insert (API creates requests when thesis is submitted)
CREATE POLICY "anon_insert_collaboration_requests"
ON public.collaboration_requests FOR INSERT TO anon
WITH CHECK (true);

-- Allow anon to select (API fetches requests for dashboard)
CREATE POLICY "anon_select_collaboration_requests"
ON public.collaboration_requests FOR SELECT TO anon
USING (true);

-- Allow anon to update (API handles accept/decline)
CREATE POLICY "anon_update_collaboration_requests"
ON public.collaboration_requests FOR UPDATE TO anon
USING (true) WITH CHECK (true);
